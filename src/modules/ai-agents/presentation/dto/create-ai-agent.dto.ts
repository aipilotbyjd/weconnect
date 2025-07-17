import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
} from 'class-validator';
import { AIProvider } from '../../application/services/ai-provider.service';
import { MemoryType } from '../../domain/entities/ai-agent-memory.entity';

export class CreateAIAgentRequestDto {
  @ApiProperty({
    description: 'Agent name',
    example: 'Customer Support Assistant',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Agent description',
    example: 'Helps customers with their inquiries',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'AI provider',
    enum: AIProvider,
    example: AIProvider.OPENAI,
  })
  @IsEnum(AIProvider)
  provider: AIProvider;

  @ApiProperty({ description: 'Model name', example: 'gpt-4' })
  @IsString()
  model: string;

  @ApiProperty({
    description: 'System prompt for the agent',
    example: 'You are a helpful customer support assistant.',
    required: false,
  })
  @IsOptional()
  @IsString()
  systemPrompt?: string;

  @ApiProperty({
    description: 'Temperature for model randomness (0-2)',
    example: 0.7,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiProperty({
    description: 'Maximum tokens for response',
    example: 1000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @ApiProperty({
    description: 'List of tool names to enable',
    example: ['http_request', 'text_processor'],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tools?: string[];

  @ApiProperty({
    description: 'Memory type for the agent',
    enum: MemoryType,
    example: MemoryType.CONVERSATION,
    required: false,
  })
  @IsOptional()
  @IsEnum(MemoryType)
  memoryType?: MemoryType;
}
