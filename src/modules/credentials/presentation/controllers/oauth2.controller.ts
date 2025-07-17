import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  Req,
  Param,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { OAuth2Service } from '../../application/services/oauth2.service';
import { CredentialsService } from '../../application/services/credentials.service';
import { RequestWithUser } from '../../../auth/domain/interfaces/request-with-user.interface';

@ApiTags('OAuth2')
@Controller('auth/oauth2')
export class OAuth2Controller {
  private readonly logger = new Logger(OAuth2Controller.name);

  constructor(
    private readonly oauth2Service: OAuth2Service,
    private readonly credentialsService: CredentialsService,
  ) {}

  @Get('google/auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate Google OAuth2 authentication' })
  @ApiQuery({
    name: 'scopes',
    required: false,
    description: 'Comma-separated list of scopes',
    example:
      'https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/calendar',
  })
  async googleAuth(
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const scopeArray = scopes
      ? scopes.split(',').map((s) => s.trim())
      : [
          'https://www.googleapis.com/auth/gmail.readonly',
          'https://www.googleapis.com/auth/gmail.send',
          'https://www.googleapis.com/auth/calendar',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/userinfo.email',
          'https://www.googleapis.com/auth/userinfo.profile',
        ];

    // Store userId in state to retrieve after callback
    const state = Buffer.from(
      JSON.stringify({ userId, timestamp: Date.now() }),
    ).toString('base64');

    const authUrl = this.oauth2Service.getAuthUrl(scopeArray, state);
    res.redirect(authUrl);
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Handle Google OAuth2 callback' })
  @ApiQuery({ name: 'code', required: true })
  @ApiQuery({ name: 'state', required: true })
  async googleCallback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    try {
      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { userId } = stateData;

      // Exchange code for tokens
      const tokens = await this.oauth2Service.getTokens(code);

      // Get user info from Google
      const userInfo = await this.oauth2Service.getUserInfo(
        tokens.access_token,
      );

      // Create or update credential
      await this.credentialsService.createOAuth2Credential(
        userId,
        'google',
        tokens,
        userInfo,
      );

      // Redirect to frontend success page
      res.redirect(`${process.env.FRONTEND_URL}/credentials?status=success`);
    } catch (error) {
      console.error('OAuth2 callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/credentials?status=error`);
    }
  }

  @Post('google/refresh')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Refresh Google OAuth2 tokens' })
  @ApiQuery({ name: 'credentialId', required: true })
  async refreshGoogleToken(
    @Req() req: RequestWithUser,
    @Query('credentialId') credentialId: string,
  ) {
    const userId = req.user.id;

    // Verify the credential belongs to the user
    await this.credentialsService.findOne(credentialId, userId);

    // Refresh the token
    const updatedCredential =
      await this.credentialsService.refreshOAuth2Token(credentialId);

    return {
      success: true,
      credentialId: updatedCredential.id,
      expiresAt: updatedCredential.expiresAt,
    };
  }

  @Get('google/validate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Validate Google OAuth2 credential' })
  @ApiQuery({ name: 'credentialId', required: true })
  async validateGoogleToken(
    @Req() req: RequestWithUser,
    @Query('credentialId') credentialId: string,
  ) {
    const userId = req.user.id;
    const isValid = await this.credentialsService.validateCredential(
      credentialId,
      userId,
    );

    return {
      credentialId,
      isValid,
    };
  }

  // Multi-provider OAuth2 endpoints
  @Get(':provider/auth')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Initiate OAuth2 authentication for any provider' })
  async providerAuth(
    @Param('provider') provider: string,
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string,
    @Res() res: Response,
  ) {
    const validProviders = ['google', 'github', 'slack', 'discord'];
    if (!validProviders.includes(provider)) {
      throw new BadRequestException(`Unsupported OAuth2 provider: ${provider}`);
    }

    const userId = req.user.id;
    const state = Buffer.from(
      JSON.stringify({ userId, provider, timestamp: Date.now() }),
    ).toString('base64');

    // Use service-specific scope defaults or custom scopes
    const serviceName = this.getServiceNameForProvider(provider, scopes);
    const authUrl = this.oauth2Service.generateAuthUrl(serviceName, state);

    res.redirect(authUrl);
  }

  @Get(':provider/callback')
  @ApiOperation({ summary: 'Handle OAuth2 callback for any provider' })
  async providerCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response,
  ) {
    if (!code || !state) {
      throw new BadRequestException('Missing code or state parameter');
    }

    const validProviders = ['google', 'github', 'slack', 'discord'];
    if (!validProviders.includes(provider)) {
      throw new BadRequestException(`Unsupported OAuth2 provider: ${provider}`);
    }

    try {
      // Decode state to get userId
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      const { userId } = stateData;

      // Exchange code for tokens
      const tokens = await this.oauth2Service.exchangeCodeForTokens(
        code,
        provider,
      );

      // Get user info based on provider
      let userInfo: any = {};
      let serviceName = provider;

      switch (provider) {
        case 'google':
          userInfo = await this.oauth2Service.getUserInfo(tokens.access_token);
          serviceName = 'google';
          break;
        case 'github':
          userInfo = await this.getGitHubUserInfo(tokens.access_token);
          serviceName = 'github';
          break;
        case 'slack':
          userInfo = await this.getSlackUserInfo(tokens.access_token);
          serviceName = 'slack';
          break;
        case 'discord':
          userInfo = await this.getDiscordUserInfo(tokens.access_token);
          serviceName = 'discord';
          break;
      }

      // Create or update credential
      await this.credentialsService.createOAuth2Credential(
        userId,
        serviceName,
        tokens,
        userInfo,
      );

      // Redirect to frontend success page
      res.redirect(
        `${process.env.FRONTEND_URL}/credentials?status=success&provider=${provider}`,
      );
    } catch (error) {
      this.logger.error(`${provider} OAuth2 callback error:`, error);
      res.redirect(
        `${process.env.FRONTEND_URL}/credentials?status=error&provider=${provider}`,
      );
    }
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get available OAuth2 providers' })
  async getProviders() {
    return {
      providers: this.oauth2Service.getAvailableProviders(),
    };
  }

  // Helper methods
  private getServiceNameForProvider(
    provider: string,
    customScopes?: string,
  ): string {
    const serviceMap: Record<string, string> = {
      google: customScopes?.includes('gmail')
        ? 'gmailOAuth2Api'
        : 'googleSheetsOAuth2Api',
      github: 'github',
      slack: 'slack',
      discord: 'discord',
    };

    return serviceMap[provider] || provider;
  }

  private async getGitHubUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch GitHub user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      login: data.login,
      name: data.name,
      email: data.email,
      avatar_url: data.avatar_url,
    };
  }

  private async getSlackUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://slack.com/api/auth.test', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Slack user info');
    }

    const data = await response.json();
    return {
      user: data.user,
      user_id: data.user_id,
      team: data.team,
      team_id: data.team_id,
      url: data.url,
    };
  }

  private async getDiscordUserInfo(accessToken: string): Promise<any> {
    const response = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Discord user info');
    }

    const data = await response.json();
    return {
      id: data.id,
      username: data.username,
      discriminator: data.discriminator,
      avatar: data.avatar,
      email: data.email,
    };
  }
}
