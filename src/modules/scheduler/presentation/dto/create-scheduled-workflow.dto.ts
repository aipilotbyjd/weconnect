import { IsString, IsOptional, IsObject, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateScheduledWorkflowDto {
  @ApiProperty({ description: 'Name of the scheduled workflow' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Description of the scheduled workflow',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cron expression for scheduling',
    example: '0 0 * * *',
    examples: {
      'Every day at midnight': '0 0 * * *',
      'Every hour': '0 * * * *',
      'Every 5 minutes': '*/5 * * * *',
      'Every Monday at 9 AM': '0 9 * * 1',
      'First day of month at noon': '0 12 1 * *',
    },
  })
  @IsString()
  @Matches(
    /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/,
  )
  cronExpression: string;

  @ApiProperty({
    description: 'Timezone for the schedule',
    default: 'UTC',
    example: 'America/New_York',
  })
  @IsString()
  @IsOptional()
  timezone?: string;

  @ApiProperty({
    description: 'Input data to pass to the workflow on each execution',
    required: false,
  })
  @IsObject()
  @IsOptional()
  inputData?: Record<string, any>;
}
