import {
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsNumber,
  IsUrl,
  ValidateNested,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TemplateVisibility,
  TemplateTier,
} from '../../domain/entities/workflow-template.entity';

class WorkflowDefinitionDto {
  @IsArray()
  nodes: any[];

  @IsArray()
  connections: any[];

  @IsObject()
  settings: Record<string, any>;
}

class RequiredCredentialDto {
  @IsString()
  type: string;

  @IsString()
  name: string;

  @IsString()
  description: string;
}

class VariableDto {
  @IsString()
  name: string;

  @IsString()
  type: string;

  @IsOptional()
  defaultValue?: any;

  @IsBoolean()
  required: boolean;

  @IsString()
  @IsOptional()
  description?: string;
}

class MetadataDto {
  @IsString()
  version: string;

  @IsString()
  author: string;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsUrl()
  @IsOptional()
  supportUrl?: string;

  @IsUrl()
  @IsOptional()
  documentationUrl?: string;

  @IsUrl()
  @IsOptional()
  videoUrl?: string;
}

export class CreateTemplateDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  longDescription?: string;

  @ValidateNested()
  @Type(() => WorkflowDefinitionDto)
  workflowDefinition: WorkflowDefinitionDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequiredCredentialDto)
  @IsOptional()
  requiredCredentials?: RequiredCredentialDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariableDto)
  @IsOptional()
  variables?: VariableDto[];

  @IsEnum(TemplateVisibility)
  @IsOptional()
  visibility?: TemplateVisibility = TemplateVisibility.PRIVATE;

  @IsEnum(TemplateTier)
  @IsOptional()
  tier?: TemplateTier = TemplateTier.FREE;

  @IsNumber()
  @IsOptional()
  price?: number = 0;

  @IsUrl()
  @IsOptional()
  iconUrl?: string;

  @IsUrl()
  @IsOptional()
  previewUrl?: string;

  @IsArray()
  @IsUrl({}, { each: true })
  @IsOptional()
  screenshots?: string[];

  @IsArray()
  @IsString({ each: true })
  tags: string[];

  @ValidateNested()
  @Type(() => MetadataDto)
  @IsOptional()
  metadata?: MetadataDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsString()
  @IsOptional()
  organizationId?: string;
}
