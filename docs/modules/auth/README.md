# Authentication Module Documentation

## Overview

The Authentication Module provides comprehensive user authentication and authorization services for WeConnect. It implements JWT-based authentication, API key management, and role-based access control (RBAC).

## Architecture

### Domain Layer

#### Entities

**User Entity** (`src/modules/auth/domain/entities/user.entity.ts`)
- Represents system users with authentication capabilities
- Contains user profile information, roles, and organization relationships
- Includes password hashing and validation methods

```typescript
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  currentOrganizationId: string;

  @Column({ nullable: true })
  lastLoginAt: Date;

  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }
}
```

**API Key Entity** (`src/modules/auth/domain/entities/api-key.entity.ts`)
- Manages API keys for programmatic access
- Includes scopes, expiration, and usage tracking

**Execution Limit Entity** (`src/modules/auth/domain/entities/execution-limit.entity.ts`)
- Tracks and enforces execution limits per user/organization
- Prevents resource abuse

### Application Layer

#### AuthService

**Core Functions:**
- User registration and login
- JWT token generation and validation
- User profile management
- Session management

**Key Methods:**

```typescript
async register(registerDto: RegisterDto): Promise<AuthResponseDto>
async login(loginDto: LoginDto): Promise<AuthResponseDto>
async validateUser(userId: string): Promise<User>
private generateTokenResponse(user: User): AuthResponseDto
```

**Authentication Flow:**
1. User provides credentials (email/password)
2. Service validates credentials against database
3. If valid, generates JWT token with user claims
4. Returns token and user information
5. Subsequent requests include Bearer token in Authorization header

### Infrastructure Layer

#### JWT Strategy (`src/modules/auth/infrastructure/strategies/jwt.strategy.ts`)
- Implements Passport JWT strategy
- Validates JWT tokens from requests
- Extracts user information from token payload

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
```

#### API Key Strategy (`src/modules/auth/infrastructure/strategies/api-key.strategy.ts`)
- Implements custom strategy for API key authentication
- Validates API keys from headers or query parameters
- Used for machine-to-machine authentication

#### Guards

**JWT Auth Guard** (`src/modules/auth/infrastructure/guards/jwt-auth.guard.ts`)
- Protects endpoints requiring user authentication
- Automatically validates JWT tokens

**API Key Rate Limit Guard** (`src/modules/auth/infrastructure/guards/api-key-rate-limit.guard.ts`)
- Implements rate limiting for API key usage
- Prevents abuse of API endpoints

### Presentation Layer

#### AuthController

**Endpoints:**
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `GET /auth/profile` - Get current user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/logout` - User logout

**DTOs:**

```typescript
// Registration DTO
export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsString()
  firstName: string;

  @IsString()
  lastName: string;
}

// Login DTO
export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;
}

// Auth Response DTO
export class AuthResponseDto {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: number;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    createdAt: Date;
  };
}
```

## Security Features

### Password Security
- **Hashing**: bcrypt with salt rounds for secure password storage
- **Validation**: Strong password requirements (minimum length, complexity)
- **No Plain Text**: Passwords never stored or transmitted in plain text

### JWT Security
- **Secret Management**: Configurable JWT secret from environment variables
- **Token Expiration**: Configurable token lifetime (default: 7 days)
- **Payload Security**: Minimal sensitive information in token payload

### Rate Limiting
- **Request Limiting**: Throttling to prevent brute force attacks
- **API Key Limits**: Usage quotas for API key authentication
- **Progressive Delays**: Exponential backoff for failed attempts

## Usage Examples

### Protecting Routes

```typescript
@Controller('workflows')
@UseGuards(JwtAuthGuard)
export class WorkflowsController {
  @Get()
  async getWorkflows(@CurrentUser() user: User) {
    return this.workflowService.getUserWorkflows(user.id);
  }
}
```

### Using Current User Decorator

```typescript
@Get('profile')
@UseGuards(JwtAuthGuard)
async getProfile(@CurrentUser() user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  };
}
```

### API Key Authentication

```typescript
@Controller('webhooks')
@UseGuards(ApiKeyAuthGuard)
export class WebhooksController {
  @Post(':id')
  async handleWebhook(@Param('id') id: string, @Body() payload: any) {
    return this.webhookService.processWebhook(id, payload);
  }
}
```

## Configuration

### Environment Variables

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=weconnect
DB_PASSWORD=weconnect123
DB_DATABASE=weconnect

# Redis Configuration (for sessions/caching)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Module Configuration

```typescript
@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    TypeOrmModule.forFeature([User, ApiKey, ExecutionLimit]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, ApiKeyStrategy, JwtAuthGuard],
  exports: [AuthService, JwtStrategy, ApiKeyStrategy, JwtAuthGuard],
})
export class AuthModule {}
```

## Role-Based Access Control

### User Roles

```typescript
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  VIEWER = 'viewer'
}
```

### Role Permissions
- **ADMIN**: Full system access, user management, system configuration
- **USER**: Create/edit workflows, manage own resources, execute workflows
- **VIEWER**: Read-only access to shared resources

### Implementing Role Guards

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.some((role) => user.role?.includes(role));
  }
}
```

## Testing

### Unit Tests
- AuthService methods testing
- Password validation testing
- JWT token generation and validation
- Role-based authorization testing

### Integration Tests
- Authentication flow end-to-end testing
- API endpoint security testing
- Database integration testing

### Example Test

```typescript
describe('AuthService', () => {
  let service: AuthService;
  let userRepository: Repository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  describe('login', () => {
    it('should return JWT token for valid credentials', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      const user = new User();
      user.email = loginDto.email;
      user.validatePassword = jest.fn().mockResolvedValue(true);

      jest.spyOn(userRepository, 'findOne').mockResolvedValue(user);

      const result = await service.login(loginDto);

      expect(result.accessToken).toBeDefined();
      expect(result.tokenType).toBe('Bearer');
    });
  });
});
```

## Error Handling

### Common Authentication Errors
- **Invalid Credentials**: Wrong email/password combination
- **Account Deactivated**: User account is disabled
- **Token Expired**: JWT token has expired
- **Token Invalid**: Malformed or tampered JWT token
- **Insufficient Permissions**: User lacks required role/permissions

### Error Response Format

```typescript
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized",
  "timestamp": "2023-01-01T00:00:00.000Z",
  "path": "/auth/login"
}
```

## Future Enhancements

### Planned Features
- **Multi-Factor Authentication (MFA)**: SMS, email, or app-based 2FA
- **Social Login**: OAuth integration with Google, GitHub, etc.
- **Session Management**: Advanced session control and monitoring
- **Password Recovery**: Secure password reset functionality
- **Account Lockout**: Protection against brute force attacks
- **Audit Logging**: Comprehensive authentication event logging

### Security Improvements
- **Token Rotation**: Automatic token refresh mechanism
- **Device Tracking**: Track and manage user devices
- **IP Whitelisting**: Restrict access by IP address
- **Advanced Rate Limiting**: Per-user and per-IP rate limiting
- **Security Headers**: Implementation of security best practices
