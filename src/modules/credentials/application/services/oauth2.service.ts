import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expiry_date?: number;
  scope?: string;
}

@Injectable()
export class OAuth2Service {
  private googleOAuth2Client: OAuth2Client;
  private readonly redirectUri: string;

  constructor(private configService: ConfigService) {
    const clientId = this.configService.get('GOOGLE_CLIENT_ID');
    const clientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get('GOOGLE_REDIRECT_URI') || 
      'http://localhost:3000/auth/oauth2/google/callback';

    this.googleOAuth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      this.redirectUri
    );
  }

  // Generate OAuth2 authorization URL
  generateAuthUrl(service: string, state: string): string {
    const scopes = this.getScopesForService(service);
    
    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent', // Force consent to ensure refresh token
    });
  }

  // Get auth URL with custom scopes
  getAuthUrl(scopes: string[], state: string): string {
    return this.googleOAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: state,
      prompt: 'consent',
    });
  }

  // Get tokens from authorization code
  async getTokens(code: string): Promise<OAuth2Token> {
    return this.exchangeCodeForTokens(code);
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<OAuth2Token> {
    try {
      const { tokens } = await this.googleOAuth2Client.getToken(code);
      return tokens as OAuth2Token;
    } catch (error) {
      throw new UnauthorizedException('Invalid authorization code');
    }
  }

  // Refresh access token using refresh token
  async refreshAccessToken(refreshToken: string): Promise<OAuth2Token> {
    try {
      this.googleOAuth2Client.setCredentials({
        refresh_token: refreshToken,
      });
      
      const { credentials } = await this.googleOAuth2Client.refreshAccessToken();
      return credentials as OAuth2Token;
    } catch (error) {
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  // Get scopes based on service
  private getScopesForService(service: string): string[] {
    const scopeMap: Record<string, string[]> = {
      'gmailOAuth2': [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels',
      ],
      'gmailOAuth2Api': [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/gmail.metadata',
      ],
      'googleCalendarOAuth2Api': [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
      ],
      'googleDocsOAuth2Api': [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/drive.file',
      ],
      'googleDriveOAuth2Api': [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
      'googleSheetsOAuth2Api': [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.file',
      ],
    };

    return scopeMap[service] || [];
  }

  // Validate token is still valid
  async validateToken(accessToken: string): Promise<boolean> {
    try {
      const response = await fetch(
        `https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${accessToken}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  // Get user info from Google
  async getUserInfo(accessToken: string): Promise<any> {
    try {
      const oauth2 = google.oauth2({ version: 'v2', auth: this.googleOAuth2Client });
      this.googleOAuth2Client.setCredentials({ access_token: accessToken });
      
      const { data } = await oauth2.userinfo.get();
      return data;
    } catch (error) {
      throw new UnauthorizedException('Failed to get user info');
    }
  }
}
