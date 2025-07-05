import { PartialType } from '@nestjs/mapped-types';
import { CreateTemplateDto } from './create-template.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TemplateStatus } from '../../domain/entities/workflow-template.entity';

export class UpdateTemplateDto extends PartialType(CreateTemplateDto) {
  @IsEnum(TemplateStatus)
  @IsOptional()
  status?: TemplateStatus;

  @IsString()
  @IsOptional()
  rejectionReason?: string;
}
