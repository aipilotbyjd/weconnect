import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import * as crypto from 'crypto';
import {
  Credential,
  CredentialType,
  ServiceType,
} from '../../domain/entities/credential.entity';

export interface CredentialData {
  // API Key credentials
  apiKey?: string;
  apiSecret?: string;

  // OAuth2 credentials
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;

  // Basic Auth
  username?: string;
  password?: string;

  // Bearer Token
  token?: string;

  // Service-specific fields
  botToken?: string; // Telegram, Discord
  webhookUrl?: string; // Discord, Slack

  // Additional fields
  [key: string]: any;
}

export interface CreateCredentialDto {
  name: string;
  type: CredentialType;
  service: ServiceType;
  description?: string;
  credentialData: CredentialData;
  scopes?: string[];
  metadata?: Record<string, any>;
}

export interface UpdateCredentialDto {
  name?: string;
  description?: string;
  credentialData?: CredentialData;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

@Injectable()
export class CredentialService {
  private readonly logger = new Logger(CredentialService.name);
  private readonly encryptionKey: string;
  private readonly algorithm = 'aes-256-gcm';

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.encryptionKey =
      this.configService.get<string>('ENCRYPTION_KEY') ||
      'default-key-change-in-production';
    if (this.encryptionKey === 'default-key-change-in-production') {
      this.logger.warn(
        'Using default encryption key. Change ENCRYPTION_KEY in production!',
      );
    }
  }

  async createCredential(
    userId: string,
    dto: CreateCredentialDto,
  ): Promise<Credential> {
    const encryptedData = this.encrypt(JSON.stringify(dto.credentialData));

    const credential = this.credentialRepository.create({
      name: dto.name,
      type: dto.type,
      service: dto.service,
      description: dto.description,
      encryptedData,
      scopes: dto.scopes,
      metadata: dto.metadata,
      userId,
    });

    // For OAuth2 credentials, handle refresh token separately
    if (dto.type === CredentialType.OAUTH2 && dto.credentialData.refreshToken) {
      credential.refreshToken = this.encrypt(dto.credentialData.refreshToken);

      // Set expiration if access token has expiry
      if (dto.metadata?.expiresIn) {
        credential.expiresAt = new Date(
          Date.now() + dto.metadata.expiresIn * 1000,
        );
      }
    }

    return this.credentialRepository.save(credential);
  }

  async updateCredential(
    id: string,
    userId: string,
    dto: UpdateCredentialDto,
  ): Promise<Credential> {
    const credential = await this.findByIdAndUser(id, userId);

    if (dto.name) credential.name = dto.name;
    if (dto.description !== undefined) credential.description = dto.description;
    if (dto.isActive !== undefined) credential.isActive = dto.isActive;
    if (dto.metadata)
      credential.metadata = { ...credential.metadata, ...dto.metadata };

    if (dto.credentialData) {
      credential.encryptedData = this.encrypt(
        JSON.stringify(dto.credentialData),
      );

      // Update OAuth2 specific fields
      if (
        credential.type === CredentialType.OAUTH2 &&
        dto.credentialData.refreshToken
      ) {
        credential.refreshToken = this.encrypt(dto.credentialData.refreshToken);
      }
    }

    return this.credentialRepository.save(credential);
  }

  async deleteCredential(id: string, userId: string): Promise<void> {
    const credential = await this.findByIdAndUser(id, userId);
    await this.credentialRepository.remove(credential);
  }

  async findByIdAndUser(id: string, userId: string): Promise<Credential> {
    const credential = await this.credentialRepository.findOne({
      where: { id, userId, isActive: true },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return credential;
  }

  async findByUser(userId: string): Promise<Credential[]> {
    return this.credentialRepository.find({
      where: { userId, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findByService(
    userId: string,
    service: ServiceType,
  ): Promise<Credential[]> {
    return this.credentialRepository.find({
      where: { userId, service, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getCredentialData(id: string, userId: string): Promise<CredentialData> {
    const credential = await this.findByIdAndUser(id, userId);

    // Check if OAuth2 token needs refresh
    if (
      credential.type === CredentialType.OAUTH2 &&
      this.needsTokenRefresh(credential)
    ) {
      await this.refreshOAuth2Token(credential);
      // Refetch the updated credential
      const updatedCredential = await this.findByIdAndUser(id, userId);
      return this.decryptCredentialData(updatedCredential);
    }

    return this.decryptCredentialData(credential);
  }

  private decryptCredentialData(credential: Credential): CredentialData {
    const decryptedData = JSON.parse(this.decrypt(credential.encryptedData));

    // Add refresh token if it exists
    if (credential.refreshToken) {
      decryptedData.refreshToken = this.decrypt(credential.refreshToken);
    }

    return decryptedData;
  }

  private needsTokenRefresh(credential: Credential): boolean {
    if (credential.type !== CredentialType.OAUTH2 || !credential.expiresAt) {
      return false;
    }

    // Refresh if token expires in the next 5 minutes
    const refreshThreshold = new Date(Date.now() + 5 * 60 * 1000);
    return credential.expiresAt <= refreshThreshold;
  }

  private async refreshOAuth2Token(credential: Credential): Promise<void> {
    if (!credential.refreshToken) {
      throw new BadRequestException('No refresh token available');
    }

    try {
      const refreshToken = this.decrypt(credential.refreshToken);
      const credentialData = this.decryptCredentialData(credential);

      let tokenResponse: any;

      switch (credential.service) {
        case ServiceType.GOOGLE_SHEETS:
        case ServiceType.GMAIL:
          tokenResponse = await this.refreshGoogleToken(
            credentialData.clientId!,
            credentialData.clientSecret!,
            refreshToken,
          );
          break;
        case ServiceType.GITHUB:
          tokenResponse = await this.refreshGitHubToken(
            credentialData.clientId!,
            credentialData.clientSecret!,
            refreshToken,
          );
          break;
        case ServiceType.SLACK:
          tokenResponse = await this.refreshSlackToken(
            credentialData.clientId!,
            credentialData.clientSecret!,
            refreshToken,
          );
          break;
        default:
          this.logger.warn(
            `Token refresh not implemented for service: ${credential.service}`,
          );
          return;
      }

      if (tokenResponse.access_token) {
        // Update the credential with new tokens
        const newCredentialData = {
          ...credentialData,
          accessToken: tokenResponse.access_token,
        };

        if (tokenResponse.refresh_token) {
          newCredentialData.refreshToken = tokenResponse.refresh_token;
          credential.refreshToken = this.encrypt(tokenResponse.refresh_token);
        }

        credential.encryptedData = this.encrypt(
          JSON.stringify(newCredentialData),
        );

        if (tokenResponse.expires_in) {
          credential.expiresAt = new Date(
            Date.now() + tokenResponse.expires_in * 1000,
          );
        }

        await this.credentialRepository.save(credential);
        this.logger.log(
          `Successfully refreshed OAuth2 token for credential ${credential.id}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to refresh OAuth2 token for credential ${credential.id}: ${error.message}`,
      );
      throw new BadRequestException('Failed to refresh token');
    }
  }

  private async refreshGoogleToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://oauth2.googleapis.com/token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return response.data;
  }

  private async refreshGitHubToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://github.com/login/oauth/access_token',
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return response.data;
  }

  private async refreshSlackToken(
    clientId: string,
    clientSecret: string,
    refreshToken: string,
  ): Promise<any> {
    const response = await lastValueFrom(
      this.httpService.post(
        'https://slack.com/api/oauth.v2.access',
        {
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token',
        },
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      ),
    );

    return response.data;
  }

  private encrypt(text: string): string {
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  private decrypt(encryptedText: string): string {
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const key = crypto.createHash('sha256').update(this.encryptionKey).digest();
    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}
