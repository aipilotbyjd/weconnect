import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Presentation Layer
import { AuthController } from './presentation/controllers/auth.controller';

// Application Layer
import { AuthService } from './application/services/auth.service';

// Domain Layer
import { User, UserSchema } from './domain/entities/user.entity';
import { ApiKey, ApiKeySchema } from './domain/entities/api-key.entity';
import { ExecutionLimit, ExecutionLimitSchema } from './domain/entities/execution-limit.entity';

// Infrastructure Layer
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { ApiKeyStrategy } from './infrastructure/strategies/api-key.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

import jwtConfig from '../../config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: ApiKey.name, schema: ApiKeySchema },
      { name: ExecutionLimit.name, schema: ExecutionLimitSchema },
    ]),
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
