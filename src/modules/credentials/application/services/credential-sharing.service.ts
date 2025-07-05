import { Injectable, Logger, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential } from '../../domain/entities/credential.entity';
import { CredentialShare } from '../../domain/entities/credential-share.entity';
import { SharePermission, ShareStatus } from '../../domain/enums/credential-share.enum';

export interface CreateShareDto {
  credentialId: string;
  sharedWithUserId: string;
  permissions: SharePermission[];
  expiresAt?: Date;
  note?: string;
}

export interface UpdateShareDto {
  permissions?: SharePermission[];
  expiresAt?: Date;
  status?: ShareStatus;
  note?: string;
}

export interface ShareListFilters {
  credentialId?: string;
  sharedByUserId?: string;
  sharedWithUserId?: string;
  status?: ShareStatus;
  permission?: SharePermission;
}

@Injectable()
export class CredentialSharingService {
  private readonly logger = new Logger(CredentialSharingService.name);

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(CredentialShare)
    private shareRepository: Repository<CredentialShare>,
  ) {}

  async shareCredential(
    ownerId: string,
    createShareDto: CreateShareDto,
  ): Promise<CredentialShare> {
    // Verify credential ownership
    const credential = await this.credentialRepository.findOne({
      where: { id: createShareDto.credentialId, userId: ownerId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    // Check if share already exists
    const existingShare = await this.shareRepository.findOne({
      where: {
        credentialId: createShareDto.credentialId,
        sharedWithUserId: createShareDto.sharedWithUserId,
        status: ShareStatus.ACTIVE,
      },
    });

    if (existingShare) {
      throw new ForbiddenException('Credential is already shared with this user');
    }

    // Create new share
    const share = this.shareRepository.create({
      credentialId: createShareDto.credentialId,
      sharedByUserId: ownerId,
      sharedWithUserId: createShareDto.sharedWithUserId,
      permissions: createShareDto.permissions,
      expiresAt: createShareDto.expiresAt,
      note: createShareDto.note,
      status: ShareStatus.ACTIVE,
      sharedAt: new Date(),
    });

    const savedShare = await this.shareRepository.save(share);

    this.logger.log(
      `Credential ${createShareDto.credentialId} shared by ${ownerId} with ${createShareDto.sharedWithUserId}`
    );

    return savedShare;
  }

  async updateShare(
    shareId: string,
    ownerId: string,
    updateShareDto: UpdateShareDto,
  ): Promise<CredentialShare> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
      relations: ['credential'],
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Verify ownership
    if (share.sharedByUserId !== ownerId) {
      throw new ForbiddenException('Not authorized to update this share');
    }

    // Update share properties
    if (updateShareDto.permissions !== undefined) {
      share.permissions = updateShareDto.permissions;
    }
    if (updateShareDto.expiresAt !== undefined) {
      share.expiresAt = updateShareDto.expiresAt;
    }
    if (updateShareDto.status !== undefined) {
      share.status = updateShareDto.status;
    }
    if (updateShareDto.note !== undefined) {
      share.note = updateShareDto.note;
    }

    share.updatedAt = new Date();

    const updatedShare = await this.shareRepository.save(share);

    this.logger.log(`Share ${shareId} updated by ${ownerId}`);

    return updatedShare;
  }

  async revokeShare(shareId: string, ownerId: string): Promise<void> {
    const share = await this.shareRepository.findOne({
      where: { id: shareId },
      relations: ['credential'],
    });

    if (!share) {
      throw new NotFoundException('Share not found');
    }

    // Allow both owner and recipient to revoke
    if (share.sharedByUserId !== ownerId && share.sharedWithUserId !== ownerId) {
      throw new ForbiddenException('Not authorized to revoke this share');
    }

    share.status = ShareStatus.REVOKED;
    share.revokedAt = new Date();
    share.revokedByUserId = ownerId;

    await this.shareRepository.save(share);

    this.logger.log(`Share ${shareId} revoked by ${ownerId}`);
  }

  async getSharedCredentials(userId: string, filters?: ShareListFilters): Promise<CredentialShare[]> {
    const queryBuilder = this.shareRepository
      .createQueryBuilder('share')
      .leftJoinAndSelect('share.credential', 'credential')
      .where('share.sharedWithUserId = :userId', { userId })
      .andWhere('share.status = :status', { status: ShareStatus.ACTIVE });

    // Apply filters
    if (filters?.credentialId) {
      queryBuilder.andWhere('share.credentialId = :credentialId', {
        credentialId: filters.credentialId,
      });
    }

    if (filters?.permission) {
      queryBuilder.andWhere(':permission = ANY(share.permissions)', {
        permission: filters.permission,
      });
    }

    // Check expiration
    queryBuilder.andWhere(
      '(share.expiresAt IS NULL OR share.expiresAt > :now)',
      { now: new Date() }
    );

    const shares = await queryBuilder.getMany();

    return shares;
  }

  async getCredentialShares(credentialId: string, ownerId: string): Promise<CredentialShare[]> {
    // Verify credential ownership
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId: ownerId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    const shares = await this.shareRepository.find({
      where: { credentialId },
      order: { sharedAt: 'DESC' },
    });

    return shares;
  }

  async hasPermission(
    credentialId: string,
    userId: string,
    permission: SharePermission,
  ): Promise<boolean> {
    // Check if user owns the credential
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (credential) {
      return true; // Owner has all permissions
    }

    // Check if user has shared access with required permission
    const share = await this.shareRepository.findOne({
      where: {
        credentialId,
        sharedWithUserId: userId,
        status: ShareStatus.ACTIVE,
      },
    });

    if (!share) {
      return false;
    }

    // Check expiration
    if (share.expiresAt && share.expiresAt < new Date()) {
      return false;
    }

    // Check if user has the required permission
    return share.permissions.includes(permission);
  }

  async getAccessibleCredentials(userId: string): Promise<Credential[]> {
    // Get owned credentials
    const ownedCredentials = await this.credentialRepository.find({
      where: { userId },
    });

    // Get shared credentials
    const sharedCredentials = await this.credentialRepository
      .createQueryBuilder('credential')
      .innerJoin('credential.shares', 'share')
      .where('share.sharedWithUserId = :userId', { userId })
      .andWhere('share.status = :status', { status: ShareStatus.ACTIVE })
      .andWhere('(share.expiresAt IS NULL OR share.expiresAt > :now)', { now: new Date() })
      .getMany();

    // Combine and deduplicate
    const allCredentials = [...ownedCredentials, ...sharedCredentials];
    const uniqueCredentials = allCredentials.filter(
      (credential, index, self) =>
        index === self.findIndex(c => c.id === credential.id)
    );

    return uniqueCredentials;
  }

  async cleanupExpiredShares(): Promise<number> {
    const result = await this.shareRepository.update(
      {
        status: ShareStatus.ACTIVE,
        expiresAt: Repository.LessThan(new Date()),
      },
      {
        status: ShareStatus.EXPIRED,
      }
    );

    const affectedRows = result.affected || 0;
    this.logger.log(`Cleaned up ${affectedRows} expired shares`);

    return affectedRows;
  }

  async getShareStatistics(userId: string): Promise<{
    sharesGiven: number;
    sharesReceived: number;
    activeShares: number;
    expiredShares: number;
  }> {
    const [sharesGiven, sharesReceived, activeShares, expiredShares] = await Promise.all([
      this.shareRepository.count({ where: { sharedByUserId: userId } }),
      this.shareRepository.count({ where: { sharedWithUserId: userId } }),
      this.shareRepository.count({ 
        where: { 
          sharedByUserId: userId, 
          status: ShareStatus.ACTIVE 
        } 
      }),
      this.shareRepository.count({ 
        where: { 
          sharedByUserId: userId, 
          status: ShareStatus.EXPIRED 
        } 
      }),
    ]);

    return {
      sharesGiven,
      sharesReceived,
      activeShares,
      expiredShares,
    };
  }
}
