import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerService } from './infrastructure/logging/logger.service';
import { ValidationService } from './infrastructure/validation/validation.service';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { UnifiedNodeExecutionModule } from './node-execution/unified-node-execution.module';

@Global()
@Module({
  imports: [
    ConfigModule,
    UnifiedNodeExecutionModule,
  ],
  providers: [
    LoggerService,
    ValidationService,
    GlobalExceptionFilter,
  ],
  exports: [
    LoggerService,
    ValidationService,
    GlobalExceptionFilter,
    UnifiedNodeExecutionModule,
  ],
})
export class CoreModule {}
