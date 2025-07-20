import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/modules/auth/application/services/auth.service';
import { OrganizationsService } from '../src/modules/organizations/application/services/organizations.service';
import { WorkflowsService } from '../src/modules/workflows/application/services/workflows.service';
import { CredentialsService } from '../src/modules/credentials/application/services/credentials.service';
import { UserRole } from '../src/modules/auth/domain/entities/user.entity';
import { OrganizationPlan } from '../src/modules/organizations/domain/entities/organization.entity';
import { WorkflowStatus } from '../src/modules/workflows/domain/entities/workflow.entity';
import { CredentialType } from '../src/modules/credentials/domain/entities/credential.entity';

async function seedDatabase() {
  console.log('🌱 Starting database seeding...');
  
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    const authService = app.get(AuthService);
    const organizationsService = app.get(OrganizationsService);
    const workflowsService = app.get(WorkflowsService);
    const credentialsService = app.get(CredentialsService);

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminUser = await authService.register({
      email: 'admin@weconnect.dev',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
    });
    console.log(`✅ Admin user created: ${adminUser.user.email}`);

    // Create demo user
    console.log('👤 Creating demo user...');
    const demoUser = await authService.register({
      email: 'demo@weconnect.dev',
      password: 'demo123',
      firstName: 'Demo',
      lastName: 'User',
      role: UserRole.USER,
    });
    console.log(`✅ Demo user created: ${demoUser.user.email}`);

    // Create demo organization
    console.log('🏢 Creating demo organization...');
    const demoOrg = await organizationsService.create({
      name: 'Demo Organization',
      slug: 'demo-org',
      description: 'A demo organization for testing WeConnect',
      plan: OrganizationPlan.PRO,
    }, demoUser.user.id);
    console.log(`✅ Demo organization created: ${demoOrg.name}`);

    // Create sample credentials
    console.log('🔐 Creating sample credentials...');
    
    const httpCredential = await credentialsService.create({
      name: 'Demo HTTP API',
      type: CredentialType.API_KEY,
      service: 'http',
      description: 'Demo HTTP API credential',
      data: {
        apiKey: 'demo-api-key-12345',
        baseUrl: 'https://api.example.com',
      },
    }, demoUser.user.id, demoOrg.id);
    console.log(`✅ HTTP credential created: ${httpCredential.name}`);

    const dbCredential = await credentialsService.create({
      name: 'Demo MongoDB',
      type: CredentialType.DATABASE,
      service: 'mongodb',
      description: 'Demo MongoDB connection',
      data: {
        connectionString: 'mongodb://localhost:27017/demo',
        database: 'demo',
      },
    }, demoUser.user.id, demoOrg.id);
    console.log(`✅ Database credential created: ${dbCredential.name}`);

    // Create sample workflows
    console.log('⚡ Creating sample workflows...');

    const webhookWorkflow = await workflowsService.create({
      name: 'Webhook to Database',
      description: 'Receives webhook data and stores it in MongoDB',
      status: WorkflowStatus.ACTIVE,
      configuration: {
        nodes: [
          {
            id: 'webhook-trigger',
            type: 'WebhookTrigger',
            name: 'Webhook Trigger',
            position: { x: 100, y: 100 },
            parameters: {
              httpMethod: 'POST',
              authentication: 'none',
              responseMode: 'custom',
              customResponse: { message: 'Data received successfully' },
            },
          },
          {
            id: 'data-transform',
            type: 'DataTransformer',
            name: 'Transform Data',
            position: { x: 300, y: 100 },
            parameters: {
              operation: 'map',
              fieldMapping: {
                timestamp: 'new Date().toISOString()',
                processedData: 'body',
                source: '"webhook"',
              },
            },
          },
          {
            id: 'mongodb-insert',
            type: 'MongoDB',
            name: 'Store in MongoDB',
            position: { x: 500, y: 100 },
            parameters: {
              operation: 'insertOne',
              database: 'weconnect',
              collection: 'webhook_data',
            },
            credentialId: dbCredential.id,
          },
        ],
        connections: [
          {
            source: 'webhook-trigger',
            target: 'data-transform',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'data-transform',
            target: 'mongodb-insert',
            sourceOutput: 'main',
            targetInput: 'main',
          },
        ],
      },
    }, demoUser.user.id, demoOrg.id);
    console.log(`✅ Webhook workflow created: ${webhookWorkflow.name}`);

    const apiWorkflow = await workflowsService.create({
      name: 'API Data Processor',
      description: 'Fetches data from API, transforms it, and sends notifications',
      status: WorkflowStatus.ACTIVE,
      configuration: {
        nodes: [
          {
            id: 'schedule-trigger',
            type: 'ScheduleTrigger',
            name: 'Every Hour',
            position: { x: 100, y: 100 },
            parameters: {
              cronExpression: '0 * * * *',
              timezone: 'UTC',
            },
          },
          {
            id: 'http-request',
            type: 'AdvancedHTTP',
            name: 'Fetch API Data',
            position: { x: 300, y: 100 },
            parameters: {
              method: 'GET',
              url: 'https://jsonplaceholder.typicode.com/posts',
              timeout: 30000,
              responseFormat: 'json',
            },
          },
          {
            id: 'filter-data',
            type: 'DataTransformer',
            name: 'Filter Recent Posts',
            position: { x: 500, y: 100 },
            parameters: {
              operation: 'filter',
              filterCondition: 'item.id > 90',
            },
          },
          {
            id: 'send-notification',
            type: 'Email',
            name: 'Send Summary Email',
            position: { x: 700, y: 100 },
            parameters: {
              to: 'admin@weconnect.dev',
              subject: 'API Data Summary',
              body: 'Found {{items.length}} new posts',
            },
          },
        ],
        connections: [
          {
            source: 'schedule-trigger',
            target: 'http-request',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'http-request',
            target: 'filter-data',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'filter-data',
            target: 'send-notification',
            sourceOutput: 'main',
            targetInput: 'main',
          },
        ],
      },
    }, demoUser.user.id, demoOrg.id);
    console.log(`✅ API workflow created: ${apiWorkflow.name}`);

    const dataProcessingWorkflow = await workflowsService.create({
      name: 'Advanced Data Processing',
      description: 'Complex data transformation and analysis workflow',
      status: WorkflowStatus.DRAFT,
      configuration: {
        nodes: [
          {
            id: 'manual-trigger',
            type: 'ManualTrigger',
            name: 'Manual Start',
            position: { x: 100, y: 100 },
          },
          {
            id: 'fetch-users',
            type: 'MongoDB',
            name: 'Get Users',
            position: { x: 300, y: 100 },
            parameters: {
              operation: 'find',
              database: 'weconnect',
              collection: 'users',
              limit: 100,
            },
            credentialId: dbCredential.id,
          },
          {
            id: 'group-by-role',
            type: 'DataTransformer',
            name: 'Group by Role',
            position: { x: 500, y: 100 },
            parameters: {
              operation: 'groupBy',
              groupByField: 'role',
            },
          },
          {
            id: 'calculate-stats',
            type: 'DataTransformer',
            name: 'Calculate Statistics',
            position: { x: 700, y: 100 },
            parameters: {
              operation: 'aggregate',
              aggregateFunction: 'count',
            },
          },
          {
            id: 'save-report',
            type: 'MongoDB',
            name: 'Save Report',
            position: { x: 900, y: 100 },
            parameters: {
              operation: 'insertOne',
              database: 'weconnect',
              collection: 'reports',
            },
            credentialId: dbCredential.id,
          },
        ],
        connections: [
          {
            source: 'manual-trigger',
            target: 'fetch-users',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'fetch-users',
            target: 'group-by-role',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'group-by-role',
            target: 'calculate-stats',
            sourceOutput: 'main',
            targetInput: 'main',
          },
          {
            source: 'calculate-stats',
            target: 'save-report',
            sourceOutput: 'main',
            targetInput: 'main',
          },
        ],
      },
    }, demoUser.user.id, demoOrg.id);
    console.log(`✅ Data processing workflow created: ${dataProcessingWorkflow.name}`);

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   👤 Users created: 2`);
    console.log(`   🏢 Organizations created: 1`);
    console.log(`   🔐 Credentials created: 2`);
    console.log(`   ⚡ Workflows created: 3`);
    console.log('\n🔑 Login credentials:');
    console.log(`   Admin: admin@weconnect.dev / admin123`);
    console.log(`   Demo:  demo@weconnect.dev / demo123`);
    console.log('\n🚀 You can now start using WeConnect!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

// Run the seeding
if (require.main === module) {
  seedDatabase().catch(console.error);
}

export { seedDatabase };