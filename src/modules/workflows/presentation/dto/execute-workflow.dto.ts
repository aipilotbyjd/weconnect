import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsObject,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { ExecutionMode } from '../../domain/entities/workflow-execution.entity';

export class ExecuteWorkflowDto {
  @ApiProperty({
    description: 'Execution mode',
    enum: ExecutionMode,
    default: ExecutionMode.MANUAL,
    required: false,
  })
  @IsOptional()
  @IsEnum(ExecutionMode)
  mode?: ExecutionMode = ExecutionMode.MANUAL;

  @ApiProperty({
    description: 'Input data for the workflow execution',
    example: { userId: '123', email: 'user@example.com' },
    required: false,
  })
  @IsOptional()
  @IsObject()
  inputData?: Record<string, any>;

  @ApiProperty({
    description: 'Execution timeout in milliseconds',
    example: 300000,
    minimum: 1000,
    maximum: 3600000,
    default: 300000,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1000) // Minimum 1 second
  @Max(3600000) // Maximum 1 hour
  timeout?: number = 300000;
}
