import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../../domain/entities/webhook.entity';
import { ExecutionsService } from '../../../executions/application/services/executions.service';
import { ExecutionMode } from '../../../executions/domain/entities/execution.entity';

@Injectable()
export class TriggerWebhookUseCase {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
    private readonly executionsService: ExecutionsService,
  ) {}

  async execute(path: string, method: string, headers: any, body: any): Promise<any> {
    const webhook = await this.webhookRepository.findOne({
      where: { path, isActive: true },
      relations: ['workflow', 'user'],
    });

    if (!webhook) {
      throw new NotFoundException('Webhook not found');
    }

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
}
