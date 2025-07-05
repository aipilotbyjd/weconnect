import {
  Controller,
  Get,
  Post,
  Query,
  Res,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { OAuth2Service } from '../../application/services/oauth2.service';
import { CredentialsService } from '../../application/services/credentials.service';
import { RequestWithUser } from '../../../auth/domain/interfaces/request-with-user.interface';

@ApiTags('OAuth2')
@Controller('auth/oauth2')
export class OAuth2Controller {
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
    example: 'https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/calendar',
  })
  async googleAuth(
    @Req() req: RequestWithUser,
    @Query('scopes') scopes: string,
    @Res() res: Response,
  ) {
    const userId = req.user.id;
    const scopeArray = scopes
      ? scopes.split(',').map(s => s.trim())
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
      const userInfo = await this.oauth2Service.getUserInfo(tokens.access_token);

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
    const updatedCredential = await this.credentialsService.refreshOAuth2Token(
      credentialId,
    );

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
}
