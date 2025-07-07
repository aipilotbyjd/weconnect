import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';
import Airtable from 'airtable';

export const AirtableNodeDefinition = new NodeDefinition({
  name: 'Airtable',
  displayName: 'Airtable',
  description: 'Interact with Airtable spreadsheet-database hybrid',
  version: 1,
  group: ['database', 'cloud'],
  icon: 'simple-icons:airtable',
  defaults: {
    name: 'Airtable',
    color: '#18BFFF',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'airtable',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'List Records', value: 'list' },
        { name: 'Get Record', value: 'get' },
        { name: 'Create Record', value: 'create' },
        { name: 'Update Record', value: 'update' },
        { name: 'Delete Record', value: 'delete' },
        { name: 'Find Records', value: 'find' },
        { name: 'Batch Create', value: 'batchCreate' },
        { name: 'Batch Update', value: 'batchUpdate' },
        { name: 'Batch Delete', value: 'batchDelete' },
      ],
      default: 'list',
      required: true,
    },
    {
      name: 'baseId',
      displayName: 'Base ID',
      type: 'string',
      default: '',
      required: true,
      description: 'The ID of the Airtable base',
    },
    {
      name: 'tableName',
      displayName: 'Table Name',
      type: 'string',
      default: '',
      required: true,
      description: 'The name of the table',
    },
    {
      name: 'recordId',
      displayName: 'Record ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['get', 'update', 'delete'],
        },
      },
      description: 'The ID of the record',
    },
    {
      name: 'fields',
      displayName: 'Fields',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['create', 'update'],
        },
      },
      description: 'The fields to create/update as key-value pairs',
    },
    {
      name: 'batchData',
      displayName: 'Batch Data',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['batchCreate', 'batchUpdate'],
        },
      },
      description: 'Array of records for batch operations',
    },
    {
      name: 'recordIds',
      displayName: 'Record IDs',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['batchDelete'],
        },
      },
      description: 'Array of record IDs to delete',
    },
    {
      name: 'maxRecords',
      displayName: 'Max Records',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['list', 'find'],
        },
      },
      description: 'Maximum number of records to return',
    },
    {
      name: 'view',
      displayName: 'View',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['list', 'find'],
        },
      },
      description: 'The name or ID of a view to use',
    },
    {
      name: 'sort',
      displayName: 'Sort',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['list', 'find'],
        },
      },
      description: 'Array of sort objects: [{"field": "Name", "direction": "asc"}]',
    },
    {
      name: 'filterByFormula',
      displayName: 'Filter Formula',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['list', 'find'],
        },
      },
      description: 'Airtable formula to filter records',
    },
    {
      name: 'fieldsToReturn',
      displayName: 'Fields to Return',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['list', 'find', 'get'],
        },
      },
      description: 'Array of field names to return (empty = all fields)',
    },
    {
      name: 'cellFormat',
      displayName: 'Cell Format',
      type: 'options',
      options: [
        { name: 'JSON', value: 'json' },
        { name: 'String', value: 'string' },
      ],
      default: 'json',
      displayOptions: {
        show: {
          operation: ['list', 'find', 'get'],
        },
      },
      description: 'How to format cell values',
    },
    {
      name: 'timeZone',
      displayName: 'Time Zone',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['list', 'find', 'get'],
        },
      },
      description: 'Time zone for date fields (e.g., "America/New_York")',
    },
    {
      name: 'userLocale',
      displayName: 'User Locale',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['list', 'find', 'get'],
        },
      },
      description: 'User locale for formatting (e.g., "en-us")',
    },
  ],
});

export class AirtableNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.airtable;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Airtable credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Configure Airtable
      Airtable.configure({
        apiKey: credentials.apiKey,
      });

      const { baseId, tableName, operation } = context.parameters;
      const base = Airtable.base(baseId);
      const table = base(tableName);

      let result: any;

      switch (operation) {
        case 'list':
          result = await this.listRecords(table, context);
          break;
        case 'get':
          result = await this.getRecord(table, context);
          break;
        case 'create':
          result = await this.createRecord(table, context);
          break;
        case 'update':
          result = await this.updateRecord(table, context);
          break;
        case 'delete':
          result = await this.deleteRecord(table, context);
          break;
        case 'find':
          result = await this.findRecords(table, context);
          break;
        case 'batchCreate':
          result = await this.batchCreateRecords(table, context);
          break;
        case 'batchUpdate':
          result = await this.batchUpdateRecords(table, context);
          break;
        case 'batchDelete':
          result = await this.batchDeleteRecords(table, context);
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        metadata: {
          executionTime: Date.now() - startTime,
          operation,
          baseId,
          tableName,
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

  private async listRecords(table: any, context: NodeExecutionContext): Promise<any> {
    const { 
      maxRecords, 
      view, 
      sort, 
      filterByFormula, 
      fieldsToReturn, 
      cellFormat, 
      timeZone, 
      userLocale 
    } = context.parameters;

    const options: any = {};

    if (maxRecords) options.maxRecords = maxRecords;
    if (view) options.view = view;
    if (sort && sort.length > 0) options.sort = sort;
    if (filterByFormula) options.filterByFormula = filterByFormula;
    if (fieldsToReturn && fieldsToReturn.length > 0) options.fields = fieldsToReturn;
    if (cellFormat) options.cellFormat = cellFormat;
    if (timeZone) options.timeZone = timeZone;
    if (userLocale) options.userLocale = userLocale;

    const records = await table.select(options).all();

    return {
      records: records.map((record: any) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record._rawJson.createdTime,
      })),
      count: records.length,
    };
  }

  private async getRecord(table: any, context: NodeExecutionContext): Promise<any> {
    const { recordId, fieldsToReturn, cellFormat, timeZone, userLocale } = context.parameters;

    const options: any = {};
    if (fieldsToReturn && fieldsToReturn.length > 0) options.fields = fieldsToReturn;
    if (cellFormat) options.cellFormat = cellFormat;
    if (timeZone) options.timeZone = timeZone;
    if (userLocale) options.userLocale = userLocale;

    const record = await table.find(recordId);

    return {
      id: record.id,
      fields: record.fields,
      createdTime: record._rawJson.createdTime,
    };
  }

  private async createRecord(table: any, context: NodeExecutionContext): Promise<any> {
    const { fields } = context.parameters;

    const record = await table.create(fields);

    return {
      id: record.id,
      fields: record.fields,
      createdTime: record._rawJson.createdTime,
    };
  }

  private async updateRecord(table: any, context: NodeExecutionContext): Promise<any> {
    const { recordId, fields } = context.parameters;

    const record = await table.update(recordId, fields);

    return {
      id: record.id,
      fields: record.fields,
      createdTime: record._rawJson.createdTime,
    };
  }

  private async deleteRecord(table: any, context: NodeExecutionContext): Promise<any> {
    const { recordId } = context.parameters;

    const record = await table.destroy(recordId);

    return {
      id: record.id,
      deleted: true,
    };
  }

  private async findRecords(table: any, context: NodeExecutionContext): Promise<any> {
    const { 
      maxRecords, 
      view, 
      sort, 
      filterByFormula, 
      fieldsToReturn, 
      cellFormat, 
      timeZone, 
      userLocale 
    } = context.parameters;

    const options: any = {};

    if (maxRecords) options.maxRecords = maxRecords;
    if (view) options.view = view;
    if (sort && sort.length > 0) options.sort = sort;
    if (filterByFormula) options.filterByFormula = filterByFormula;
    if (fieldsToReturn && fieldsToReturn.length > 0) options.fields = fieldsToReturn;
    if (cellFormat) options.cellFormat = cellFormat;
    if (timeZone) options.timeZone = timeZone;
    if (userLocale) options.userLocale = userLocale;

    const records = await table.select(options).firstPage();

    return {
      records: records.map((record: any) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record._rawJson.createdTime,
      })),
      count: records.length,
    };
  }

  private async batchCreateRecords(table: any, context: NodeExecutionContext): Promise<any> {
    const { batchData } = context.parameters;

    // Airtable API allows max 10 records per batch
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < batchData.length; i += batchSize) {
      const batch = batchData.slice(i, i + batchSize);
      const batchResults = await table.create(batch);
      results.push(...(batchResults as any[]).map((record: any) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record._rawJson.createdTime,
      })));
    }

    return {
      records: results,
      count: results.length,
    };
  }

  private async batchUpdateRecords(table: any, context: NodeExecutionContext): Promise<any> {
    const { batchData } = context.parameters;

    // Airtable API allows max 10 records per batch
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < batchData.length; i += batchSize) {
      const batch = batchData.slice(i, i + batchSize);
      const batchResults = await table.update(batch);
      results.push(...(batchResults as any[]).map((record: any) => ({
        id: record.id,
        fields: record.fields,
        createdTime: record._rawJson.createdTime,
      })));
    }

    return {
      records: results,
      count: results.length,
    };
  }

  private async batchDeleteRecords(table: any, context: NodeExecutionContext): Promise<any> {
    const { recordIds } = context.parameters;

    // Airtable API allows max 10 records per batch
    const batchSize = 10;
    const results = [];

    for (let i = 0; i < recordIds.length; i += batchSize) {
      const batch = recordIds.slice(i, i + batchSize);
      const batchResults = await table.destroy(batch);
      results.push(...(batchResults as any[]).map((record: any) => ({
        id: record.id,
        deleted: true,
      })));
    }

    return {
      records: results,
      count: results.length,
    };
  }
}
