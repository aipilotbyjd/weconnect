import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from 'typeorm';

export class CreateAIAgentsTables1751692000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_agents table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agents',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'provider',
            type: 'varchar',
            length: '50',
          },
          {
            name: 'model',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create ai_agent_executions table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_executions',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agentId',
            type: 'uuid',
          },
          {
            name: 'workflowExecutionId',
            type: 'uuid',
          },
          {
            name: 'nodeId',
            type: 'uuid',
          },
          {
            name: 'inputData',
            type: 'jsonb',
          },
          {
            name: 'outputData',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'running', 'completed', 'failed', 'cancelled'],
            default: "'pending'",
          },
          {
            name: 'error',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
          },
          {
            name: 'tokensUsed',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'executionTime',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create ai_agent_tools table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_tools',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agentId',
            type: 'uuid',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'configuration',
            type: 'jsonb',
            default: "'{}'",
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create ai_agent_memory table
    await queryRunner.createTable(
      new Table({
        name: 'ai_agent_memory',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'agentId',
            type: 'uuid',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'type',
            type: 'enum',
            enum: ['conversation', 'entity', 'summary', 'vector'],
          },
          {
            name: 'key',
            type: 'varchar',
            length: '255',
          },
          {
            name: 'data',
            type: 'jsonb',
          },
          {
            name: 'expiresAt',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'ai_agent_executions',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedTableName: 'ai_agents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ai_agent_executions_agentId',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_agent_tools',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedTableName: 'ai_agents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ai_agent_tools_agentId',
      }),
    );

    await queryRunner.createForeignKey(
      'ai_agent_memory',
      new TableForeignKey({
        columnNames: ['agentId'],
        referencedTableName: 'ai_agents',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
        name: 'FK_ai_agent_memory_agentId',
      }),
    );

    // Create indexes for better performance
    await queryRunner.createIndex(
      'ai_agent_executions',
      new TableIndex({
        name: 'IDX_ai_agent_executions_agent_id',
        columnNames: ['agentId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_agent_executions',
      new TableIndex({
        name: 'IDX_ai_agent_executions_workflow_execution_id',
        columnNames: ['workflowExecutionId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_agent_executions',
      new TableIndex({
        name: 'IDX_ai_agent_executions_status',
        columnNames: ['status'],
      }),
    );

    await queryRunner.createIndex(
      'ai_agent_tools',
      new TableIndex({
        name: 'IDX_ai_agent_tools_agent_id',
        columnNames: ['agentId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_agent_memory',
      new TableIndex({
        name: 'IDX_ai_agent_memory_agent_session',
        columnNames: ['agentId', 'sessionId'],
      }),
    );

    await queryRunner.createIndex(
      'ai_agent_memory',
      new TableIndex({
        name: 'IDX_ai_agent_memory_expires_at',
        columnNames: ['expiresAt'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys first
    await queryRunner.dropForeignKey(
      'ai_agent_executions',
      'FK_ai_agent_executions_agentId',
    );
    await queryRunner.dropForeignKey(
      'ai_agent_tools',
      'FK_ai_agent_tools_agentId',
    );
    await queryRunner.dropForeignKey(
      'ai_agent_memory',
      'FK_ai_agent_memory_agentId',
    );

    // Drop tables
    await queryRunner.dropTable('ai_agent_memory');
    await queryRunner.dropTable('ai_agent_tools');
    await queryRunner.dropTable('ai_agent_executions');
    await queryRunner.dropTable('ai_agents');
  }
}
