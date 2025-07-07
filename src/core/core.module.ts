import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './infrastructure/logging/logger.service';
import { ValidationService } from './infrastructure/validation/validation.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    LoggerService,
    ValidationService,
    GlobalExceptionFilter,
  ],
  exports: [
    LoggerService,
    ValidationService,
    GlobalExceptionFilter,
  ],
})
export class CoreModule {}
