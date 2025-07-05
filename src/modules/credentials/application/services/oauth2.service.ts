import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  provider?: 'google' | 'github' | 'slack' | 'discord';
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
  private readonly providers: Record<string, OAuth2Config> = {};

  constructor(private configService: ConfigService) {
    // Initialize Google OAuth2
    const googleClientId = this.configService.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = this.configService.get('GOOGLE_CLIENT_SECRET');
    this.redirectUri = this.configService.get('GOOGLE_REDIRECT_URI') || 
      'http://localhost:3000/auth/oauth2/google/callback';

    if (googleClientId && googleClientSecret) {
      this.googleOAuth2Client = new google.auth.OAuth2(
        googleClientId,
        googleClientSecret,
        this.redirectUri
      );

      this.providers['google'] = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        redirectUri: this.redirectUri,
        scopes: [],
        provider: 'google',
      };
    }

    // Initialize other providers
    this.initializeProviders();
  }

  private initializeProviders() {
    // GitHub OAuth2
    const githubClientId = this.configService.get('GITHUB_CLIENT_ID');
    const githubClientSecret = this.configService.get('GITHUB_CLIENT_SECRET');
    if (githubClientId && githubClientSecret) {
      this.providers['github'] = {
        clientId: githubClientId,
        clientSecret: githubClientSecret,
        redirectUri: this.configService.get('GITHUB_REDIRECT_URI') || 
          'http://localhost:3000/auth/oauth2/github/callback',
        scopes: ['user', 'repo'],
        provider: 'github',
      };
    }

    // Slack OAuth2
    const slackClientId = this.configService.get('SLACK_CLIENT_ID');
    const slackClientSecret = this.configService.get('SLACK_CLIENT_SECRET');
    if (slackClientId && slackClientSecret) {
      this.providers['slack'] = {
        clientId: slackClientId,
        clientSecret: slackClientSecret,
        redirectUri: this.configService.get('SLACK_REDIRECT_URI') || 
          'http://localhost:3000/auth/oauth2/slack/callback',
        scopes: ['chat:write', 'channels:read', 'im:read', 'users:read'],
        provider: 'slack',
      };
    }

    // Discord OAuth2
    const discordClientId = this.configService.get('DISCORD_CLIENT_ID');
    const discordClientSecret = this.configService.get('DISCORD_CLIENT_SECRET');
    if (discordClientId && discordClientSecret) {
      this.providers['discord'] = {
        clientId: discordClientId,
        clientSecret: discordClientSecret,
        redirectUri: this.configService.get('DISCORD_REDIRECT_URI') || 
          'http://localhost:3000/auth/oauth2/discord/callback',
        scopes: ['bot'],
        provider: 'discord',
      };
    }
  }

  // Generate OAuth2 authorization URL
  generateAuthUrl(service: string, state: string): string {
    const provider = this.getProviderFromService(service);
    
    if (provider === 'google') {
      const scopes = this.getScopesForService(service);
      return this.googleOAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: state,
        prompt: 'consent', // Force consent to ensure refresh token
      });
    }
    
    return this.generateAuthUrlForProvider(provider, service, state);
  }

  // Generate auth URL for non-Google providers
  generateAuthUrlForProvider(provider: string, service: string, state: string): string {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`OAuth2 provider ${provider} not configured`);
    }

    const scopes = this.getScopesForService(service);
    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      state: state,
      scope: scopes.join(' '),
    });

    switch (provider) {
      case 'github':
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
      case 'slack':
        return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
      case 'discord':
        return `https://discord.com/api/oauth2/authorize?${params.toString()}&response_type=code`;
      default:
        throw new Error(`Unsupported OAuth2 provider: ${provider}`);
    }
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
  async exchangeCodeForTokens(code: string, provider: string = 'google'): Promise<OAuth2Token> {
    if (provider === 'google') {
      try {
        const { tokens } = await this.googleOAuth2Client.getToken(code);
        return tokens as OAuth2Token;
      } catch (error) {
        throw new UnauthorizedException('Invalid authorization code');
      }
    }

    return this.exchangeCodeForProvider(code, provider);
  }

  // Exchange code for non-Google providers
  private async exchangeCodeForProvider(code: string, provider: string): Promise<OAuth2Token> {
    const config = this.providers[provider];
    if (!config) {
      throw new Error(`OAuth2 provider ${provider} not configured`);
    }

    const params = new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
    });

    let tokenUrl: string;
    switch (provider) {
      case 'github':
        tokenUrl = 'https://github.com/login/oauth/access_token';
        params.append('grant_type', 'authorization_code');
        break;
      case 'slack':
        tokenUrl = 'https://slack.com/api/oauth.v2.access';
        break;
      case 'discord':
        tokenUrl = 'https://discord.com/api/oauth2/token';
        params.append('grant_type', 'authorization_code');
        break;
      default:
        throw new Error(`Unsupported OAuth2 provider: ${provider}`);
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        access_token: data.access_token,
        refresh_token: data.refresh_token,
        token_type: data.token_type || 'Bearer',
        scope: data.scope,
        expiry_date: data.expires_in ? Date.now() + (data.expires_in * 1000) : undefined,
      };
    } catch (error) {
      throw new UnauthorizedException(`Failed to exchange code for ${provider}: ${error.message}`);
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

  // Helper method to determine provider from service name
  private getProviderFromService(service: string): string {
    const serviceProviderMap: Record<string, string> = {
      'gmailOAuth2': 'google',
      'gmailOAuth2Api': 'google',
      'googleCalendarOAuth2Api': 'google',
      'googleDocsOAuth2Api': 'google',
      'googleDriveOAuth2Api': 'google',
      'googleSheetsOAuth2Api': 'google',
      'github': 'github',
      'slack': 'slack',
      'discord': 'discord',
    };

    return serviceProviderMap[service] || 'google';
  }

  // Get available providers
  getAvailableProviders(): string[] {
    return Object.keys(this.providers);
  }

  // Get provider configuration
  getProviderConfig(provider: string): OAuth2Config | undefined {
    return this.providers[provider];
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
