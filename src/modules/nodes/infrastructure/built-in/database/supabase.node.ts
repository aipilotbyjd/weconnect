import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const SupabaseNodeDefinition = new NodeDefinition({
  name: 'Supabase',
  displayName: 'Supabase',
  description: 'Interact with Supabase PostgreSQL-based serverless database',
  version: 1,
  group: ['database', 'cloud'],
  icon: 'simple-icons:supabase',
  defaults: {
    name: 'Supabase',
    color: '#3ECF8E',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'supabase',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Select', value: 'select' },
        { name: 'Insert', value: 'insert' },
        { name: 'Update', value: 'update' },
        { name: 'Delete', value: 'delete' },
        { name: 'Upsert', value: 'upsert' },
        { name: 'RPC Function', value: 'rpc' },
        { name: 'Execute SQL', value: 'sql' },
      ],
      default: 'select',
      required: true,
    },
    {
      name: 'table',
      displayName: 'Table',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['select', 'insert', 'update', 'delete', 'upsert'],
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
      description: 'Comma-separated list of columns to select',
    },
    {
      name: 'filters',
      displayName: 'Filters',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['select', 'update', 'delete'],
        },
      },
      description: 'Filter conditions as key-value pairs',
    },
    {
      name: 'data',
      displayName: 'Data',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'upsert'],
        },
      },
      description: 'Data to insert/update as key-value pairs',
    },
    {
      name: 'orderBy',
      displayName: 'Order By',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
      description:
        'Column to order by (e.g., "created_at" or "created_at.desc")',
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
      description: 'Maximum number of rows to return',
    },
    {
      name: 'range',
      displayName: 'Range',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['select'],
        },
      },
      description: 'Range for pagination (e.g., "0,9" for first 10 items)',
    },
    {
      name: 'functionName',
      displayName: 'Function Name',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['rpc'],
        },
      },
      required: true,
      description: 'Name of the RPC function to call',
    },
    {
      name: 'functionParams',
      displayName: 'Function Parameters',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['rpc'],
        },
      },
      description: 'Parameters to pass to the RPC function',
    },
    {
      name: 'sql',
      displayName: 'SQL Query',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['sql'],
        },
      },
      required: true,
      description: 'Raw SQL query to execute',
    },
    {
      name: 'returnData',
      displayName: 'Return Data',
      type: 'boolean',
      default: true,
      displayOptions: {
        show: {
          operation: ['insert', 'update', 'delete', 'upsert'],
        },
      },
      description: 'Whether to return the affected data',
    },
  ],
});

export class SupabaseNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.supabase;

    if (!credentials) {
      return {
        success: false,
        error: 'Supabase credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      const supabase: SupabaseClient = createClient(
        credentials.url,
        credentials.anonKey,
      );

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'select':
          result = await this.executeSelect(supabase, context);
          break;
        case 'insert':
          result = await this.executeInsert(supabase, context);
          break;
        case 'update':
          result = await this.executeUpdate(supabase, context);
          break;
        case 'delete':
          result = await this.executeDelete(supabase, context);
          break;
        case 'upsert':
          result = await this.executeUpsert(supabase, context);
          break;
        case 'rpc':
          result = await this.executeRPC(supabase, context);
          break;
        case 'sql':
          result = await this.executeSQL(supabase, context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result.data || result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          table: context.parameters.table,
          count: result.count,
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
    }
  }

  private async executeSelect(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { table, columns, filters, orderBy, limit, range } =
      context.parameters;

    let query = supabase.from(table).select(columns || '*') as any;

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    // Apply ordering
    if (orderBy) {
      const [column, direction] = orderBy.split('.');
      query = query.order(column, { ascending: direction !== 'desc' });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    // Apply range for pagination
    if (range) {
      const [from, to] = range.split(',').map(Number);
      query = query.range(from, to);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return { data, count };
  }

  private async executeInsert(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { table, data, returnData } = context.parameters;

    let query = supabase.from(table).insert(data) as any;

    if (returnData) {
      query = query.select();
    }

    const { data: result, error } = await query;

    if (error) throw error;

    return { data: result };
  }

  private async executeUpdate(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { table, data, filters, returnData } = context.parameters;

    let query = supabase.from(table).update(data) as any;

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (returnData) {
      query = query.select();
    }

    const { data: result, error } = await query;

    if (error) throw error;

    return { data: result };
  }

  private async executeDelete(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { table, filters, returnData } = context.parameters;

    let query = supabase.from(table).delete() as any;

    // Apply filters
    if (filters && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }

    if (returnData) {
      query = query.select();
    }

    const { data: result, error } = await query;

    if (error) throw error;

    return { data: result };
  }

  private async executeUpsert(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { table, data, returnData } = context.parameters;

    let query = supabase.from(table).upsert(data) as any;

    if (returnData) {
      query = query.select();
    }

    const { data: result, error } = await query;

    if (error) throw error;

    return { data: result };
  }

  private async executeRPC(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { functionName, functionParams } = context.parameters;

    const { data, error } = await supabase.rpc(
      functionName,
      functionParams || {},
    );

    if (error) throw error;

    return { data };
  }

  private async executeSQL(
    supabase: SupabaseClient,
    context: NodeExecutionContext,
  ): Promise<any> {
    const { sql } = context.parameters;

    const { data, error } = await supabase.from('').select(sql);

    if (error) throw error;

    return { data };
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
