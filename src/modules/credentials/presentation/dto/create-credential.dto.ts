import {
  IsString,
  IsEnum,
  IsOptional,
  IsObject,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CredentialType } from '../../domain/entities/credential.entity';

export class CreateCredentialDto {
  @ApiProperty({
    description: 'Name of the credential',
    example: 'My Google Account',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Type of credential',
    enum: CredentialType,
    example: CredentialType.OAUTH2,
  })
  @IsEnum(CredentialType)
  type: CredentialType;

  @ApiProperty({
    description: 'Service identifier',
    example: 'google',
  })
  @IsString()
  service: string;

  @ApiProperty({
    description: 'Credential data to be encrypted',
    example: { access_token: 'xxx', refresh_token: 'yyy' },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Additional configuration',
    example: { scopes: ['gmail.readonly'] },
  })
  @IsOptional()
  @IsObject()
  configuration?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Whether the credential is active',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
