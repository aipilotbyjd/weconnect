import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
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
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CurrentUser } from '../../../auth/presentation/decorators/current-user.decorator';
import { User } from '../../../auth/domain/entities/user.entity';
import {
  CredentialSharingService,
  CreateShareDto,
  UpdateShareDto,
  ShareListFilters,
} from '../../application/services/credential-sharing.service';
import { CredentialShare } from '../../domain/entities/credential-share.entity';
import {
  SharePermission,
  ShareStatus,
} from '../../domain/enums/credential-share.enum';

class CreateCredentialShareDto {
  credentialId: string;
  sharedWithUserId: string;
  permissions: SharePermission[];
  expiresAt?: Date;
  note?: string;
}

class UpdateCredentialShareDto {
  permissions?: SharePermission[];
  expiresAt?: Date;
  status?: ShareStatus;
  note?: string;
}

class ShareStatsResponseDto {
  sharesGiven: number;
  sharesReceived: number;
  activeShares: number;
  expiredShares: number;
}

@ApiTags('Credential Sharing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('credential-shares')
export class CredentialSharingController {
  constructor(
    private readonly credentialSharingService: CredentialSharingService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Share a credential with another user' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Credential shared successfully',
    type: CredentialShare,
  })
  async shareCredential(
    @CurrentUser() user: User,
    @Body() createShareDto: CreateCredentialShareDto,
  ): Promise<CredentialShare> {
    return this.credentialSharingService.shareCredential(
      user.id,
      createShareDto,
    );
  }

  @Put(':shareId')
  @ApiOperation({ summary: 'Update credential share permissions' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Share updated successfully',
    type: CredentialShare,
  })
  async updateShare(
    @CurrentUser() user: User,
    @Param('shareId', ParseUUIDPipe) shareId: string,
    @Body() updateShareDto: UpdateCredentialShareDto,
  ): Promise<CredentialShare> {
    return this.credentialSharingService.updateShare(
      shareId,
      user.id,
      updateShareDto,
    );
  }

  @Delete(':shareId')
  @ApiOperation({ summary: 'Revoke credential share' })
  @ApiParam({ name: 'shareId', description: 'Share ID' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Share revoked successfully',
  })
  async revokeShare(
    @CurrentUser() user: User,
    @Param('shareId', ParseUUIDPipe) shareId: string,
  ): Promise<void> {
    return this.credentialSharingService.revokeShare(shareId, user.id);
  }

  @Get('shared-with-me')
  @ApiOperation({ summary: 'Get credentials shared with current user' })
  @ApiQuery({
    name: 'credentialId',
    required: false,
    description: 'Filter by credential ID',
  })
  @ApiQuery({
    name: 'permission',
    required: false,
    enum: SharePermission,
    description: 'Filter by permission',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of shared credentials',
    type: [CredentialShare],
  })
  async getSharedCredentials(
    @CurrentUser() user: User,
    @Query('credentialId') credentialId?: string,
    @Query('permission') permission?: SharePermission,
  ): Promise<CredentialShare[]> {
    const filters: ShareListFilters = {};
    if (credentialId) filters.credentialId = credentialId;
    if (permission) filters.permission = permission;

    return this.credentialSharingService.getSharedCredentials(user.id, filters);
  }

  @Get('shared-by-me/:credentialId')
  @ApiOperation({ summary: 'Get shares for a specific credential' })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of credential shares',
    type: [CredentialShare],
  })
  async getCredentialShares(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
  ): Promise<CredentialShare[]> {
    return this.credentialSharingService.getCredentialShares(
      credentialId,
      user.id,
    );
  }

  @Get('accessible')
  @ApiOperation({ summary: 'Get all credentials accessible to current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of accessible credentials',
  })
  async getAccessibleCredentials(@CurrentUser() user: User) {
    return this.credentialSharingService.getAccessibleCredentials(user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get sharing statistics for current user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Sharing statistics',
    type: ShareStatsResponseDto,
  })
  async getShareStatistics(
    @CurrentUser() user: User,
  ): Promise<ShareStatsResponseDto> {
    return this.credentialSharingService.getShareStatistics(user.id);
  }

  @Post('cleanup-expired')
  @ApiOperation({ summary: 'Cleanup expired shares' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Number of cleaned up shares',
  })
  async cleanupExpiredShares(): Promise<{ cleaned: number }> {
    const cleaned = await this.credentialSharingService.cleanupExpiredShares();
    return { cleaned };
  }

  @Get('check-permission/:credentialId/:permission')
  @ApiOperation({
    summary: 'Check if user has specific permission for credential',
  })
  @ApiParam({ name: 'credentialId', description: 'Credential ID' })
  @ApiParam({
    name: 'permission',
    enum: SharePermission,
    description: 'Permission to check',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Permission check result',
  })
  async checkPermission(
    @CurrentUser() user: User,
    @Param('credentialId', ParseUUIDPipe) credentialId: string,
    @Param('permission') permission: SharePermission,
  ): Promise<{ hasPermission: boolean }> {
    const hasPermission = await this.credentialSharingService.hasPermission(
      credentialId,
      user.id,
      permission,
    );
    return { hasPermission };
  }
}
