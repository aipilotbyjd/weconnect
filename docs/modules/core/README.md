# Core Module Documentation

## Overview

The Core Module provides fundamental services and infrastructure components essential for the functioning of WeConnect. It is globally available across the entire application and encapsulates core utilities, exceptions, and execution services.

## Key Components

### Global Exception Filter
- **Purpose**: Provides a global mechanism to handle exceptions and formulate consistent error responses.
- **Implementation**: Utilizes HTTP exception handling for proper error status codes and messaging.
- **Location**: `src/core/filters/global-exception.filter.ts`

### Logger Service
- **Purpose**: Centralized logging service for application-wide logging.
- **Implementation**: Provides methods for structured logging (info, error, debug) with context.
- **Location**: `src/core/infrastructure/logging/logger.service.ts`

### Validation Service
- **Purpose**: Common validation logic for data consistency and rules enforcement.
- **Implementation**: Employs class-validation for strict data model enforcement.
- **Location**: `src/core/infrastructure/validation/validation.service.ts`

### Unified Node Execution Module
- **Purpose**: Coordinate the execution of workflow nodes, managing different node types and execution strategies.
- **Implementation**: Provides interfaces and services to handle node execution logic.
- **Location**: `src/core/node-execution/unified-node-execution.module.ts`

## Core Module Setup

### Imports
- **Config Module**: Centralized configuration handling.
- **UnifiedNodeExecutionModule**: Core node execution logic.

### Providers
- **LoggerService**
- **ValidationService**
- **GlobalExceptionFilter**

### Exports
- LoggerService
- ValidationService
- GlobalExceptionFilter
- UnifiedNodeExecutionModule

## Usage

### Register Core Module
```typescript
import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';

@Module({
  imports: [CoreModule],
})
export class AppModule {}
```

### Using Logger Service
```typescript
import { Injectable } from '@nestjs/common';
import { LoggerService } from './core/infrastructure/logging/logger.service';

@Injectable()
export class SomeService {
  constructor(private readonly logger: LoggerService) {}

  executeTask() {
    this.logger.info('Task execution started', { context: 'SomeService' });
    // ...
    this.logger.info('Task execution completed');
  }
}
```

## Future Enhancements
- Monitor and traceability improvements for better observability.
- Extended validation rules to support complex business logic.
- Advanced logging features with customizable transport and format options.
