import { PartialType } from '@nestjs/swagger';
import { CreateScheduledWorkflowDto } from './create-scheduled-workflow.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ScheduleStatus } from '../../domain/entities/scheduled-workflow.entity';

export class UpdateScheduledWorkflowDto extends PartialType(CreateScheduledWorkflowDto) {
  @ApiProperty({ 
    description: 'Status of the scheduled workflow',
    enum: ScheduleStatus,
    required: false
  })
  @IsEnum(ScheduleStatus)
  @IsOptional()
  status?: ScheduleStatus;
}
