# Credentials Module Documentation

## Overview

The Credentials Module provides secure credential management for WeConnect, enabling users to safely store and use authentication credentials for third-party services. It supports OAuth2 flows, API key management, credential sharing, and automatic rotation.

## Architecture

### Domain Layer

#### Entities

**Credential Entity** (`src/modules/credentials/domain/entities/credential.entity.ts`)
```typescript
@Schema({ timestamps: true })
export class Credential {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CredentialType })
  type: CredentialType;

  @Prop({ required: true })
  service: string;

  @Prop({ required: true, type: Object })
  encryptedData: Record<string, any>;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ type: Date })
  lastUsedAt?: Date;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ type: [String], default: [] })
  scopes: string[];

  @Prop({ default: false })
  isShared: boolean;

  @Prop({ type: Date })
  lastRotatedAt?: Date;

  @Prop({ default: false })
  autoRotate: boolean;

  @Prop({ type: Number })
  rotationIntervalDays?: number;
}
```

**Credential Share Entity** (`src/modules/credentials/domain/entities/credential-share.entity.ts`)
```typescript
@Schema({ timestamps: true })
export class CredentialShare {
  @Prop({ required: true })
  credentialId: string;

  @Prop({ required: true })
  sharedWithUserId: string;

  @Prop({ required: true })
  sharedByUserId: string;

  @Prop({ required: true })
  organizationId: string;

  @Prop({ required: true, enum: SharePermission })
  permission: SharePermission;

  @Prop({ type: Date })
  expiresAt?: Date;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: Object, default: {} })
  restrictions: Record<string, any>;
}
```

**Credential Rotation Entity** (`src/modules/credentials/domain/entities/credential-rotation.entity.ts`)
```typescript
@Schema({ timestamps: true })
export class CredentialRotation {
  @Prop({ required: true })
  credentialId: string;

  @Prop({ required: true, enum: RotationStatus })
  status: RotationStatus;

  @Prop({ required: true, enum: RotationType })
  type: RotationType;

  @Prop({ type: Date, required: true })
  scheduledAt: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: String })
  errorMessage?: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ required: true })
  initiatedBy: string;
}
```

#### Enums

```typescript
export enum CredentialType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
  CUSTOM = 'custom'
}

export enum SharePermission {
  READ = 'read',
  USE = 'use',
  MANAGE = 'manage'
}

export enum RotationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum RotationType {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  SCHEDULED = 'scheduled'
}
```

### Application Layer

#### Credentials Service

**Core Functions:**
- Credential creation and management
- Encryption/decryption of sensitive data
- Credential validation and testing
- Usage tracking and analytics

**Key Methods:**

```typescript
@Injectable()
export class CredentialsService {
  async createCredential(
    createCredentialDto: CreateCredentialDto,
    userId: string,
    organizationId: string
  ): Promise<Credential>

  async updateCredential(
    id: string,
    updateCredentialDto: UpdateCredentialDto,
    userId: string
  ): Promise<Credential>

  async deleteCredential(id: string, userId: string): Promise<void>

  async getCredential(id: string, userId: string): Promise<Credential>

  async getUserCredentials(userId: string, organizationId: string): Promise<Credential[]>

  async getCredentialByService(
    service: string,
    userId: string,
    organizationId: string
  ): Promise<Credential>

  async validateCredential(id: string, userId: string): Promise<boolean>

  async testCredential(id: string, userId: string): Promise<TestResult>

  async getDecryptedCredential(id: string, userId: string): Promise<any>

  async updateLastUsed(id: string): Promise<void>
}
```

#### Credential Sharing Service

**Functions:**
- Share credentials between users
- Manage sharing permissions
- Track shared credential usage

**Key Methods:**

```typescript
@Injectable()
export class CredentialSharingService {
  async shareCredential(
    credentialId: string,
    shareWithUserId: string,
    permission: SharePermission,
    sharedByUserId: string,
    expiresAt?: Date
  ): Promise<CredentialShare>

  async revokeShare(shareId: string, userId: string): Promise<void>

  async getSharedCredentials(userId: string): Promise<CredentialShare[]>

  async getCredentialShares(credentialId: string, userId: string): Promise<CredentialShare[]>

  async updateSharePermission(
    shareId: string,
    permission: SharePermission,
    userId: string
  ): Promise<CredentialShare>

  async canUseCredential(credentialId: string, userId: string): Promise<boolean>
}
```

#### Credential Rotation Service

**Functions:**
- Automatic credential rotation
- Scheduled rotation management
- Rotation history tracking

**Key Methods:**

```typescript
@Injectable()
export class CredentialRotationService {
  async scheduleRotation(
    credentialId: string,
    scheduledAt: Date,
    type: RotationType,
    userId: string
  ): Promise<CredentialRotation>

  async executeRotation(rotationId: string): Promise<void>

  async getRotationHistory(credentialId: string): Promise<CredentialRotation[]>

  @Cron('0 2 * * *') // Daily at 2 AM
  async processScheduledRotations(): Promise<void>

  async enableAutoRotation(
    credentialId: string,
    intervalDays: number,
    userId: string
  ): Promise<void>

  async disableAutoRotation(credentialId: string, userId: string): Promise<void>
}
```

#### OAuth2 Service

**Functions:**
- OAuth2 flow management
- Token refresh and validation
- Provider-specific implementations

**Key Methods:**

```typescript
@Injectable()
export class OAuth2Service {
  async initiateOAuth2Flow(
    provider: string,
    userId: string,
    scopes?: string[]
  ): Promise<string> // Returns authorization URL

  async handleCallback(
    provider: string,
    code: string,
    state: string,
    userId: string
  ): Promise<Credential>

  async refreshToken(credentialId: string, userId: string): Promise<Credential>

  async validateToken(credentialId: string, userId: string): Promise<boolean>

  async revokeToken(credentialId: string, userId: string): Promise<void>
}
```

#### Encryption Service

**Functions:**
- AES-256-GCM encryption/decryption
- Key management
- Secure data handling

**Key Methods:**

```typescript
@Injectable()
export class EncryptionService {
  encrypt(data: any): string
  decrypt(encryptedData: string): any
  generateKey(): string
  rotateEncryptionKey(oldKey: string, newKey: string): Promise<void>
}
```

### Infrastructure Layer

#### Google Credentials Helper

**Functions:**
- Google-specific OAuth2 implementation
- Google API service creation
- Token management for Google services

**Key Methods:**

```typescript
@Injectable()
export class GoogleCredentialsHelper {
  async hasValidGoogleCredentials(userId: string): Promise<boolean>

  async getGoogleService(userId: string, service: string): Promise<any>

  async getGoogleServices(userId: string): Promise<{
    gmail: any;
    calendar: any;
    drive: any;
    docs: any;
    sheets: any;
  }>

  async refreshGoogleTokens(userId: string): Promise<void>

  async validateGoogleCredentials(userId: string): Promise<boolean>
}
```

### Presentation Layer

#### Credentials Controller

**Endpoints:**

```typescript
@Controller('credentials')
@UseGuards(JwtAuthGuard)
export class CredentialsController {
  @Get()
  async getCredentials(@CurrentUser() user: User): Promise<Credential[]>

  @Post()
  async createCredential(
    @Body() createCredentialDto: CreateCredentialDto,
    @CurrentUser() user: User
  ): Promise<Credential>

  @Get(':id')
  async getCredential(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<Credential>

  @Put(':id')
  async updateCredential(
    @Param('id') id: string,
    @Body() updateCredentialDto: UpdateCredentialDto,
    @CurrentUser() user: User
  ): Promise<Credential>

  @Delete(':id')
  async deleteCredential(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<void>

  @Post(':id/validate')
  async validateCredential(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<{ valid: boolean }>

  @Post(':id/test')
  async testCredential(
    @Param('id') id: string,
    @CurrentUser() user: User
  ): Promise<TestResult>

  @Get('service/:service')
  async getCredentialByService(
    @Param('service') service: string,
    @CurrentUser() user: User
  ): Promise<Credential>
}
```

#### OAuth2 Controller

**Endpoints:**

```typescript
@Controller('auth/oauth2')
export class OAuth2Controller {
  @Get(':provider/auth')
  async initiateOAuth2(
    @Param('provider') provider: string,
    @Query('userId') userId: string,
    @Query('scopes') scopes?: string
  ): Promise<{ authUrl: string }>

  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() res: Response
  ): Promise<void>

  @Post(':provider/refresh')
  @UseGuards(JwtAuthGuard)
  async refreshToken(
    @Param('provider') provider: string,
    @Body() body: { credentialId: string },
    @CurrentUser() user: User
  ): Promise<Credential>

  @Post(':provider/validate')
  @UseGuards(JwtAuthGuard)
  async validateCredential(
    @Param('provider') provider: string,
    @Body() body: { credentialId: string },
    @CurrentUser() user: User
  ): Promise<{ valid: boolean }>
}
```

**DTOs:**

```typescript
export class CreateCredentialDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(CredentialType)
  type: CredentialType;

  @IsString()
  @IsNotEmpty()
  service: string;

  @IsObject()
  data: Record<string, any>;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsBoolean()
  @IsOptional()
  autoRotate?: boolean;

  @IsNumber()
  @IsOptional()
  rotationIntervalDays?: number;
}

export class UpdateCredentialDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  data?: Record<string, any>;

  @IsArray()
  @IsOptional()
  scopes?: string[];

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  autoRotate?: boolean;

  @IsNumber()
  @IsOptional()
  rotationIntervalDays?: number;
}
```

## Configuration

### Environment Variables

```env
# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/oauth2/google/callback

# Microsoft OAuth2
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
MICROSOFT_REDIRECT_URI=http://localhost:3000/auth/oauth2/microsoft/callback

# GitHub OAuth2
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GITHUB_REDIRECT_URI=http://localhost:3000/auth/oauth2/github/callback

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:4200

# Credential Settings
CREDENTIAL_ROTATION_ENABLED=true
CREDENTIAL_SHARING_ENABLED=true
CREDENTIAL_ENCRYPTION_ALGORITHM=aes-256-gcm
```

### Module Configuration

```typescript
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Credential.name, schema: CredentialSchema },
      { name: CredentialShare.name, schema: CredentialShareSchema },
      { name: CredentialRotation.name, schema: CredentialRotationSchema },
    ]),
    HttpModule,
    ConfigModule,
    ScheduleModule.forRoot(),
  ],
  controllers: [
    CredentialsController,
    CredentialSharingController,
    CredentialRotationController,
    OAuth2Controller,
  ],
  providers: [
    CredentialsService,
    CredentialSharingService,
    CredentialRotationService,
    OAuth2Service,
    EncryptionService,
    GoogleCredentialsHelper,
    CredentialIntegrationService,
    WorkflowCredentialContextService,
  ],
  exports: [
    CredentialsService,
    CredentialSharingService,
    CredentialRotationService,
    OAuth2Service,
    EncryptionService,
    GoogleCredentialsHelper,
    CredentialIntegrationService,
    WorkflowCredentialContextService,
  ],
})
export class CredentialsModule {}
```

## Usage Examples

### Creating API Key Credential

```typescript
const apiKeyCredential = await credentialsService.createCredential({
  name: 'Slack API Key',
  type: CredentialType.API_KEY,
  service: 'slack',
  data: {
    apiKey: 'xoxb-your-slack-bot-token'
  }
}, userId, organizationId);
```

### Creating OAuth2 Credential

```typescript
// Initiate OAuth2 flow
const authUrl = await oauth2Service.initiateOAuth2Flow(
  'google',
  userId,
  ['https://www.googleapis.com/auth/gmail.readonly']
);

// User visits authUrl and authorizes
// Callback is handled automatically by OAuth2Controller
```

### Using Credentials in Workflow Nodes

```typescript
@Injectable()
export class SlackNode implements INodeExecutor {
  constructor(
    private credentialsService: CredentialsService,
    private encryptionService: EncryptionService
  ) {}

  async execute(node: WorkflowNode, context: NodeExecutionContext) {
    const { credentialId, message, channel } = node.parameters;
    
    // Get and decrypt credential
    const credential = await this.credentialsService.getCredential(
      credentialId,
      context.userId
    );
    
    const decryptedData = this.encryptionService.decrypt(credential.encryptedData);
    
    // Use credential to make API call
    const response = await this.httpService.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel,
        text: message
      },
      {
        headers: {
          'Authorization': `Bearer ${decryptedData.apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update last used timestamp
    await this.credentialsService.updateLastUsed(credentialId);
    
    return {
      success: response.data.ok,
      data: response.data
    };
  }
}
```

### Sharing Credentials

```typescript
// Share credential with another user
const share = await credentialSharingService.shareCredential(
  credentialId,
  shareWithUserId,
  SharePermission.USE,
  currentUserId,
  new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Expires in 30 days
);

// Check if user can use credential
const canUse = await credentialSharingService.canUseCredential(
  credentialId,
  userId
);
```

### Setting up Automatic Rotation

```typescript
// Enable auto-rotation every 90 days
await credentialRotationService.enableAutoRotation(
  credentialId,
  90,
  userId
);

// Schedule manual rotation
await credentialRotationService.scheduleRotation(
  credentialId,
  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 7 days
  RotationType.SCHEDULED,
  userId
);
```

## Security Features

### Encryption
- **Algorithm**: AES-256-GCM for maximum security
- **Key Management**: Configurable encryption keys
- **Data Protection**: All sensitive data encrypted at rest
- **Key Rotation**: Support for encryption key rotation

### Access Control
- **User Isolation**: Users can only access their own credentials
- **Organization Boundaries**: Credentials scoped to organizations
- **Permission-based Sharing**: Granular sharing permissions
- **Audit Trail**: Complete access and usage logging

### OAuth2 Security
- **State Parameter**: CSRF protection for OAuth2 flows
- **Secure Redirects**: Validated redirect URIs
- **Token Storage**: Encrypted token storage
- **Automatic Refresh**: Transparent token refresh

## Supported Services

### OAuth2 Providers
- **Google**: Gmail, Calendar, Drive, Docs, Sheets
- **Microsoft**: Office 365, Outlook, OneDrive
- **GitHub**: Repository access, user data
- **Slack**: Workspace integration
- **Discord**: Bot and user tokens

### API Key Services
- **AWS**: S3, Lambda, SES, SNS
- **Stripe**: Payment processing
- **Twilio**: SMS and voice services
- **SendGrid**: Email delivery
- **Mailgun**: Email services

### Custom Integrations
- **Basic Auth**: Username/password combinations
- **Bearer Tokens**: Custom API tokens
- **Custom Headers**: Proprietary authentication schemes

## Error Handling

### Common Errors
- **Invalid Credentials**: Expired or revoked tokens
- **Encryption Errors**: Key rotation or corruption issues
- **OAuth2 Errors**: Authorization failures
- **Sharing Errors**: Permission or access issues

### Error Response Format

```typescript
{
  "statusCode": 400,
  "message": "Credential validation failed",
  "error": "Bad Request",
  "details": {
    "credentialId": "credential-uuid",
    "service": "google",
    "errorType": "token_expired",
    "suggestion": "Please re-authorize your Google account"
  }
}
```

## Testing

### Unit Tests
```typescript
describe('CredentialsService', () => {
  let service: CredentialsService;
  let model: Model<Credential>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CredentialsService,
        {
          provide: getModelToken(Credential.name),
          useValue: mockModel,
        },
        {
          provide: EncryptionService,
          useValue: mockEncryptionService,
        },
      ],
    }).compile();

    service = module.get<CredentialsService>(CredentialsService);
  });

  describe('createCredential', () => {
    it('should create and encrypt credential', async () => {
      const createDto = {
        name: 'Test API Key',
        type: CredentialType.API_KEY,
        service: 'test-service',
        data: { apiKey: 'secret-key' }
      };

      const result = await service.createCredential(createDto, 'user-id', 'org-id');
      
      expect(result.name).toBe(createDto.name);
      expect(result.encryptedData).toBeDefined();
      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(createDto.data);
    });
  });
});
```

### Integration Tests
```typescript
describe('OAuth2 Flow Integration', () => {
  it('should complete Google OAuth2 flow', async () => {
    // Mock Google OAuth2 response
    const mockTokenResponse = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expires_in: 3600,
      scope: 'https://www.googleapis.com/auth/gmail.readonly'
    };

    jest.spyOn(httpService, 'post').mockResolvedValue({
      data: mockTokenResponse
    });

    const credential = await oauth2Service.handleCallback(
      'google',
      'auth-code',
      'state-token',
      'user-id'
    );

    expect(credential.type).toBe(CredentialType.OAUTH2);
    expect(credential.service).toBe('google');
  });
});
```

## Monitoring and Analytics

### Usage Metrics
- Credential usage frequency
- Service popularity
- Error rates by service
- Token refresh patterns

### Security Monitoring
- Failed authentication attempts
- Unusual access patterns
- Credential sharing activity
- Rotation compliance

### Performance Metrics
- Encryption/decryption times
- OAuth2 flow completion rates
- API response times
- Cache hit rates

## Future Enhancements

### Planned Features
- **Multi-factor Authentication**: Additional security for sensitive credentials
- **Credential Templates**: Pre-configured credential types
- **Bulk Operations**: Mass credential management
- **Advanced Sharing**: Team-based credential sharing
- **Compliance Reporting**: SOC2, GDPR compliance features
- **Credential Marketplace**: Shared credential configurations

### Integration Roadmap
- **Azure Active Directory**: Enterprise SSO integration
- **AWS IAM**: Role-based AWS access
- **Kubernetes Secrets**: Container orchestration integration
- **HashiCorp Vault**: Enterprise secret management
- **LDAP/Active Directory**: Enterprise directory integration

---

**Last Updated**: $(date)
**Module Version**: 1.0.0
**Maintainer**: WeConnect Security Team