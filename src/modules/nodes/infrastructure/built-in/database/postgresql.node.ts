import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import { Pool } from 'pg';

export const PostgreSQLNodeDefinition = new NodeDefinition({
  name: 'PostgreSQL',
  displayName: 'PostgreSQL',
  description: 'Read and write data from PostgreSQL database',
  version: 1,
  group: ['database'],
  icon: 'fa:database',
  defaults: {
    name: 'PostgreSQL',
    color: '#336791',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'postgresDb',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Execute Query', value: 'executeQuery' },
        { name: 'Insert', value: 'insert' },
        { name: 'Update', value: 'update' },
        { name: 'Delete', value: 'delete' },
        { name: 'Select', value: 'select' },
      ],
      default: 'select',
      required: true,
    },
    {
      name: 'query',
      displayName: 'Query',
      type: 'string',
      default: '',
      placeholder: 'SELECT * FROM users WHERE id = $1',
      displayOptions: {
        show: {
          operation: ['executeQuery'],
        },
      },
      description:
        'The SQL query to execute. You can use $1, $2, etc. for parameters.',
    },
    {
      name: 'queryParameters',
      displayName: 'Query Parameters',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['executeQuery'],
        },
      },
      description: 'Parameters to use in the query',
    },
    {
      name: 'table',
      displayName: 'Table',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'delete', 'select'],
        },
      },
      required: true,
      description: 'The name of the table',
    },
    {
      name: 'columns',
      displayName: 'Columns',
      type: 'string',
      default: '*',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
      description: 'Comma-separated list of columns to return',
    },
    {
      name: 'where',
      displayName: 'Where Clause',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['select', 'update', 'delete'],
        },
      },
      description: 'Where conditions as key-value pairs',
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 10,
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
      description: 'Maximum number of rows to return',
    },
    {
      name: 'dataToInsert',
      displayName: 'Data to Insert',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['insert'],
        },
      },
      description: 'The data to insert as key-value pairs',
    },
    {
      name: 'dataToUpdate',
      displayName: 'Data to Update',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['update'],
        },
      },
      description: 'The data to update as key-value pairs',
    },
    {
      name: 'returnFields',
      displayName: 'Return Fields',
      type: 'string',
      default: '*',
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'delete'],
        },
      },
      description: 'Fields to return after the operation',
    },
  ],
});

export class PostgreSQLNodeExecutor implements INodeExecutor {
  private pool: Pool | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.postgresDb;

    if (!credentials) {
      return {
        success: false,
        error: 'PostgreSQL credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Create connection pool
      this.pool = new Pool({
        host: credentials.host,
        port: credentials.port || 5432,
        database: credentials.database,
        user: credentials.user,
        password: credentials.password,
        ssl: credentials.ssl ? { rejectUnauthorized: false } : false,
      });

      const { operation } = context.parameters;
      let results: any[] = [];

      switch (operation) {
        case 'executeQuery':
          results = await this.executeQuery(context);
          break;
        case 'select':
          results = await this.executeSelect(context);
          break;
        case 'insert':
          results = await this.executeInsert(context);
          break;
        case 'update':
          results = await this.executeUpdate(context);
          break;
        case 'delete':
          results = await this.executeDelete(context);
          break;
      }

      return {
        success: true,
        data: results,
        metadata: {
          executionTime: Date.now() - startTime,
          itemsProcessed: results.length,
          operation,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    } finally {
      // Close connection pool
      if (this.pool) {
        await this.pool.end();
        this.pool = null;
      }
    }
  }

  private async executeQuery(context: NodeExecutionContext): Promise<any[]> {
    const { query, queryParameters } = context.parameters;
    const result = await this.pool!.query(query, queryParameters || []);
    return result.rows;
  }

  private async executeSelect(context: NodeExecutionContext): Promise<any[]> {
    const { table, columns, where, limit } = context.parameters;

    let query = `SELECT ${columns || '*'} FROM ${table}`;
    const params: any[] = [];

    // Build WHERE clause
    if (where && Object.keys(where).length > 0) {
      const conditions = Object.entries(where).map(([key, value], index) => {
        params.push(value);
        return `${key} = $${index + 1}`;
      });
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Add LIMIT
    if (limit) {
      query += ` LIMIT ${limit}`;
    }

    const result = await this.pool!.query(query, params);
    return result.rows;
  }

  private async executeInsert(context: NodeExecutionContext): Promise<any[]> {
    const { table, dataToInsert, returnFields } = context.parameters;
    const inputData =
      context.inputData.length > 0 ? context.inputData : [dataToInsert];
    const results: any[] = [];

    for (const item of inputData) {
      const data = item.dataToInsert || item;
      const keys = Object.keys(data);
      const values = Object.values(data);

      const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
      const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) RETURNING ${returnFields || '*'}`;

      const result = await this.pool!.query(query, values);
      results.push(...result.rows);
    }

    return results;
  }

  private async executeUpdate(context: NodeExecutionContext): Promise<any[]> {
    const { table, dataToUpdate, where, returnFields } = context.parameters;

    const setKeys = Object.keys(dataToUpdate);
    const setValues = Object.values(dataToUpdate);
    const whereKeys = Object.keys(where || {});
    const whereValues = Object.values(where || {});

    const setClause = setKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(', ');
    const whereClause = whereKeys
      .map((key, index) => `${key} = $${setKeys.length + index + 1}`)
      .join(' AND ');

    let query = `UPDATE ${table} SET ${setClause}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    query += ` RETURNING ${returnFields || '*'}`;

    const result = await this.pool!.query(query, [
      ...setValues,
      ...whereValues,
    ]);
    return result.rows;
  }

  private async executeDelete(context: NodeExecutionContext): Promise<any[]> {
    const { table, where, returnFields } = context.parameters;

    const whereKeys = Object.keys(where || {});
    const whereValues = Object.values(where || {});

    const whereClause = whereKeys
      .map((key, index) => `${key} = $${index + 1}`)
      .join(' AND ');

    let query = `DELETE FROM ${table}`;
    if (whereClause) {
      query += ` WHERE ${whereClause}`;
    }
    query += ` RETURNING ${returnFields || '*'}`;

    const result = await this.pool!.query(query, whereValues);
    return result.rows;
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
