import { Controller, Get, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UnifiedNodeRegistryService } from '../registry/unified-node-registry.service';
import { NodeExecutorMigrationService } from '../migration/node-executor-migration.service';

@ApiTags('Node Execution Admin')
@Controller('admin/node-execution')
export class NodeExecutionAdminController {
  constructor(
    private readonly nodeRegistry: UnifiedNodeRegistryService,
    private readonly migrationService: NodeExecutorMigrationService,
  ) {}

  @Get('registry/status')
  @ApiOperation({ summary: 'Get node registry status' })
  @ApiResponse({
    status: 200,
    description: 'Registry status retrieved successfully',
  })
  getRegistryStatus() {
    const availableTypes = this.nodeRegistry.getAvailableNodeTypes();
    const schemas = this.nodeRegistry.getAllSchemas();
    const validation = this.nodeRegistry.validateRegistry();

    return {
      totalExecutors: availableTypes.length,
      availableTypes,
      schemasByGroup: schemas,
      validation,
    };
  }

  @Get('migration/status')
  @ApiOperation({ summary: 'Get migration status' })
  @ApiResponse({
    status: 200,
    description: 'Migration status retrieved successfully',
  })
  getMigrationStatus() {
    return this.migrationService.getMigrationStatus();
  }

  @Get('migration/cleanup-instructions')
  @ApiOperation({ summary: 'Get cleanup instructions for legacy executors' })
  @ApiResponse({
    status: 200,
    description: 'Cleanup instructions retrieved successfully',
  })
  getCleanupInstructions() {
    return {
      instructions: this.migrationService.generateCleanupInstructions(),
    };
  }

  @Get('migration/sql-script')
  @ApiOperation({ summary: 'Generate SQL migration script' })
  @ApiResponse({
    status: 200,
    description: 'SQL migration script generated successfully',
  })
  getSQLMigrationScript() {
    return {
      sql: this.migrationService.generateSQLMigration(),
    };
  }

  @Get('migration/validate-database')
  @ApiOperation({ summary: 'Validate database node types' })
  @ApiResponse({ status: 200, description: 'Database validation completed' })
  async validateDatabaseNodeTypes() {
    return await this.migrationService.validateDatabaseNodeTypes();
  }

  @Post('test/all-executors')
  @ApiOperation({ summary: 'Test all registered executors' })
  @ApiResponse({ status: 200, description: 'Executor tests completed' })
  async testAllExecutors() {
    return await this.migrationService.testAllExecutors();
  }

  @Get('schemas/:nodeType')
  @ApiOperation({ summary: 'Get schema for specific node type' })
  @ApiResponse({
    status: 200,
    description: 'Node schema retrieved successfully',
  })
  getNodeSchema(nodeType: string) {
    const schema = this.nodeRegistry.getSchema(nodeType);
    if (!schema) {
      return { error: `Node type '${nodeType}' not found` };
    }
    return schema;
  }

  @Get('search')
  @ApiOperation({ summary: 'Search nodes by query' })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  searchNodes(query: string) {
    const results = this.nodeRegistry.searchNodes(query || '');
    return {
      query,
      results,
      count: results.length,
    };
  }
}
