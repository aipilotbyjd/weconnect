import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Credential } from './domain/entities/credential.entity';
import { CredentialShare } from './domain/entities/credential-share.entity';
import { CredentialRotation } from './domain/entities/credential-rotation.entity';
import { CredentialsService } from './application/services/credentials.service';
import { CredentialSharingService } from './application/services/credential-sharing.service';
import { CredentialRotationService } from './application/services/credential-rotation.service';
import { OAuth2Service } from './application/services/oauth2.service';
import { EncryptionService } from './application/services/encryption.service';
import { GoogleCredentialsHelper } from './application/services/google-credentials.helper';
import { CredentialIntegrationService } from './application/services/credential-integration.service';
import { WorkflowCredentialContextService } from '../workflows/application/services/workflow-credential-context.service';
import { CredentialsController } from './presentation/controllers/credentials.controller';
import { CredentialSharingController } from './presentation/controllers/credential-sharing.controller';
import { CredentialRotationController } from './presentation/controllers/credential-rotation.controller';
import { OAuth2Controller } from './presentation/controllers/oauth2.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Credential, CredentialShare, CredentialRotation]),
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
