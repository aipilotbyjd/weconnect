import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { CredentialSharingService } from '../credential-sharing.service';
import { Credential } from '../../../domain/entities/credential.entity';
import { CredentialShare } from '../../../domain/entities/credential-share.entity';
import { SharePermission, ShareStatus } from '../../../domain/enums/credential-share.enum';

describe('CredentialSharingService', () => {
  let service: CredentialSharingService;
  let credentialRepository: jest.Mocked<Repository<Credential>>;
  let shareRepository: jest.Mocked<Repository<CredentialShare>>;

  const mockCredential = {
    id: 'cred-123',
    userId: 'user-1',
    name: 'Test Credential',
    service: 'slack',
    type: 'oauth2',
  };

  const mockShare = {
    id: 'share-123',
    credentialId: 'cred-123',
    sharedByUserId: 'user-1',
    sharedWithUserId: 'user-2',
    permissions: [SharePermission.READ, SharePermission.EXECUTE],
    status: ShareStatus.ACTIVE,
    sharedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialSharingService,
        {
          provide: getRepositoryToken(Credential),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CredentialShare),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CredentialSharingService>(CredentialSharingService);
    credentialRepository = module.get(getRepositoryToken(Credential));
    shareRepository = module.get(getRepositoryToken(CredentialShare));
  });

  describe('shareCredential', () => {
    it('should share credential successfully', async () => {
      const createShareDto = {
        credentialId: 'cred-123',
        sharedWithUserId: 'user-2',
        permissions: [SharePermission.READ, SharePermission.EXECUTE],
        expiresAt: new Date(Date.now() + 86400000), // 1 day
        note: 'Test share',
      };

      credentialRepository.findOne.mockResolvedValue(mockCredential as any);
      shareRepository.findOne.mockResolvedValue(null); // No existing share
      shareRepository.create.mockReturnValue(mockShare as any);
      shareRepository.save.mockResolvedValue(mockShare as any);

      const result = await service.shareCredential('user-1', createShareDto);

      expect(credentialRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'cred-123', userId: 'user-1' },
      });
      expect(shareRepository.findOne).toHaveBeenCalledWith({
        where: {
          credentialId: 'cred-123',
          sharedWithUserId: 'user-2',
          status: ShareStatus.ACTIVE,
        },
      });
      expect(shareRepository.create).toHaveBeenCalled();
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result).toEqual(mockShare);
    });

    it('should throw NotFoundException when credential not found', async () => {
      const createShareDto = {
        credentialId: 'nonexistent',
        sharedWithUserId: 'user-2',
        permissions: [SharePermission.READ],
      };

      credentialRepository.findOne.mockResolvedValue(null);

      await expect(
        service.shareCredential('user-1', createShareDto)
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ForbiddenException when share already exists', async () => {
      const createShareDto = {
        credentialId: 'cred-123',
        sharedWithUserId: 'user-2',
        permissions: [SharePermission.READ],
      };

      credentialRepository.findOne.mockResolvedValue(mockCredential as any);
      shareRepository.findOne.mockResolvedValue(mockShare as any); // Existing share

      await expect(
        service.shareCredential('user-1', createShareDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateShare', () => {
    it('should update share successfully', async () => {
      const updateDto = {
        permissions: [SharePermission.READ, SharePermission.WRITE],
        note: 'Updated note',
      };

      const shareWithCredential = {
        ...mockShare,
        credential: mockCredential,
      };

      shareRepository.findOne.mockResolvedValue(shareWithCredential as any);
      shareRepository.save.mockResolvedValue({
        ...shareWithCredential,
        ...updateDto,
      } as any);

      const result = await service.updateShare('share-123', 'user-1', updateDto);

      expect(shareRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'share-123' },
        relations: ['credential'],
      });
      expect(shareRepository.save).toHaveBeenCalled();
      expect(result.permissions).toEqual(updateDto.permissions);
    });

    it('should throw ForbiddenException when user is not owner', async () => {
      const updateDto = {
        permissions: [SharePermission.READ],
      };

      const shareWithCredential = {
        ...mockShare,
        credential: { ...mockCredential, userId: 'different-user' },
      };

      shareRepository.findOne.mockResolvedValue(shareWithCredential as any);

      await expect(
        service.updateShare('share-123', 'user-1', updateDto)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('revokeShare', () => {
    it('should revoke share by owner', async () => {
      const shareWithCredential = {
        ...mockShare,
        credential: mockCredential,
      };

      shareRepository.findOne.mockResolvedValue(shareWithCredential as any);
      shareRepository.save.mockResolvedValue({} as any);

      await service.revokeShare('share-123', 'user-1');

      expect(shareRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ShareStatus.REVOKED,
          revokedByUserId: 'user-1',
        })
      );
    });

    it('should revoke share by recipient', async () => {
      const shareWithCredential = {
        ...mockShare,
        credential: mockCredential,
      };

      shareRepository.findOne.mockResolvedValue(shareWithCredential as any);
      shareRepository.save.mockResolvedValue({} as any);

      await service.revokeShare('share-123', 'user-2'); // Recipient

      expect(shareRepository.save).toHaveBeenCalled();
    });

    it('should throw ForbiddenException when user is neither owner nor recipient', async () => {
      const shareWithCredential = {
        ...mockShare,
        credential: mockCredential,
      };

      shareRepository.findOne.mockResolvedValue(shareWithCredential as any);

      await expect(
        service.revokeShare('share-123', 'user-3')
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('hasPermission', () => {
    it('should return true for credential owner', async () => {
      credentialRepository.findOne.mockResolvedValue(mockCredential as any);

      const result = await service.hasPermission(
        'cred-123',
        'user-1',
        SharePermission.MANAGE
      );

      expect(result).toBe(true);
    });

    it('should return true for user with shared permission', async () => {
      credentialRepository.findOne.mockResolvedValue(null); // Not owner
      shareRepository.findOne.mockResolvedValue({
        ...mockShare,
        permissions: [SharePermission.READ, SharePermission.EXECUTE],
        expiresAt: new Date(Date.now() + 86400000), // Not expired
      } as any);

      const result = await service.hasPermission(
        'cred-123',
        'user-2',
        SharePermission.READ
      );

      expect(result).toBe(true);
    });

    it('should return false for user without permission', async () => {
      credentialRepository.findOne.mockResolvedValue(null); // Not owner
      shareRepository.findOne.mockResolvedValue({
        ...mockShare,
        permissions: [SharePermission.READ],
      } as any);

      const result = await service.hasPermission(
        'cred-123',
        'user-2',
        SharePermission.WRITE
      );

      expect(result).toBe(false);
    });

    it('should return false for expired share', async () => {
      credentialRepository.findOne.mockResolvedValue(null); // Not owner
      shareRepository.findOne.mockResolvedValue({
        ...mockShare,
        permissions: [SharePermission.READ],
        expiresAt: new Date(Date.now() - 86400000), // Expired
      } as any);

      const result = await service.hasPermission(
        'cred-123',
        'user-2',
        SharePermission.READ
      );

      expect(result).toBe(false);
    });
  });

  describe('getAccessibleCredentials', () => {
    it('should return owned and shared credentials', async () => {
      const ownedCredentials = [mockCredential];
      const sharedCredentials = [
        {
          id: 'cred-456',
          userId: 'user-3',
          name: 'Shared Credential',
          service: 'github',
        },
      ];

      credentialRepository.find.mockResolvedValue(ownedCredentials as any);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(sharedCredentials),
      };

      credentialRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.getAccessibleCredentials('user-1');

      expect(result).toHaveLength(2);
      expect(result).toContain(mockCredential);
      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ id: 'cred-123' }),
          expect.objectContaining({ id: 'cred-456' }),
        ])
      );
    });

    it('should deduplicate credentials', async () => {
      const credential = mockCredential;
      const ownedCredentials = [credential];
      const sharedCredentials = [credential]; // Same credential

      credentialRepository.find.mockResolvedValue(ownedCredentials as any);

      const mockQueryBuilder = {
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(sharedCredentials),
      };

      credentialRepository.createQueryBuilder.mockReturnValue(
        mockQueryBuilder as any
      );

      const result = await service.getAccessibleCredentials('user-1');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('cred-123');
    });
  });

  describe('getShareStatistics', () => {
    it('should return correct statistics', async () => {
      shareRepository.count
        .mockResolvedValueOnce(5) // sharesGiven
        .mockResolvedValueOnce(3) // sharesReceived
        .mockResolvedValueOnce(4) // activeShares
        .mockResolvedValueOnce(1); // expiredShares

      const result = await service.getShareStatistics('user-1');

      expect(result).toEqual({
        sharesGiven: 5,
        sharesReceived: 3,
        activeShares: 4,
        expiredShares: 1,
      });

      expect(shareRepository.count).toHaveBeenCalledTimes(4);
    });
  });

  describe('cleanupExpiredShares', () => {
    it('should cleanup expired shares', async () => {
      shareRepository.update.mockResolvedValue({ affected: 3 } as any);

      const result = await service.cleanupExpiredShares();

      expect(result).toBe(3);
      expect(shareRepository.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ShareStatus.ACTIVE,
        }),
        { status: ShareStatus.EXPIRED }
      );
    });
  });
});
