import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Presentation Layer
import { AuthController } from './presentation/controllers/auth.controller';

// Application Layer
import { AuthService } from './application/services/auth.service';

// Domain Layer
import { User } from './domain/entities/user.entity';
import { ApiKey } from './domain/entities/api-key.entity';
import { ExecutionLimit } from './domain/entities/execution-limit.entity';

// Infrastructure Layer
import { JwtStrategy } from './infrastructure/strategies/jwt.strategy';
import { ApiKeyStrategy } from './infrastructure/strategies/api-key.strategy';
import { JwtAuthGuard } from './infrastructure/guards/jwt-auth.guard';

import jwtConfig from '../../config/jwt.config';

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
