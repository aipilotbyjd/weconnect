import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend integration
  app.enableCors();

  // Swagger configuration for WeConnect API
  const config = new DocumentBuilder()
    .setTitle('WeConnect API')
    .setDescription('WeConnect - Workflow Automation Platform API')
    .setVersion('1.0')
    .addTag('workflows', 'Workflow management endpoints')
    .addTag('nodes', 'Node management endpoints')
    .addTag('executions', 'Workflow execution endpoints')
    .addTag('auth', 'Authentication endpoints')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 WeConnect API running on: http://localhost:${port}`);
  console.log(`📖 API Documentation: http://localhost:${port}/api/docs`);
  console.log(`🗄️ Database: MongoDB on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
}
bootstrap();
