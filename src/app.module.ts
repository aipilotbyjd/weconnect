import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_FILTER } from '@nestjs/core';

// Core
import { CoreModule } from './core/core.module';
import { GlobalExceptionFilter } from './core/filters/global-exception.filter';

// Controllers and Services
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Feature Modules
import { WorkflowsModule } from './modules/workflows/workflows.module';
import { NodesModule } from './modules/nodes/nodes.module';
import { ExecutionsModule } from './modules/executions/executions.module';
import { AuthModule } from './modules/auth/auth.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { CredentialsModule } from './modules/credentials/credentials.module';
import { TemplatesModule } from './modules/templates/templates.module';
import { AIAgentsModule } from './modules/ai-agents/ai-agents.module';
import { SchedulerModule } from './modules/scheduler/scheduler.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';

// Configuration
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';

@Module({
  imports: [
    // Core Infrastructure
    CoreModule,
    
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      load: [databaseConfig, jwtConfig, redisConfig],
    }),
    
    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds in milliseconds
        limit: 100,
      },
    ]),
    
    // Database
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) =>
        configService.get('database')!,
      inject: [ConfigService],
    }),
    
    // Feature Modules (ordered by dependency)
    OrganizationsModule,
    AuthModule,
    CredentialsModule,
    TemplatesModule,
    NodesModule,
    AIAgentsModule,
    SchedulerModule,
    MonitoringModule,
    WorkflowsModule, 
    ExecutionsModule, 
    WebhooksModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule {}
