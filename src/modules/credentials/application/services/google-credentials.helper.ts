import { Injectable } from '@nestjs/common';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { CredentialsService } from './credentials.service';
import { EncryptionService } from './encryption.service';
import { OAuth2Token } from './oauth2.service';

@Injectable()
export class GoogleCredentialsHelper {
  constructor(
    private credentialsService: CredentialsService,
    private encryptionService: EncryptionService,
  ) {}

  /**
   * Get an authenticated OAuth2 client for a user's Google credentials
   */
  async getOAuth2Client(userId: string): Promise<OAuth2Client> {
    // Find the user's Google credential
    const credential = await this.credentialsService.findByServiceAndUser(
      'google',
      userId,
    );

    if (!credential) {
      throw new Error('No Google credentials found for user');
    }

    // Decrypt the tokens
    const tokens = this.encryptionService.decrypt(
      credential.encryptedData,
    ) as OAuth2Token;

    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI,
    );

    // Set the credentials
    oauth2Client.setCredentials({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expiry_date: tokens.expiry_date,
    });

    // Handle token refresh
    oauth2Client.on('tokens', async (newTokens) => {
      // Update the stored tokens
      const updatedTokens = {
        ...tokens,
        ...newTokens,
      };

      await this.credentialsService.update(credential.id, userId, {
        data: updatedTokens,
      });
    });

    // Update last used
    await this.credentialsService.updateLastUsed(credential.id);

    return oauth2Client;
  }

  /**
   * Get authenticated Google service clients
   */
  async getGoogleServices(userId: string) {
    const auth = await this.getOAuth2Client(userId);

    return {
      gmail: google.gmail({ version: 'v1', auth }),
      calendar: google.calendar({ version: 'v3', auth }),
      drive: google.drive({ version: 'v3', auth }),
      docs: google.docs({ version: 'v1', auth }),
      sheets: google.sheets({ version: 'v4', auth }),
    };
  }

  /**
   * Get a specific Google service client
   */
  async getGoogleService<T>(
    userId: string,
    service: 'gmail' | 'calendar' | 'drive' | 'docs' | 'sheets',
  ): Promise<T> {
    const services = await this.getGoogleServices(userId);
    return services[service] as T;
  }

  /**
   * Check if user has valid Google credentials
   */
  async hasValidGoogleCredentials(userId: string): Promise<boolean> {
    try {
      const credential = await this.credentialsService.findByServiceAndUser(
        'google',
        userId,
      );

      if (!credential) {
        return false;
      }

      return await this.credentialsService.validateCredential(
        credential.id,
        userId,
      );
    } catch {
      return false;
    }
  }
}
