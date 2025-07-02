import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Webhook } from '../../domain/entities/webhook.entity';
import { CreateWebhookDto } from '../../presentation/dto/create-webhook.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CreateWebhookUseCase {
  constructor(
    @InjectRepository(Webhook)
    private readonly webhookRepository: Repository<Webhook>,
  ) {}

  async execute(workflowId: string, createWebhookDto: CreateWebhookDto, userId: string): Promise<Webhook> {
    // Generate unique path
    const path = `${createWebhookDto.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${uuidv4().substring(0, 8)}`;
    
    const webhook = this.webhookRepository.create({
      ...createWebhookDto,
      path,
      workflowId,
      userId,
    });

    return this.webhookRepository.save(webhook);
  }
}
