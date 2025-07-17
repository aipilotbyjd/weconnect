import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class TestAgentRequestDto {
  @ApiProperty({
    description: 'Test prompt for the agent',
    example: 'Hello, how are you?',
    required: false,
  })
  @IsOptional()
  @IsString()
  prompt?: string = 'Hello, how are you?';
}
