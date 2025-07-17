import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/infrastructure/guards/jwt-auth.guard';
import { CredentialsService } from '../../application/services/credentials.service';
import { CreateCredentialDto } from '../dto/create-credential.dto';
import { UpdateCredentialDto } from '../dto/update-credential.dto';
import { RequestWithUser } from '../../../auth/domain/interfaces/request-with-user.interface';

@ApiTags('Credentials')
@Controller('credentials')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CredentialsController {
  constructor(private readonly credentialsService: CredentialsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new credential' })
  async create(
    @Req() req: RequestWithUser,
    @Body() createCredentialDto: CreateCredentialDto,
  ) {
    const userId = req.user.id;
    const credential = await this.credentialsService.create(
      userId,
      createCredentialDto,
    );

    // Return credential without encrypted data
    const { encryptedData, ...result } = credential;
    return result;
  }

  @Get()
  @ApiOperation({ summary: 'Get all credentials for the current user' })
  async findAll(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    const credentials = await this.credentialsService.findAll(userId);

    // Return credentials without encrypted data
    return credentials.map(({ encryptedData, ...credential }) => credential);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    const credential = await this.credentialsService.findOne(id, userId);

    // Return credential without encrypted data
    const { encryptedData, ...result } = credential;
    return result;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() updateCredentialDto: UpdateCredentialDto,
  ) {
    const userId = req.user.id;
    const credential = await this.credentialsService.update(
      id,
      userId,
      updateCredentialDto,
    );

    // Return credential without encrypted data
    const { encryptedData, ...result } = credential;
    return result;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    await this.credentialsService.delete(id, userId);
    return { success: true };
  }

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate a credential' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  async validate(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    const isValid = await this.credentialsService.validateCredential(
      id,
      userId,
    );
    return { credentialId: id, isValid };
  }

  @Get('service/:service')
  @ApiOperation({ summary: 'Get credentials by service' })
  @ApiParam({ name: 'service', description: 'Service name (e.g., google)' })
  async findByService(
    @Req() req: RequestWithUser,
    @Param('service') service: string,
  ) {
    const userId = req.user.id;
    const credential = await this.credentialsService.findByServiceAndUser(
      service,
      userId,
    );

    if (!credential) {
      return null;
    }

    // Return credential without encrypted data
    const { encryptedData, ...result } = credential;
    return result;
  }

  @Get(':id/test')
  @ApiOperation({ summary: 'Test credential connectivity' })
  @ApiParam({ name: 'id', description: 'Credential ID' })
  async testCredential(@Req() req: RequestWithUser, @Param('id') id: string) {
    const userId = req.user.id;
    return await this.credentialsService.testCredential(id, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get credential statistics' })
  async getStats(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.credentialsService.getCredentialStats(userId);
  }

  @Post('refresh-expired')
  @ApiOperation({ summary: 'Refresh all expired OAuth2 tokens' })
  async refreshExpiredTokens(@Req() req: RequestWithUser) {
    const userId = req.user.id;
    return await this.credentialsService.refreshExpiredTokens(userId);
  }
}
