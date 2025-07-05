import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import axios, { AxiosInstance } from 'axios';

export const SalesforceNodeDefinition = new NodeDefinition({
  name: 'Salesforce',
  displayName: 'Salesforce',
  description: 'Interact with Salesforce CRM for managing leads, contacts, accounts, and opportunities',
  version: 1,
  group: ['integrations', 'crm'],
  icon: 'simple-icons:salesforce',
  defaults: {
    name: 'Salesforce',
    color: '#00A1E0',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'salesforce',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Record', value: 'create' },
        { name: 'Update Record', value: 'update' },
        { name: 'Get Record', value: 'get' },
        { name: 'Delete Record', value: 'delete' },
        { name: 'Query Records', value: 'query' },
        { name: 'Search Records', value: 'search' },
        { name: 'Get Metadata', value: 'metadata' },
        { name: 'Upsert Record', value: 'upsert' },
        { name: 'Bulk Create', value: 'bulkCreate' },
        { name: 'Bulk Update', value: 'bulkUpdate' },
      ],
      default: 'query',
      required: true,
    },
    {
      name: 'sobjectType',
      displayName: 'SObject Type',
      type: 'options',
      options: [
        { name: 'Account', value: 'Account' },
        { name: 'Contact', value: 'Contact' },
        { name: 'Lead', value: 'Lead' },
        { name: 'Opportunity', value: 'Opportunity' },
        { name: 'Case', value: 'Case' },
        { name: 'Task', value: 'Task' },
        { name: 'Event', value: 'Event' },
        { name: 'Campaign', value: 'Campaign' },
        { name: 'Product2', value: 'Product2' },
        { name: 'User', value: 'User' },
        { name: 'Custom', value: 'custom' },
      ],
      default: 'Account',
      displayOptions: {
        show: {
          operation: ['create', 'update', 'get', 'delete', 'query', 'search', 'metadata', 'upsert', 'bulkCreate', 'bulkUpdate'],
        },
      },
      required: true,
    },
    {
      name: 'customSObjectType',
      displayName: 'Custom SObject Type',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          sobjectType: ['custom'],
        },
      },
      required: true,
      description: 'Name of the custom SObject (e.g., Custom_Object__c)',
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
      required: true,
      description: 'The ID of the record to operate on',
    },
    {
      name: 'fields',
      displayName: 'Fields',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['create', 'update', 'upsert'],
        },
      },
      description: 'Fields to create/update as key-value pairs',
    },
    {
      name: 'externalIdField',
      displayName: 'External ID Field',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['upsert'],
        },
      },
      required: true,
      description: 'The external ID field name for upsert operation',
    },
    {
      name: 'externalId',
      displayName: 'External ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['upsert'],
        },
      },
      required: true,
      description: 'The external ID value for upsert operation',
    },
    {
      name: 'soqlQuery',
      displayName: 'SOQL Query',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['query'],
        },
      },
      required: true,
      description: 'SOQL query to execute (e.g., SELECT Id, Name FROM Account LIMIT 10)',
    },
    {
      name: 'searchQuery',
      displayName: 'Search Query',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['search'],
        },
      },
      required: true,
      description: 'SOSL search query (e.g., FIND {John} IN NAME FIELDS)',
    },
    {
      name: 'fieldsToSelect',
      displayName: 'Fields to Select',
      type: 'string',
      default: '*',
      displayOptions: {
        show: {
          operation: ['get'],
        },
      },
      description: 'Comma-separated list of fields to retrieve (default: all fields)',
    },
    {
      name: 'bulkData',
      displayName: 'Bulk Data',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['bulkCreate', 'bulkUpdate'],
        },
      },
      description: 'Array of records for bulk operations (max 200 per request)',
    },
    {
      name: 'allOrNone',
      displayName: 'All or None',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['bulkCreate', 'bulkUpdate'],
        },
      },
      description: 'If true, entire operation rolls back on any failure',
    },
  ],
});

export class SalesforceNodeExecutor implements INodeExecutor {
  private client: AxiosInstance | null = null;
  private accessToken: string = '';
  private instanceUrl: string = '';

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.salesforce;
    
    if (!credentials) {
      return {
        success: false,
        error: 'Salesforce credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Authenticate and get access token
      await this.authenticate(credentials);

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'create':
          result = await this.createRecord(context);
          break;
        case 'update':
          result = await this.updateRecord(context);
          break;
        case 'get':
          result = await this.getRecord(context);
          break;
        case 'delete':
          result = await this.deleteRecord(context);
          break;
        case 'query':
          result = await this.queryRecords(context);
          break;
        case 'search':
          result = await this.searchRecords(context);
          break;
        case 'metadata':
          result = await this.getMetadata(context);
          break;
        case 'upsert':
          result = await this.upsertRecord(context);
          break;
        case 'bulkCreate':
          result = await this.bulkCreateRecords(context);
          break;
        case 'bulkUpdate':
          result = await this.bulkUpdateRecords(context);
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
          sobjectType: this.getSObjectType(context),
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

  private async authenticate(credentials: any): Promise<void> {
    const authUrl = credentials.isSandbox 
      ? 'https://test.salesforce.com/services/oauth2/token'
      : 'https://login.salesforce.com/services/oauth2/token';

    const authData = new URLSearchParams({
      grant_type: 'password',
      client_id: credentials.consumerKey,
      client_secret: credentials.consumerSecret,
      username: credentials.username,
      password: credentials.password + (credentials.securityToken || ''),
    });

    const response = await axios.post(authUrl, authData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    this.accessToken = response.data.access_token;
    this.instanceUrl = response.data.instance_url;

    this.client = axios.create({
      baseURL: `${this.instanceUrl}/services/data/v57.0`,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  private getSObjectType(context: NodeExecutionContext): string {
    const { sobjectType, customSObjectType } = context.parameters;
    return sobjectType === 'custom' ? customSObjectType : sobjectType;
  }

  private async createRecord(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { fields } = context.parameters;

    const response = await this.client!.post(`/sobjects/${sobjectType}`, fields);
    
    return {
      id: response.data.id,
      success: response.data.success,
      created: true,
    };
  }

  private async updateRecord(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { recordId, fields } = context.parameters;

    await this.client!.patch(`/sobjects/${sobjectType}/${recordId}`, fields);
    
    return {
      id: recordId,
      success: true,
      updated: true,
    };
  }

  private async getRecord(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { recordId, fieldsToSelect } = context.parameters;

    let url = `/sobjects/${sobjectType}/${recordId}`;
    if (fieldsToSelect && fieldsToSelect !== '*') {
      url += `?fields=${fieldsToSelect}`;
    }

    const response = await this.client!.get(url);
    return response.data;
  }

  private async deleteRecord(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { recordId } = context.parameters;

    await this.client!.delete(`/sobjects/${sobjectType}/${recordId}`);
    
    return {
      id: recordId,
      success: true,
      deleted: true,
    };
  }

  private async queryRecords(context: NodeExecutionContext): Promise<any> {
    const { soqlQuery } = context.parameters;

    const response = await this.client!.get(`/query`, {
      params: { q: soqlQuery },
    });

    return {
      totalSize: response.data.totalSize,
      done: response.data.done,
      records: response.data.records,
      nextRecordsUrl: response.data.nextRecordsUrl,
    };
  }

  private async searchRecords(context: NodeExecutionContext): Promise<any> {
    const { searchQuery } = context.parameters;

    const response = await this.client!.get(`/search`, {
      params: { q: searchQuery },
    });

    return {
      searchRecords: response.data.searchRecords,
    };
  }

  private async getMetadata(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);

    const response = await this.client!.get(`/sobjects/${sobjectType}/describe`);
    
    return {
      name: response.data.name,
      label: response.data.label,
      fields: response.data.fields,
      recordTypeInfos: response.data.recordTypeInfos,
      childRelationships: response.data.childRelationships,
    };
  }

  private async upsertRecord(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { externalIdField, externalId, fields } = context.parameters;

    const response = await this.client!.patch(
      `/sobjects/${sobjectType}/${externalIdField}/${externalId}`,
      fields
    );

    return {
      id: response.data.id,
      success: response.data.success,
      created: response.data.created,
    };
  }

  private async bulkCreateRecords(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { bulkData, allOrNone } = context.parameters;

    if (bulkData.length > 200) {
      throw new Error('Bulk operations are limited to 200 records per request');
    }

    const requestBody = {
      allOrNone: allOrNone || false,
      records: bulkData,
    };

    const response = await this.client!.post(`/composite/sobjects/${sobjectType}`, requestBody);

    return {
      hasErrors: response.data.hasErrors,
      results: response.data.results,
    };
  }

  private async bulkUpdateRecords(context: NodeExecutionContext): Promise<any> {
    const sobjectType = this.getSObjectType(context);
    const { bulkData, allOrNone } = context.parameters;

    if (bulkData.length > 200) {
      throw new Error('Bulk operations are limited to 200 records per request');
    }

    // Ensure all records have IDs for update
    const invalidRecords = bulkData.filter((record: any) => !record.Id);
    if (invalidRecords.length > 0) {
      throw new Error('All records must have an Id field for bulk update');
    }

    const requestBody = {
      allOrNone: allOrNone || false,
      records: bulkData,
    };

    const response = await this.client!.patch(`/composite/sobjects/${sobjectType}`, requestBody);

    return {
      hasErrors: response.data.hasErrors,
      results: response.data.results,
    };
  }
}
