import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { User } from '../../../auth/domain/entities/user.entity';
import {
  CredentialRotationService,
  RotationPolicy,
  CreateRotationDto,
  RotationResult,
} from '../../application/services/credential-rotation.service';
import { CredentialRotation } from '../../domain/entities/credential-rotation.entity';
import { RotationType } from '../../domain/enums/credential-rotation.enum';
import { Credential } from '../../domain/entities/credential.entity';

class CreateRotationPolicyDto {
  enabled: boolean;
  rotationType: RotationType;
  rotationIntervalDays: number;
  warningDays: number;
  maxAge: number;
  retainVersions: number;
  autoRotate: boolean;
}

class UpdateRotationPolicyDto {
  enabled?: boolean;
  rotationType?: RotationType;
  rotationIntervalDays?: number;
  warningDays?: number;
  maxAge?: number;
  retainVersions?: number;
  autoRotate?: boolean;
}

class ScheduleRotationDto {
  rotationType: RotationType;
  scheduledAt?: Date;
  policy?: Partial<RotationPolicy>;
}

class RotationResultDto {
  success: boolean;
  oldCredentialId: string;
  newCredentialId?: string;
  error?: string;
  rotatedAt: Date;
}

class CredentialsNeedingRotationDto {
  immediate: Credential[];
  warning: Credential[];
  overdue: Credential[];
}

@ApiTags('Credential Rotation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credential-rotation')
export class CredentialRotationController {
  constructor(
    private readonly credentialRotationService: CredentialRotationService,
  ) {}

  @Post(':credentialId/policy')
  @ApiOperation({ summary: 'Create rotation policy for credential' })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rotation policy created successfully',
    type: CredentialRotation,
  })
  async createRotationPolicy(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Body() policy: CreateRotationPolicyDto,
  ): Promise<CredentialRotation> {
    return this.credentialRotationService.createRotationPolicy(
      credentialId,
      user.id,
      policy,
    );
  }

  @Put('policy/:rotationId')
  @ApiOperation({ summary: 'Update rotation policy' })
  @ApiParam({ name: 'rotationId', description: 'Rotation ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rotation policy updated successfully',
    type: CredentialRotation,
  })
  async updateRotationPolicy(
    @CurrentUser() user: User,
    @Param('rotationId', ParseUUIDPipe) rotationId: string,
    @Body() policy: UpdateRotationPolicyDto,
  ): Promise<CredentialRotation> {
    return this.credentialRotationService.updateRotationPolicy(
      rotationId,
      user.id,
      policy,
    );
  }

  @Post(':credentialId/schedule')
  @ApiOperation({ summary: 'Schedule credential rotation' })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Rotation scheduled successfully',
    type: CredentialRotation,
  })
  async scheduleRotation(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Body() scheduleDto: ScheduleRotationDto,
  ): Promise<CredentialRotation> {
    const createRotationDto: CreateRotationDto = {
      credentialId,
      rotationType: scheduleDto.rotationType,
      scheduledAt: scheduleDto.scheduledAt,
      policy: scheduleDto.policy,
    };

    return this.credentialRotationService.scheduleRotation(
      credentialId,
      user.id,
      createRotationDto,
    );
  }

  @Post(':credentialId/rotate')
  @ApiOperation({ summary: 'Rotate credential immediately' })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credential rotated successfully',
    type: RotationResultDto,
  })
  async rotateCredential(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Body() body: { rotationType?: RotationType },
  ): Promise<RotationResult> {
    return this.credentialRotationService.rotateCredential(
      credentialId,
      user.id,
      body.rotationType,
    );
  }

  @Get(':credentialId/history')
  @ApiOperation({ summary: 'Get rotation history for credential' })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rotation history',
    type: [CredentialRotation],
  })
  async getRotationHistory(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
  ): Promise<CredentialRotation[]> {
    return this.credentialRotationService.getRotationHistory(
      credentialId,
      user.id,
    );
  }

  @Get('needing-rotation')
  @ApiOperation({ summary: 'Get credentials that need rotation' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Credentials needing rotation',
    type: CredentialsNeedingRotationDto,
  })
  async getCredentialsNeedingRotation(
    @CurrentUser() user: User,
  ): Promise<CredentialsNeedingRotationDto> {
    return this.credentialRotationService.getCredentialsNeedingRotation(
      user.id,
    );
  }

  @Post('process-scheduled')
  @ApiOperation({ summary: 'Process scheduled rotations (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Scheduled rotations processed',
  })
  async processScheduledRotations(): Promise<{ message: string }> {
    await this.credentialRotationService.processScheduledRotations();
    return { message: 'Scheduled rotations processed successfully' };
  }

  @Post('process-auto')
  @ApiOperation({ summary: 'Process automatic rotations (admin only)' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Automatic rotations processed',
  })
  async processAutoRotations(): Promise<{ message: string }> {
    await this.credentialRotationService.processAutoRotations();
    return { message: 'Automatic rotations processed successfully' };
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get rotation dashboard data' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Rotation dashboard data',
  })
  async getRotationDashboard(@CurrentUser() user: User) {
    const needingRotation =
      await this.credentialRotationService.getCredentialsNeedingRotation(
        user.id,
      );

    const totalCredentials =
      needingRotation.immediate.length +
      needingRotation.warning.length +
      needingRotation.overdue.length;

    return {
      summary: {
        totalCredentials,
        immediate: needingRotation.immediate.length,
        warning: needingRotation.warning.length,
        overdue: needingRotation.overdue.length,
      },
      credentials: needingRotation,
    };
  }
}
