import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsObject } from 'class-validator';
import { ExecutionMode } from '../../core/infrastructure/database/entities/execution.entity';

export class StartExecutionDto {
  @ApiProperty({ description: 'Execution mode', enum: ExecutionMode, required: false })
  @IsOptional()
  @IsEnum(ExecutionMode)
  mode?: ExecutionMode;

  @ApiProperty({ description: 'Input data for execution', required: false, example: { email: 'test@example.com' } })
  @IsOptional()
  @IsObject()
  inputData?: Record<string, any>;
}
