import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from '../../domain/entities/api-key.entity';
import { User } from '../../domain/entities/user.entity';
import { Request } from 'express';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
  constructor(
    @InjectRepository(ApiKey)
    private apiKeyRepository: Repository<ApiKey>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    super();
  }

  async validate(req: Request): Promise<any> {
    const apiKey = this.extractApiKey(req);
    
    if (!apiKey) {
      throw new UnauthorizedException('API key required');
    }

    // Hash the provided key
    const hashedKey = ApiKey.hashKey(apiKey);

    // Find the API key
    const keyRecord = await this.apiKeyRepository.findOne({
      where: { key: hashedKey, isActive: true },
      relations: ['user'],
    });

    if (!keyRecord) {
      throw new UnauthorizedException('Invalid API key');
    }

    // Check expiration
    if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
      throw new UnauthorizedException('API key expired');
    }

    // Check IP whitelist
    if (keyRecord.ipWhitelist && keyRecord.ipWhitelist.length > 0) {
      const clientIp = req.ip || req.socket.remoteAddress;
      if (!keyRecord.ipWhitelist.includes(clientIp)) {
        throw new UnauthorizedException('IP address not whitelisted');
      }
    }

    // Update usage stats
    await this.apiKeyRepository.update(keyRecord.id, {
      lastUsedAt: new Date(),
      usageCount: () => 'usage_count + 1',
    });

    // Return user with api key info
    return {
      ...keyRecord.user,
      apiKeyId: keyRecord.id,
      apiKeyScopes: keyRecord.scopes,
      isApiKey: true,
    };
  }

  private extractApiKey(req: Request): string | null {
    // Check header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check custom header
    const apiKeyHeader = req.headers['x-api-key'];
    if (apiKeyHeader) {
      return Array.isArray(apiKeyHeader) ? apiKeyHeader[0] : apiKeyHeader;
    }

    // Check query parameter
    const queryKey = req.query.api_key;
    if (queryKey) {
      return Array.isArray(queryKey) ? queryKey[0] : queryKey;
    }

    return null;
  }
}
