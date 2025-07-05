import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrganizationRole } from '../../domain/entities/organization-member.entity';

export class InviteMemberDto {
  @ApiProperty({
    description: 'Email address of the user to invite',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Role to assign to the invited member',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  @IsOptional()
  @IsEnum(OrganizationRole)
  role?: OrganizationRole;
}
