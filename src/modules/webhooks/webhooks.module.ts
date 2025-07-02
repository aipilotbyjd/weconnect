import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// Presentation Layer
import { WebhooksController } from './presentation/controllers/webhooks.controller';

// Application Layer
import { WebhooksService } from './application/services/webhooks.service';
import { CreateWebhookUseCase } from './application/use-cases/create-webhook.use-case';
import { TriggerWebhookUseCase } from './application/use-cases/trigger-webhook.use-case';

// Domain Layer
import { Webhook } from './domain/entities/webhook.entity';

// Import from other modules
import { ExecutionsModule } from '../executions/executions.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Webhook]),
    ExecutionsModule,
  ],
  controllers: [WebhooksController],
  providers: [
    WebhooksService,
    CreateWebhookUseCase,
    TriggerWebhookUseCase,
  ],
  exports: [WebhooksService],
})
export class WebhooksModule {}
