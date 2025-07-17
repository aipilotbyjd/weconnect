import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CredentialsService } from './credentials.service';

export interface ServiceCredentials {
  // Common fields
  service: string;
  type: string;

  // API Key based
  apiKey?: string;
  apiSecret?: string;

  // OAuth2 based
  access_token?: string;
  refresh_token?: string;

  // Service specific
  token?: string;
  botToken?: string;
  webhookUrl?: string;

  // Additional metadata
  scopes?: string[];
  expiresAt?: Date;
  [key: string]: any;
}

@Injectable()
export class CredentialIntegrationService {
  private readonly logger = new Logger(CredentialIntegrationService.name);

  constructor(private credentialsService: CredentialsService) {}

  /**
   * Get credentials for a service and user ID
   * This is the main method used by node executors
   */
  async getServiceCredentials(
    service: string,
    userId: string,
    options: {
      autoRefresh?: boolean;
      required?: boolean;
    } = {},
  ): Promise<ServiceCredentials | null> {
    const { autoRefresh = true, required = true } = options;

    try {
      const credentials =
        await this.credentialsService.getCredentialsForService(
          service,
          userId,
          autoRefresh,
        );

      return {
        service,
        type: 'retrieved',
        ...credentials,
      };
    } catch (error) {
      if (required) {
        this.logger.error(
          `Failed to get credentials for service ${service}:`,
          error.message,
        );
        throw new NotFoundException(
          `No valid credentials found for service: ${service}`,
        );
      }
      return null;
    }
  }

  /**
   * Get specific credential data by credential ID with context
   */
  async getCredentialById(
    credentialId: string,
    context?: any,
  ): Promise<{ data: ServiceCredentials }> {
    const userId = context?.userId || 'unknown';
    const credentials = await this.credentialsService.getDecryptedData(
      credentialId,
      userId,
    );

    return {
      data: {
        service: 'unknown',
        type: 'retrieved',
        ...credentials,
      },
    };
  }

  /**
   * Get credential by service name with context
   */
  async getCredentialByService(
    service: string,
    context?: any,
  ): Promise<{ data: ServiceCredentials }> {
    const userId = context?.userId || 'unknown';
    const credentials = await this.getServiceCredentials(service, userId, {
      autoRefresh: true,
      required: true,
    });

    if (!credentials) {
      throw new NotFoundException(
        `No credentials found for service: ${service}`,
      );
    }

    return {
      data: credentials,
    };
  }

  /**
   * Validate if credentials exist for a service
   */
  async hasCredentialsForService(
    service: string,
    userId: string,
  ): Promise<boolean> {
    try {
      const credential = await this.credentialsService.findByServiceAndUser(
        service,
        userId,
      );
      return !!credential && credential.isActive;
    } catch {
      return false;
    }
  }

  /**
   * Get OAuth2 credentials with automatic refresh
   */
  async getOAuth2Credentials(
    service: string,
    userId: string,
    requiredScopes?: string[],
  ): Promise<ServiceCredentials> {
    const credentials = await this.getServiceCredentials(service, userId, {
      autoRefresh: true,
      required: true,
    });

    if (!credentials?.access_token) {
      throw new NotFoundException(
        `No OAuth2 access token found for service: ${service}`,
      );
    }

    // Validate scopes if provided
    if (requiredScopes && credentials.scopes) {
      const hasAllScopes = requiredScopes.every((scope) =>
        credentials.scopes!.includes(scope),
      );

      if (!hasAllScopes) {
        this.logger.warn(
          `Missing required scopes for ${service}. Required: ${requiredScopes}, Available: ${credentials.scopes}`,
        );
      }
    }

    return credentials;
  }

  /**
   * Get API key credentials
   */
  async getApiKeyCredentials(
    service: string,
    userId: string,
  ): Promise<ServiceCredentials> {
    const credentials = await this.getServiceCredentials(service, userId, {
      required: true,
    });

    if (!credentials?.apiKey && !credentials?.token) {
      throw new NotFoundException(`No API key found for service: ${service}`);
    }

    return credentials;
  }

  /**
   * Get bot token credentials (for Telegram, Discord, etc.)
   */
  async getBotCredentials(
    service: string,
    userId: string,
  ): Promise<ServiceCredentials> {
    const credentials = await this.getServiceCredentials(service, userId, {
      required: true,
    });

    if (!credentials?.botToken && !credentials?.token) {
      throw new NotFoundException(`No bot token found for service: ${service}`);
    }

    return credentials;
  }

  /**
   * Update last used timestamp for a credential
   */
  async markCredentialAsUsed(credentialId: string): Promise<void> {
    try {
      await this.credentialsService.updateLastUsed(credentialId);
    } catch (error) {
      // Don't fail the main operation if this fails
      this.logger.warn(
        `Failed to update last used timestamp for credential ${credentialId}:`,
        error.message,
      );
    }
  }

  /**
   * Get credentials with fallback support
   */
  async getCredentialsWithFallback(
    primaryService: string,
    fallbackServices: string[],
    userId: string,
  ): Promise<ServiceCredentials> {
    // Try primary service first
    const primary = await this.getServiceCredentials(primaryService, userId, {
      required: false,
    });

    if (primary) {
      return primary;
    }

    // Try fallback services
    for (const fallbackService of fallbackServices) {
      const fallback = await this.getServiceCredentials(
        fallbackService,
        userId,
        {
          required: false,
        },
      );

      if (fallback) {
        this.logger.log(
          `Using fallback service ${fallbackService} instead of ${primaryService}`,
        );
        return fallback;
      }
    }

    throw new NotFoundException(
      `No credentials found for ${primaryService} or fallback services: ${fallbackServices.join(', ')}`,
    );
  }

  /**
   * Validate service credentials are working
   */
  async validateServiceCredentials(
    service: string,
    userId: string,
  ): Promise<{
    isValid: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      const credential = await this.credentialsService.findByServiceAndUser(
        service,
        userId,
      );

      if (!credential) {
        return {
          isValid: false,
          error: `No credentials found for service: ${service}`,
        };
      }

      return await this.credentialsService.testCredential(
        credential.id,
        userId,
      );
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  /**
   * Get multiple service credentials at once
   */
  async getMultipleServiceCredentials(
    services: string[],
    userId: string,
  ): Promise<Record<string, ServiceCredentials | null>> {
    const results: Record<string, ServiceCredentials | null> = {};

    await Promise.all(
      services.map(async (service) => {
        try {
          results[service] = await this.getServiceCredentials(service, userId, {
            required: false,
          });
        } catch (error) {
          results[service] = null;
          this.logger.warn(
            `Failed to get credentials for ${service}:`,
            error.message,
          );
        }
      }),
    );

    return results;
  }

  /**
   * Helper method to extract common credential patterns
   */
  extractCredentialPattern(
    credentials: ServiceCredentials,
    pattern: 'oauth2' | 'api_key' | 'bot_token' | 'basic_auth',
  ): any {
    switch (pattern) {
      case 'oauth2':
        return {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token,
          expiresAt: credentials.expiresAt,
          scopes: credentials.scopes,
        };

      case 'api_key':
        return {
          apiKey: credentials.apiKey || credentials.token,
          apiSecret: credentials.apiSecret,
        };

      case 'bot_token':
        return {
          token: credentials.botToken || credentials.token,
        };

      case 'basic_auth':
        return {
          username: credentials.username,
          password: credentials.password,
        };

      default:
        return credentials;
    }
  }
}
