import { IsString, IsEnum, IsOptional, IsArray, IsNumber, Min, Max, IsBoolean, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateVisibility, TemplateTier, TemplateStatus } from '../../domain/entities/workflow-template.entity';

export enum TemplateSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  POPULAR = 'popular',
  RATING = 'rating',
  PRICE_LOW_TO_HIGH = 'price_low_to_high',
  PRICE_HIGH_TO_LOW = 'price_high_to_low',
  NAME = 'name',
}

export class SearchTemplatesDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  categoryIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @IsEnum(TemplateVisibility, { each: true })
  @IsArray()
  @IsOptional()
  visibility?: TemplateVisibility[];

  @IsEnum(TemplateTier, { each: true })
  @IsArray()
  @IsOptional()
  tiers?: TemplateTier[];

  @IsEnum(TemplateStatus, { each: true })
  @IsArray()
  @IsOptional()
  statuses?: TemplateStatus[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Type(() => Number)
  minPrice?: number;

  @IsNumber()
  @IsOptional()
  @Type(() => Number)
  maxPrice?: number;

  @IsNumber()
  @Min(0)
  @Max(5)
  @IsOptional()
  @Type(() => Number)
  minRating?: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isFeatured?: boolean;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  isOfficial?: boolean;

  @IsUUID('4')
  @IsOptional()
  creatorId?: string;

  @IsUUID('4')
  @IsOptional()
  organizationId?: string;

  @IsEnum(TemplateSortBy)
  @IsOptional()
  sortBy?: TemplateSortBy = TemplateSortBy.POPULAR;

  @IsNumber()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
