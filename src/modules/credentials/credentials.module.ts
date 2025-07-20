import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Credential, CredentialSchema } from './domain/entities/credential.entity';
import { CredentialShare, CredentialShareSchema } from './domain/entities/credential-share.entity';
import { CredentialRotation, CredentialRotationSchema } from './domain/entities/credential-rotation.entity';
import { CredentialsService } from './application/services/credentials.service';
import { CredentialSharingService } from './application/services/credential-sharing.service';
import { CredentialRotationService } from './application/services/credential-rotation.service';
import { OAuth2Service } from './application/services/oauth2.service';
import { EncryptionService } from './application/services/encryption.service';
import { GoogleCredentialsHelper } from './application/services/google-credentials.helper';
import { CredentialIntegrationService } from './application/services/credential-integration.service';
import { WorkflowCredentialContextService } from './application/services/workflow-credential-context.service';
import { CredentialsController } from './presentation/controllers/credentials.controller';
import { CredentialSharingController } from './presentation/controllers/credential-sharing.controller';
import { CredentialRotationController } from './presentation/controllers/credential-rotation.controller';
import { OAuth2Controller } from './presentation/controllers/oauth2.controller';

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
