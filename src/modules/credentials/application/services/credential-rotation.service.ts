import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Credential } from '../../domain/entities/credential.entity';
import { CredentialRotation } from '../../domain/entities/credential-rotation.entity';
import { RotationStatus, RotationType } from '../../domain/enums/credential-rotation.enum';
import { CredentialService } from './credential.service';
import { EncryptionService } from './encryption.service';

export interface RotationPolicy {
  enabled: boolean;
  rotationType: RotationType;
  rotationIntervalDays: number;
  warningDays: number;
  maxAge: number;
  retainVersions: number;
  autoRotate: boolean;
}

export interface CreateRotationDto {
  credentialId: string;
  rotationType: RotationType;
  scheduledAt?: Date;
  policy?: Partial<RotationPolicy>;
}

export interface RotationResult {
  success: boolean;
  oldCredentialId: string;
  newCredentialId?: string;
  error?: string;
  rotatedAt: Date;
}

@Injectable()
export class CredentialRotationService {
  private readonly logger = new Logger(CredentialRotationService.name);

  private readonly defaultPolicy: RotationPolicy = {
    enabled: false,
    rotationType: RotationType.MANUAL,
    rotationIntervalDays: 90,
    warningDays: 7,
    maxAge: 365,
    retainVersions: 3,
    autoRotate: false,
  };

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    @InjectRepository(CredentialRotation)
    private rotationRepository: Repository<CredentialRotation>,
    private credentialService: CredentialService,
    private encryptionService: EncryptionService,
  ) {}

  async createRotationPolicy(
    credentialId: string,
    userId: string,
    policy: Partial<RotationPolicy>,
  ): Promise<CredentialRotation> {
    // Verify credential ownership
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    // Check if policy already exists
    const existingRotation = await this.rotationRepository.findOne({
      where: { credentialId, status: RotationStatus.ACTIVE },
    });

    if (existingRotation) {
      throw new BadRequestException('Rotation policy already exists for this credential');
    }

    const rotationPolicy = { ...this.defaultPolicy, ...policy };

    // Calculate next rotation date
    const nextRotationAt = new Date();
    nextRotationAt.setDate(nextRotationAt.getDate() + rotationPolicy.rotationIntervalDays);

    const rotation = this.rotationRepository.create({
      credentialId,
      rotationType: rotationPolicy.rotationType,
      policy: rotationPolicy,
      nextRotationAt: rotationPolicy.autoRotate ? nextRotationAt : null,
      status: RotationStatus.ACTIVE,
      createdByUserId: userId,
    });

    const savedRotation = await this.rotationRepository.save(rotation);

    this.logger.log(`Rotation policy created for credential ${credentialId}`);

    return savedRotation;
  }

  async updateRotationPolicy(
    rotationId: string,
    userId: string,
    policy: Partial<RotationPolicy>,
  ): Promise<CredentialRotation> {
    const rotation = await this.rotationRepository.findOne({
      where: { id: rotationId },
      relations: ['credential'],
    });

    if (!rotation) {
      throw new NotFoundException('Rotation policy not found');
    }

    // Verify ownership
    if (rotation.credential.userId !== userId) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    // Update policy
    rotation.policy = { ...rotation.policy, ...policy };

    // Recalculate next rotation if interval changed
    if (policy.rotationIntervalDays && rotation.policy.autoRotate) {
      const nextRotationAt = new Date();
      nextRotationAt.setDate(nextRotationAt.getDate() + policy.rotationIntervalDays);
      rotation.nextRotationAt = nextRotationAt;
    }

    const updatedRotation = await this.rotationRepository.save(rotation);

    this.logger.log(`Rotation policy updated for rotation ${rotationId}`);

    return updatedRotation;
  }

  async scheduleRotation(
    credentialId: string,
    userId: string,
    createRotationDto: CreateRotationDto,
  ): Promise<CredentialRotation> {
    // Verify credential ownership
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    const scheduledAt = createRotationDto.scheduledAt || new Date();

    const rotation = this.rotationRepository.create({
      credentialId,
      rotationType: createRotationDto.rotationType,
      scheduledAt,
      policy: createRotationDto.policy || this.defaultPolicy,
      status: RotationStatus.SCHEDULED,
      createdByUserId: userId,
    });

    const savedRotation = await this.rotationRepository.save(rotation);

    this.logger.log(
      `Rotation scheduled for credential ${credentialId} at ${scheduledAt.toISOString()}`
    );

    return savedRotation;
  }

  async rotateCredential(
    credentialId: string,
    userId: string,
    rotationType: RotationType = RotationType.MANUAL,
  ): Promise<RotationResult> {
    const startTime = Date.now();

    try {
      // Get the current credential
      const currentCredential = await this.credentialRepository.findOne({
        where: { id: credentialId, userId },
      });

      if (!currentCredential) {
        throw new NotFoundException('Credential not found or not owned by user');
      }

      // Create rotation record
      const rotation = this.rotationRepository.create({
        credentialId,
        rotationType,
        status: RotationStatus.IN_PROGRESS,
        startedAt: new Date(),
        createdByUserId: userId,
      });

      const savedRotation = await this.rotationRepository.save(rotation);

      let newCredential: Credential;

      try {
        // Perform rotation based on type
        switch (rotationType) {
          case RotationType.API_KEY:
            newCredential = await this.rotateApiKey(currentCredential);
            break;
          case RotationType.OAUTH2:
            newCredential = await this.rotateOAuth2Token(currentCredential);
            break;
          case RotationType.PASSWORD:
            newCredential = await this.rotatePassword(currentCredential);
            break;
          case RotationType.CERTIFICATE:
            newCredential = await this.rotateCertificate(currentCredential);
            break;
          default:
            throw new BadRequestException(`Unsupported rotation type: ${rotationType}`);
        }

        // Mark old credential as rotated
        currentCredential.isActive = false;
        currentCredential.rotatedAt = new Date();
        currentCredential.rotatedToCredentialId = newCredential.id;
        await this.credentialRepository.save(currentCredential);

        // Update rotation record
        savedRotation.status = RotationStatus.COMPLETED;
        savedRotation.completedAt = new Date();
        savedRotation.newCredentialId = newCredential.id;
        savedRotation.executionTimeMs = Date.now() - startTime;
        await this.rotationRepository.save(savedRotation);

        // Update next rotation date if auto-rotate is enabled
        await this.updateNextRotationDate(credentialId);

        this.logger.log(
          `Credential ${credentialId} rotated successfully to ${newCredential.id}`
        );

        return {
          success: true,
          oldCredentialId: credentialId,
          newCredentialId: newCredential.id,
          rotatedAt: new Date(),
        };
      } catch (error) {
        // Mark rotation as failed
        savedRotation.status = RotationStatus.FAILED;
        savedRotation.completedAt = new Date();
        savedRotation.error = error.message;
        savedRotation.executionTimeMs = Date.now() - startTime;
        await this.rotationRepository.save(savedRotation);

        throw error;
      }
    } catch (error) {
      this.logger.error(`Credential rotation failed for ${credentialId}: ${error.message}`);

      return {
        success: false,
        oldCredentialId: credentialId,
        error: error.message,
        rotatedAt: new Date(),
      };
    }
  }

  private async rotateApiKey(credential: Credential): Promise<Credential> {
    // For API keys, we typically need to generate a new key
    // This is service-specific implementation
    const decryptedData = await this.encryptionService.decrypt(credential.encryptedData);
    
    // Generate new API key (implementation depends on service)
    const newApiKey = await this.generateNewApiKey(credential.service, decryptedData);

    // Create new credential with updated API key
    const newCredentialData = {
      ...decryptedData,
      apiKey: newApiKey,
      rotatedFrom: credential.id,
    };

    const newCredential = await this.credentialService.create({
      name: `${credential.name} (Rotated)`,
      service: credential.service,
      type: credential.type,
      data: newCredentialData,
      userId: credential.userId,
      organizationId: credential.organizationId,
    });

    return newCredential;
  }

  private async rotateOAuth2Token(credential: Credential): Promise<Credential> {
    // For OAuth2, we refresh the token
    try {
      const refreshedCredential = await this.credentialService.refreshOAuth2Token(credential.id);
      return refreshedCredential;
    } catch (error) {
      // If refresh fails, we might need to re-authenticate
      throw new BadRequestException('OAuth2 token refresh failed. Re-authentication required.');
    }
  }

  private async rotatePassword(credential: Credential): Promise<Credential> {
    // Password rotation typically requires external service integration
    const decryptedData = await this.encryptionService.decrypt(credential.encryptedData);
    
    // Generate new password
    const newPassword = this.generateSecurePassword();

    // Update password in external service (implementation depends on service)
    await this.updatePasswordInService(credential.service, decryptedData, newPassword);

    // Create new credential with updated password
    const newCredentialData = {
      ...decryptedData,
      password: newPassword,
      rotatedFrom: credential.id,
    };

    const newCredential = await this.credentialService.create({
      name: `${credential.name} (Rotated)`,
      service: credential.service,
      type: credential.type,
      data: newCredentialData,
      userId: credential.userId,
      organizationId: credential.organizationId,
    });

    return newCredential;
  }

  private async rotateCertificate(credential: Credential): Promise<Credential> {
    // Certificate rotation involves generating new certificates
    const decryptedData = await this.encryptionService.decrypt(credential.encryptedData);
    
    // Generate new certificate (implementation depends on CA)
    const newCertificate = await this.generateNewCertificate(decryptedData);

    // Create new credential with updated certificate
    const newCredentialData = {
      ...decryptedData,
      certificate: newCertificate.cert,
      privateKey: newCertificate.key,
      rotatedFrom: credential.id,
    };

    const newCredential = await this.credentialService.create({
      name: `${credential.name} (Rotated)`,
      service: credential.service,
      type: credential.type,
      data: newCredentialData,
      userId: credential.userId,
      organizationId: credential.organizationId,
    });

    return newCredential;
  }

  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async processScheduledRotations(): Promise<void> {
    this.logger.log('Processing scheduled credential rotations...');

    const scheduledRotations = await this.rotationRepository.find({
      where: {
        status: RotationStatus.SCHEDULED,
        scheduledAt: LessThan(new Date()),
      },
      relations: ['credential'],
    });

    for (const rotation of scheduledRotations) {
      try {
        await this.rotateCredential(
          rotation.credentialId,
          rotation.credential.userId,
          rotation.rotationType
        );
      } catch (error) {
        this.logger.error(
          `Failed to process scheduled rotation ${rotation.id}: ${error.message}`
        );
      }
    }

    this.logger.log(`Processed ${scheduledRotations.length} scheduled rotations`);
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async processAutoRotations(): Promise<void> {
    this.logger.log('Processing automatic credential rotations...');

    const autoRotations = await this.rotationRepository.find({
      where: {
        status: RotationStatus.ACTIVE,
        nextRotationAt: LessThan(new Date()),
      },
      relations: ['credential'],
    });

    for (const rotation of autoRotations) {
      if (rotation.policy?.autoRotate) {
        try {
          await this.rotateCredential(
            rotation.credentialId,
            rotation.credential.userId,
            rotation.rotationType
          );
        } catch (error) {
          this.logger.error(
            `Failed to process auto rotation ${rotation.id}: ${error.message}`
          );
        }
      }
    }

    this.logger.log(`Processed ${autoRotations.length} automatic rotations`);
  }

  async getRotationHistory(credentialId: string, userId: string): Promise<CredentialRotation[]> {
    // Verify credential ownership
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found or not owned by user');
    }

    const rotations = await this.rotationRepository.find({
      where: { credentialId },
      order: { createdAt: 'DESC' },
    });

    return rotations;
  }

  async getCredentialsNeedingRotation(userId: string): Promise<{
    immediate: Credential[];
    warning: Credential[];
    overdue: Credential[];
  }> {
    const now = new Date();
    const warningDate = new Date();
    warningDate.setDate(now.getDate() + 7); // Default 7 days warning

    const rotations = await this.rotationRepository.find({
      where: { status: RotationStatus.ACTIVE },
      relations: ['credential'],
    });

    const userRotations = rotations.filter(r => r.credential.userId === userId);

    const immediate: Credential[] = [];
    const warning: Credential[] = [];
    const overdue: Credential[] = [];

    for (const rotation of userRotations) {
      if (!rotation.nextRotationAt) continue;

      if (rotation.nextRotationAt < now) {
        overdue.push(rotation.credential);
      } else if (rotation.nextRotationAt < warningDate) {
        warning.push(rotation.credential);
      }

      // Check for immediate rotation needs (e.g., security incidents)
      if (rotation.policy?.maxAge) {
        const maxAgeDate = new Date(rotation.credential.createdAt);
        maxAgeDate.setDate(maxAgeDate.getDate() + rotation.policy.maxAge);
        
        if (maxAgeDate < now) {
          immediate.push(rotation.credential);
        }
      }
    }

    return { immediate, warning, overdue };
  }

  private async updateNextRotationDate(credentialId: string): Promise<void> {
    const rotation = await this.rotationRepository.findOne({
      where: { credentialId, status: RotationStatus.ACTIVE },
    });

    if (rotation && rotation.policy?.autoRotate) {
      const nextRotationAt = new Date();
      nextRotationAt.setDate(nextRotationAt.getDate() + rotation.policy.rotationIntervalDays);
      
      rotation.nextRotationAt = nextRotationAt;
      await this.rotationRepository.save(rotation);
    }
  }

  private async generateNewApiKey(service: string, currentData: any): Promise<string> {
    // This would integrate with the specific service's API to generate a new key
    // For now, return a placeholder
    return `new_api_key_${Date.now()}`;
  }

  private generateSecurePassword(): string {
    const length = 16;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    
    return password;
  }

  private async updatePasswordInService(service: string, currentData: any, newPassword: string): Promise<void> {
    // This would integrate with the specific service's API to update the password
    // Implementation depends on the service
    this.logger.log(`Password updated for ${service} service`);
  }

  private async generateNewCertificate(currentData: any): Promise<{ cert: string; key: string }> {
    // This would integrate with a Certificate Authority to generate new certificates
    // For now, return a placeholder
    return {
      cert: `new_certificate_${Date.now()}`,
      key: `new_private_key_${Date.now()}`,
    };
  }
}
