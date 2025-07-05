import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { Credential } from './domain/entities/credential.entity';
import { CredentialsService } from './application/services/credentials.service';
import { OAuth2Service } from './application/services/oauth2.service';
import { EncryptionService } from './application/services/encryption.service';
import { GoogleCredentialsHelper } from './application/services/google-credentials.helper';
import { CredentialsController } from './presentation/controllers/credentials.controller';
import { OAuth2Controller } from './presentation/controllers/oauth2.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential]),
    HttpModule,
    ConfigModule,
  ],
  controllers: [CredentialsController, OAuth2Controller],
  providers: [
    CredentialsService,
    OAuth2Service,
    EncryptionService,
    GoogleCredentialsHelper,
  ],
  exports: [
    CredentialsService,
    OAuth2Service,
    EncryptionService,
    GoogleCredentialsHelper,
  ],
})
export class CredentialsModule {}
