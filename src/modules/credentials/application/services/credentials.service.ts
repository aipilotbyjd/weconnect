import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Credential, CredentialType } from '../../domain/entities/credential.entity';
import { EncryptionService } from './encryption.service';
import { OAuth2Service, OAuth2Token } from './oauth2.service';
import { CreateCredentialDto } from '../../presentation/dto/create-credential.dto';
import { UpdateCredentialDto } from '../../presentation/dto/update-credential.dto';

@Injectable()
export class CredentialsService {
  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private encryptionService: EncryptionService,
    private oauth2Service: OAuth2Service,
  ) {}

  async create(userId: string, dto: CreateCredentialDto): Promise<Credential> {
    // Check if credential with same name exists for user
    const existing = await this.credentialRepository.findOne({
      where: { userId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Credential with this name already exists');
    }

    const credential = this.credentialRepository.create({
      ...dto,
      userId,
      encryptedData: this.encryptionService.encrypt(dto.data),
    });

    return this.credentialRepository.save(credential);
  }

  async findAll(userId: string): Promise<Credential[]> {
    return this.credentialRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string, userId: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id, userId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return credential;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateCredentialDto,
  ): Promise<Credential> {
    const credential = await this.findOne(id, userId);

    if (dto.data) {
      credential.encryptedData = this.encryptionService.encrypt(dto.data);
    }

    Object.assign(credential, {
      name: dto.name || credential.name,
      configuration: dto.configuration || credential.configuration,
      isActive: dto.isActive !== undefined ? dto.isActive : credential.isActive,
    });

    return this.credentialRepository.save(credential);
  }

  async delete(id: string, userId: string): Promise<void> {
    const credential = await this.findOne(id, userId);
    await this.credentialRepository.remove(credential);
  }

  async getDecryptedData(id: string, userId: string): Promise<any> {
    const credential = await this.findOne(id, userId);
    return this.encryptionService.decrypt(credential.encryptedData);
  }

  async findByServiceAndUser(
    service: string,
    userId: string,
  ): Promise<Credential | null> {
    return this.credentialRepository.findOne({
      where: { service, userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async createOAuth2Credential(
    userId: string,
    service: string,
    tokens: OAuth2Token,
    userInfo?: any,
  ): Promise<Credential> {
    const name = userInfo?.email
      ? `${service} - ${userInfo.email}`
      : `${service} - ${new Date().toISOString()}`;

    const credential = this.credentialRepository.create({
      name,
      type: CredentialType.OAUTH2,
      service,
      userId,
      encryptedData: this.encryptionService.encrypt(tokens),
      configuration: {
        userInfo,
        createdAt: new Date().toISOString(),
      },
      expiresAt: tokens.expiry_date
        ? new Date(tokens.expiry_date)
        : undefined,
    });

    return this.credentialRepository.save(credential);
  }

  async refreshOAuth2Token(credentialId: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id: credentialId },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    const tokens = this.encryptionService.decrypt(credential.encryptedData);
    
    if (!tokens.refresh_token) {
      throw new BadRequestException('No refresh token available');
    }

    const newTokens = await this.oauth2Service.refreshAccessToken(
      tokens.refresh_token,
    );

    credential.encryptedData = this.encryptionService.encrypt({
      ...tokens,
      ...newTokens,
    });

    credential.expiresAt = newTokens.expiry_date
      ? new Date(newTokens.expiry_date)
      : undefined;

    return this.credentialRepository.save(credential);
  }

  async validateCredential(id: string, userId: string): Promise<boolean> {
    try {
      const credential = await this.findOne(id, userId);
      
      if (credential.type !== CredentialType.OAUTH2) {
        return true; // Non-OAuth2 credentials are always valid
      }

      const tokens = this.encryptionService.decrypt(credential.encryptedData);
      const isValid = await this.oauth2Service.validateToken(tokens.access_token);

      if (!isValid && tokens.refresh_token) {
        // Try to refresh the token
        await this.refreshOAuth2Token(id);
        return true;
      }

      return isValid;
    } catch {
      return false;
    }
  }

  async updateLastUsed(id: string): Promise<void> {
    await this.credentialRepository.update(id, {
      lastUsedAt: new Date(),
    });
  }
}
