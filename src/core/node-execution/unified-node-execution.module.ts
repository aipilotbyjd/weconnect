import { Module, OnModuleInit } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

// Core services
import { UnifiedNodeRegistryService } from './registry/unified-node-registry.service';
import { UnifiedNodeExecutionService } from './services/unified-node-execution.service';

// Migration services
import { NodeExecutorMigrationService } from './migration/node-executor-migration.service';
import { NodeExecutionAdminController } from './controllers/node-execution-admin.controller';

// Core executors
import { HttpRequestNodeExecutor } from './executors/core/http-request.executor';
import { ConditionNodeExecutor } from './executors/core/condition.executor';
import { TriggerNodeExecutor } from './executors/core/trigger.executor';
import { DelayNodeExecutor } from './executors/core/delay.executor';

// Integration executors
import { SlackNodeExecutor } from './executors/integrations/slack.executor';

@Module({
  imports: [HttpModule],
  controllers: [NodeExecutionAdminController],
  providers: [
    // Core services
    UnifiedNodeRegistryService,
    UnifiedNodeExecutionService,
    NodeExecutorMigrationService,
    
    // Core executors
    HttpRequestNodeExecutor,
    ConditionNodeExecutor,
    TriggerNodeExecutor,
    DelayNodeExecutor,
    
    // Integration executors
    SlackNodeExecutor,
  ],
  exports: [
    UnifiedNodeRegistryService,
    UnifiedNodeExecutionService,
    NodeExecutorMigrationService,
  ],
})
export class UnifiedNodeExecutionModule implements OnModuleInit {
  constructor(
    private readonly nodeRegistry: UnifiedNodeRegistryService,
    
    // Core executors
    private readonly httpRequestExecutor: HttpRequestNodeExecutor,
    private readonly conditionExecutor: ConditionNodeExecutor,
    private readonly triggerExecutor: TriggerNodeExecutor,
    private readonly delayExecutor: DelayNodeExecutor,
    
    // Integration executors
    private readonly slackExecutor: SlackNodeExecutor,
  ) {}

  onModuleInit() {
    this.registerAllExecutors();
  }

  private registerAllExecutors() {
    // Register core executors
    this.nodeRegistry.registerExecutor('httpRequest', this.httpRequestExecutor);
    this.nodeRegistry.registerExecutor('condition', this.conditionExecutor);
    this.nodeRegistry.registerExecutor('trigger', this.triggerExecutor);
    this.nodeRegistry.registerExecutor('delay', this.delayExecutor);
    
    // Register integration executors
    this.nodeRegistry.registerExecutor('slack', this.slackExecutor);
    
    // Log registration summary
    const registeredTypes = this.nodeRegistry.getAvailableNodeTypes();
    console.log(`🔧 Registered ${registeredTypes.length} node executors:`, registeredTypes);
    
    // Validate all executors
    const validation = this.nodeRegistry.validateRegistry();
    if (validation.invalid.length > 0) {
      console.warn('⚠️  Invalid executors found:', validation.invalid);
    }
  }
}