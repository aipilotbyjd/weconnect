import { IsString, IsOptional, IsEnum, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationPlan } from '../../domain/entities/organization.entity';

export class CreateOrganizationDto {
  @ApiProperty({
    description: 'Organization name',
    example: 'My Company',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Organization description',
    example: 'We build awesome automation workflows',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Organization website',
    example: 'https://mycompany.com',
  })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'Organization plan',
    enum: OrganizationPlan,
    default: OrganizationPlan.FREE,
  })
  @IsOptional()
  @IsEnum(OrganizationPlan)
  plan?: OrganizationPlan;
}
