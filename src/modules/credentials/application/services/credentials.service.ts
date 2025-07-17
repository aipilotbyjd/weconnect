import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Credential,
  CredentialType,
} from '../../domain/entities/credential.entity';
import { EncryptionService } from './encryption.service';
import { OAuth2Service, OAuth2Token } from './oauth2.service';
import { CreateCredentialDto } from '../../presentation/dto/create-credential.dto';
import { UpdateCredentialDto } from '../../presentation/dto/update-credential.dto';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CredentialsService {
  private readonly logger = new Logger(CredentialsService.name);

  constructor(
    @InjectRepository(Credential)
    private credentialRepository: Repository<Credential>,
    private encryptionService: EncryptionService,
    private oauth2Service: OAuth2Service,
    private httpService: HttpService,
    private configService: ConfigService,
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
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
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
      const isValid = await this.oauth2Service.validateToken(
        tokens.access_token,
      );

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

  /**
   * Get credentials for a specific service and user with automatic token refresh
   */
  async getCredentialsForService(
    service: string,
    userId: string,
    autoRefresh = true,
  ): Promise<any> {
    const credential = await this.findByServiceAndUser(service, userId);

    if (!credential) {
      throw new NotFoundException(
        `No credentials found for service: ${service}`,
      );
    }

    // Update last used timestamp
    await this.updateLastUsed(credential.id);

    const decryptedData = this.encryptionService.decrypt(
      credential.encryptedData,
    );

    // Handle OAuth2 token refresh if needed
    if (credential.type === CredentialType.OAUTH2 && autoRefresh) {
      if (this.isTokenExpired(credential)) {
        this.logger.log(
          `Refreshing expired token for credential ${credential.id}`,
        );
        const refreshedCredential = await this.refreshOAuth2Token(
          credential.id,
        );
        return this.encryptionService.decrypt(
          refreshedCredential.encryptedData,
        );
      }
    }

    return decryptedData;
  }

  /**
   * Test credential connectivity
   */
  async testCredential(
    id: string,
    userId: string,
  ): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const credential = await this.findOne(id, userId);
      const credentialData = this.encryptionService.decrypt(
        credential.encryptedData,
      );

      switch (credential.service) {
        case 'slack':
          return await this.testSlackCredential(credentialData);
        case 'discord':
          return await this.testDiscordCredential(credentialData);
        case 'telegram':
          return await this.testTelegramCredential(credentialData);
        case 'github':
          return await this.testGitHubCredential(credentialData);
        case 'trello':
          return await this.testTrelloCredential(credentialData);
        case 'gmail':
        case 'google_sheets':
          return await this.testGoogleCredential(credentialData);
        default:
          return {
            isValid: true,
            details: 'No test available for this service',
          };
      }
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get credential statistics
   */
  async getCredentialStats(userId: string): Promise<{
    total: number;
    byType: Record<string, number>;
    byService: Record<string, number>;
    expired: number;
    active: number;
  }> {
    const credentials = await this.findAll(userId);

    const stats = {
      total: credentials.length,
      byType: {} as Record<string, number>,
      byService: {} as Record<string, number>,
      expired: 0,
      active: 0,
    };

    credentials.forEach((cred) => {
      // Count by type
      stats.byType[cred.type] = (stats.byType[cred.type] || 0) + 1;

      // Count by service
      stats.byService[cred.service] = (stats.byService[cred.service] || 0) + 1;

      // Count expired and active
      if (cred.isExpired) {
        stats.expired++;
      }

      if (cred.isActive) {
        stats.active++;
      }
    });

    return stats;
  }

  /**
   * Bulk refresh expired OAuth2 tokens
   */
  async refreshExpiredTokens(userId?: string): Promise<{
    refreshed: number;
    failed: number;
    errors: string[];
  }> {
    const query = this.credentialRepository
      .createQueryBuilder('credential')
      .where('credential.type = :type', { type: CredentialType.OAUTH2 })
      .andWhere('credential.expiresAt < :now', { now: new Date() })
      .andWhere('credential.isActive = true');

    if (userId) {
      query.andWhere('credential.userId = :userId', { userId });
    }

    const expiredCredentials = await query.getMany();

    const result = {
      refreshed: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (const credential of expiredCredentials) {
      try {
        await this.refreshOAuth2Token(credential.id);
        result.refreshed++;
        this.logger.log(`Refreshed token for credential ${credential.id}`);
      } catch (error) {
        result.failed++;
        result.errors.push(`${credential.name}: ${error.message}`);
        this.logger.error(
          `Failed to refresh token for credential ${credential.id}:`,
          error.message,
        );
      }
    }

    return result;
  }

  // Private helper methods
  private isTokenExpired(credential: Credential): boolean {
    if (!credential.expiresAt) return false;

    // Consider token expired if it expires in the next 5 minutes
    const expiryThreshold = new Date(Date.now() + 5 * 60 * 1000);
    return credential.expiresAt <= expiryThreshold;
  }

  private async testSlackCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get('https://slack.com/api/auth.test', {
          headers: {
            Authorization: `Bearer ${credentialData.token || credentialData.access_token}`,
          },
        }),
      );

      return {
        isValid: response.data.ok,
        details: response.data.ok
          ? {
              user: response.data.user,
              team: response.data.team,
              url: response.data.url,
            }
          : response.data.error,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  private async testDiscordCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get('https://discord.com/api/users/@me', {
          headers: {
            Authorization: `Bot ${credentialData.token}`,
          },
        }),
      );

      return {
        isValid: true,
        details: {
          username: response.data.username,
          id: response.data.id,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async testTelegramCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://api.telegram.org/bot${credentialData.botToken}/getMe`,
        ),
      );

      return {
        isValid: response.data.ok,
        details: response.data.ok
          ? {
              username: response.data.result.username,
              first_name: response.data.result.first_name,
            }
          : response.data.description,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  private async testGitHubCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get('https://api.github.com/user', {
          headers: {
            Authorization: `Bearer ${credentialData.access_token || credentialData.token}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }),
      );

      return {
        isValid: true,
        details: {
          login: response.data.login,
          name: response.data.name,
          email: response.data.email,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.response?.data?.message || error.message,
      };
    }
  }

  private async testTrelloCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://api.trello.com/1/members/me?key=${credentialData.apiKey}&token=${credentialData.token}`,
        ),
      );

      return {
        isValid: true,
        details: {
          username: response.data.username,
          fullName: response.data.fullName,
          email: response.data.email,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  private async testGoogleCredential(credentialData: any): Promise<any> {
    try {
      const response = await lastValueFrom(
        this.httpService.get(
          `https://www.googleapis.com/oauth2/v1/userinfo?access_token=${credentialData.access_token}`,
        ),
      );

      return {
        isValid: true,
        details: {
          email: response.data.email,
          name: response.data.name,
          verified_email: response.data.verified_email,
        },
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.response?.data?.error?.message || error.message,
      };
    }
  }
}
