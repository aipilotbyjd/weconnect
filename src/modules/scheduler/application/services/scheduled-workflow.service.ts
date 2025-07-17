import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ScheduledWorkflow,
  ScheduleStatus,
} from '../../domain/entities/scheduled-workflow.entity';
import { Workflow } from '../../../workflows/domain/entities/workflow.entity';
import { SchedulerService } from './scheduler.service';
import { CreateScheduledWorkflowDto } from '../../presentation/dto/create-scheduled-workflow.dto';
import { UpdateScheduledWorkflowDto } from '../../presentation/dto/update-scheduled-workflow.dto';
const cronParser = require('cron-parser');

@Injectable()
export class ScheduledWorkflowService {
  constructor(
    @InjectRepository(ScheduledWorkflow)
    private scheduledWorkflowRepository: Repository<ScheduledWorkflow>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    private schedulerService: SchedulerService,
  ) {}

  async create(
    workflowId: string,
    userId: string,
    dto: CreateScheduledWorkflowDto,
  ): Promise<ScheduledWorkflow> {
    // Validate workflow exists and belongs to user
    const workflow = await this.workflowRepository.findOne({
      where: { id: workflowId, userId },
    });

    if (!workflow) {
      throw new NotFoundException('Workflow not found');
    }

    // Validate cron expression
    try {
      cronParser.parseExpression(dto.cronExpression);
    } catch (error) {
      throw new BadRequestException('Invalid cron expression');
    }

    // Create scheduled workflow
    const scheduledWorkflow = await this.scheduledWorkflowRepository.save({
      workflowId,
      userId,
      organizationId: workflow.organizationId,
      name: dto.name,
      description: dto.description,
      cronExpression: dto.cronExpression,
      timezone: dto.timezone || 'UTC',
      inputData: dto.inputData || {},
      status: ScheduleStatus.ACTIVE,
    });

    // Schedule the workflow
    await this.schedulerService.scheduleWorkflow(scheduledWorkflow);

    return scheduledWorkflow;
  }

  async findAll(userId: string): Promise<ScheduledWorkflow[]> {
    return this.scheduledWorkflowRepository.find({
      where: { userId },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ScheduledWorkflow> {
    const schedule = await this.scheduledWorkflowRepository.findOne({
      where: { id, userId },
      relations: ['workflow'],
    });

    if (!schedule) {
      throw new NotFoundException('Scheduled workflow not found');
    }

    return schedule;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateScheduledWorkflowDto,
  ): Promise<ScheduledWorkflow> {
    const schedule = await this.findOne(id, userId);

    // Validate cron expression if provided
    if (dto.cronExpression) {
      try {
        cronParser.parseExpression(dto.cronExpression);
      } catch (error) {
        throw new BadRequestException('Invalid cron expression');
      }
    }

    // Update the schedule
    Object.assign(schedule, dto);
    const updated = await this.scheduledWorkflowRepository.save(schedule);

    // Reschedule if cron expression or status changed
    if (dto.cronExpression || dto.status) {
      if (updated.status === ScheduleStatus.ACTIVE) {
        await this.schedulerService.scheduleWorkflow(updated);
      } else {
        await this.schedulerService.removeSchedule(
          `scheduled-workflow-${updated.id}`,
        );
      }
    }

    return updated;
  }

  async pause(id: string, userId: string): Promise<ScheduledWorkflow> {
    const schedule = await this.findOne(id, userId);
    await this.schedulerService.pauseSchedule(id);
    return this.findOne(id, userId);
  }

  async resume(id: string, userId: string): Promise<ScheduledWorkflow> {
    const schedule = await this.findOne(id, userId);
    await this.schedulerService.resumeSchedule(id);
    return this.findOne(id, userId);
  }

  async delete(id: string, userId: string): Promise<void> {
    const schedule = await this.findOne(id, userId);

    // Remove from scheduler
    await this.schedulerService.removeSchedule(`scheduled-workflow-${id}`);

    // Mark as deleted (soft delete)
    await this.scheduledWorkflowRepository.update(id, {
      status: ScheduleStatus.DELETED,
    });
  }

  async getNextExecutions(
    id: string,
    userId: string,
    count: number = 5,
  ): Promise<Date[]> {
    const schedule = await this.findOne(id, userId);

    try {
      const options = schedule.timezone ? { tz: schedule.timezone } : {};
      const interval = cronParser.parseExpression(
        schedule.cronExpression,
        options,
      );

      const executions: Date[] = [];
      for (let i = 0; i < count; i++) {
        executions.push(interval.next().toDate());
      }

      return executions;
    } catch (error) {
      throw new BadRequestException('Invalid cron expression');
    }
  }
}
