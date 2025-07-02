import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook, WebhookMethod } from '../core/infrastructure/database/entities/webhook.entity';
import { ExecutionsService } from '../executions/executions.service';
import { ExecutionMode } from '../core/infrastructure/database/entities/execution.entity';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly executionsService: ExecutionsService,
  ) {}

  async createWebhook(workflowId: string, name: string, userId: string): Promise<Webhook> {
    const path = `${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
    
    const webhook = this.webhookRepository.create({
      name,
      path,
      workflowId,
      userId,
    });

    return this.webhookRepository.save(webhook);
  }

  async findAll(userId: string): Promise<Webhook[]> {
    return this.webhookRepository.find({
      where: { userId },
      relations: ['workflow'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPath(path: string): Promise<Webhook> {
    const webhook = await this.webhookRepository.findOne({
      where: { path, isActive: true },
      relations: ['workflow', 'user'],
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    return webhook;
  }

  async triggerWebhook(path: string, method: string, headers: any, body: any): Promise<any> {
    const webhook = await this.findByPath(path);

    if (webhook.method !== method.toUpperCase()) {
      throw new BadRequestException(`Method ${method} not allowed for this webhook`);
    }

    if (!webhook.workflow.isActive) {
      throw new BadRequestException('Associated workflow is not active');
    }

    // Update webhook stats
    webhook.requestCount += 1;
    webhook.lastTriggeredAt = new Date();
    await this.webhookRepository.save(webhook);

    // Start workflow execution
    const execution = await this.executionsService.startExecution(
      webhook.workflowId,
      {
        mode: ExecutionMode.WEBHOOK,
        inputData: {
          webhook: {
            path,
            method,
            headers,
            body,
            triggeredAt: new Date(),
          },
          ...body,
        },
      },
      webhook.userId,
    );

    return {
      success: true,
      executionId: execution.id,
      message: 'Webhook triggered successfully',
    };
  }

  async deleteWebhook(id: string, userId: string): Promise<void> {
    const webhook = await this.webhookRepository.findOne({
      where: { id, userId },
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

    await this.webhookRepository.remove(webhook);
  }
}
