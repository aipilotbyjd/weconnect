import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';
import { WebhookMethod } from '../../domain/entities/webhook.entity';

export class CreateWebhookDto {
  @ApiProperty({ description: 'Webhook name', example: 'User Registration Webhook' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'HTTP method', enum: WebhookMethod, required: false })
  @IsOptional()
  @IsEnum(WebhookMethod)
  method?: WebhookMethod;

  @ApiProperty({ description: 'Expected headers for validation', required: false })
  @IsOptional()
  expectedHeaders?: Record<string, string>;

  @ApiProperty({ description: 'Webhook secret for validation', required: false })
  @IsOptional()
  @IsString()
  secret?: string;
}
