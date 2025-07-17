import {
  IsString,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsUUID,
  IsHexColor,
} from 'class-validator';

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsString()
  slug: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  icon?: string;

  @IsHexColor()
  @IsOptional()
  color?: string;

  @IsNumber()
  @IsOptional()
  displayOrder?: number = 0;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true;

  @IsUUID('4')
  @IsOptional()
  parentId?: string;
}
