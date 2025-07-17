import { Injectable, Logger } from '@nestjs/common';
import { UnifiedNodeRegistryService } from '../registry/unified-node-registry.service';
import { UnifiedNodeExecutionService } from '../services/unified-node-execution.service';

@Injectable()
export class NodeExecutorMigrationService {
  private readonly logger = new Logger(NodeExecutorMigrationService.name);

  constructor(
    private readonly nodeRegistry: UnifiedNodeRegistryService,
    private readonly nodeExecution: UnifiedNodeExecutionService,
  ) {}

  /**
   * Get migration status and recommendations
   */
  getMigrationStatus(): {
    unifiedExecutors: string[];
    legacyExecutors: string[];
    duplicateExecutors: string[];
    recommendations: string[];
  } {
    const unifiedExecutors = this.nodeRegistry.getAvailableNodeTypes();

    // These are the legacy executors that should be removed
    const legacyExecutors = [
      'TriggerNodeExecutor',
      'HttpRequestNodeExecutor', // Legacy version
      'ActionNodeExecutor',
      'ConditionNodeExecutor', // Legacy version
      'WebhookNodeExecutor',
      'EmailNodeExecutor',
      'DelayNodeExecutor',
      'SlackNodeExecutor', // Legacy version
      'DiscordNodeExecutor',
      'GmailNodeExecutor',
      'TelegramNodeExecutor',
      'GitHubNodeExecutor',
      'GoogleSheetsNodeExecutor',
      'TrelloNodeExecutor',
    ];

    const duplicateExecutors = [
      'slack', // Both unified and legacy exist
      'httpRequest', // Both unified and legacy exist
      'condition', // Both unified and legacy exist
    ];

    const recommendations = [
      '1. Remove legacy node executors from workflows module',
      '2. Update WorkflowsModule to use UnifiedNodeExecutionService',
      '3. Remove duplicate executor registrations',
      '4. Update existing workflows to use new node type names',
      '5. Test all node types with the new unified system',
    ];

    return {
      unifiedExecutors,
      legacyExecutors,
      duplicateExecutors,
      recommendations,
    };
  }

  /**
   * Generate cleanup script for removing legacy executors
   */
  generateCleanupInstructions(): string[] {
    return [
      '// Files to remove:',
      'src/modules/workflows/application/node-executors/executors/',
      'src/modules/workflows/application/node-executors/node-executor.interface.ts',
      'src/modules/workflows/application/node-executors/node-executor.factory.ts',
      '',
      '// Files to update:',
      'src/modules/workflows/workflows.module.ts - Remove legacy executor imports',
      'src/modules/workflows/application/services/workflow-execution.service.ts - Use UnifiedNodeExecutionService',
      '',
      '// Database migration needed:',
      "UPDATE workflow_nodes SET type = 'httpRequest' WHERE type = 'http-request';",
      "UPDATE workflow_nodes SET type = 'slack' WHERE type = 'SLACK';",
      '-- Add more type mappings as needed',
    ];
  }

  /**
   * Validate that all node types in database are supported
   */
  async validateDatabaseNodeTypes(): Promise<{
    supported: string[];
    unsupported: string[];
    needsMigration: { oldType: string; newType: string }[];
  }> {
    // This would query your database to get all unique node types
    // For now, returning example data
    const databaseNodeTypes = [
      'http-request', // Legacy
      'SLACK', // Legacy
      'condition', // Should work
      'trigger', // Needs mapping
      'email', // Needs implementation
    ];

    const supported: string[] = [];
    const unsupported: string[] = [];
    const needsMigration: { oldType: string; newType: string }[] = [];

    for (const dbType of databaseNodeTypes) {
      if (this.nodeRegistry.isSupported(dbType)) {
        supported.push(dbType);
      } else {
        // Check if there's a mapping available
        const mapping = this.getTypeMappings()[dbType];
        if (mapping && this.nodeRegistry.isSupported(mapping)) {
          needsMigration.push({ oldType: dbType, newType: mapping });
        } else {
          unsupported.push(dbType);
        }
      }
    }

    return { supported, unsupported, needsMigration };
  }

  /**
   * Get mapping from old node types to new unified types
   */
  private getTypeMappings(): Record<string, string> {
    return {
      'http-request': 'httpRequest',
      HTTP_REQUEST: 'httpRequest',
      SLACK: 'slack',
      CONDITION: 'condition',
      TRIGGER: 'trigger', // When implemented
      EMAIL: 'email', // When implemented
      DELAY: 'delay', // When implemented
      WEBHOOK: 'webhook', // When implemented
      GMAIL: 'gmail', // When implemented
      DISCORD: 'discord', // When implemented
      TELEGRAM: 'telegram', // When implemented
      GITHUB: 'github', // When implemented
      GOOGLE_SHEETS: 'googleSheets', // When implemented
      TRELLO: 'trello', // When implemented
    };
  }

  /**
   * Generate SQL migration script
   */
  generateSQLMigration(): string {
    const mappings = this.getTypeMappings();
    const sqlStatements: string[] = [
      '-- Node Type Migration Script',
      '-- Run this to update existing workflow nodes to use unified node types',
      '',
    ];

    for (const [oldType, newType] of Object.entries(mappings)) {
      sqlStatements.push(
        `UPDATE workflow_nodes SET type = '${newType}' WHERE type = '${oldType}';`,
      );
    }

    sqlStatements.push(
      '',
      '-- Verify migration',
      'SELECT type, COUNT(*) as count FROM workflow_nodes GROUP BY type ORDER BY type;',
    );

    return sqlStatements.join('\n');
  }

  /**
   * Test all unified executors
   */
  async testAllExecutors(): Promise<{
    passed: string[];
    failed: { executor: string; error: string }[];
  }> {
    const passed: string[] = [];
    const failed: { executor: string; error: string }[] = [];

    const executors = this.nodeRegistry.getAllExecutors();

    for (const [nodeType, executor] of executors) {
      try {
        // Test schema generation
        const schema = executor.getSchema();
        if (!schema || !schema.name) {
          throw new Error('Invalid schema');
        }

        // Test validation with empty config
        const validation = executor.validate({});
        if (typeof validation.isValid !== 'boolean') {
          throw new Error('Invalid validation response');
        }

        passed.push(nodeType);
        this.logger.log(`✅ ${nodeType} executor test passed`);
      } catch (error) {
        failed.push({ executor: nodeType, error: error.message });
        this.logger.error(
          `❌ ${nodeType} executor test failed: ${error.message}`,
        );
      }
    }

    return { passed, failed };
  }
}
