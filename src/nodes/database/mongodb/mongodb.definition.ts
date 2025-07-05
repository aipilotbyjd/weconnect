import { NodeDefinition } from '../../interfaces/node-definition.interface';

export const mongodbDefinition: NodeDefinition = {
  name: 'MongoDB',
  category: 'Database',
  description: 'Perform MongoDB database operations including CRUD, aggregation, and index management',
  version: '1.0.0',
  icon: 'database',
  color: '#47A248',
  inputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Input',
      description: 'Input data for the MongoDB operation'
    }
  ],
  outputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Result',
      description: 'MongoDB operation result'
    }
  ],
  credentials: [
    {
      name: 'mongodbCredentials',
      displayName: 'MongoDB Credentials',
      properties: {
        connectionString: {
          type: 'string',
          displayName: 'Connection String',
          description: 'MongoDB connection string (mongodb://user:password@host:port/database)',
          required: true,
          default: 'mongodb://localhost:27017'
        }
      }
    }
  ],
  properties: [
    {
      name: 'operation',
      type: 'select',
      displayName: 'Operation',
      description: 'MongoDB operation to perform',
      required: true,
      default: 'find',
      options: [
        { value: 'find', label: 'Find Documents' },
        { value: 'findOne', label: 'Find One Document' },
        { value: 'insertOne', label: 'Insert One Document' },
        { value: 'insertMany', label: 'Insert Many Documents' },
        { value: 'updateOne', label: 'Update One Document' },
        { value: 'updateMany', label: 'Update Many Documents' },
        { value: 'deleteOne', label: 'Delete One Document' },
        { value: 'deleteMany', label: 'Delete Many Documents' },
        { value: 'aggregate', label: 'Aggregate' },
        { value: 'countDocuments', label: 'Count Documents' },
        { value: 'distinct', label: 'Distinct Values' },
        { value: 'createIndex', label: 'Create Index' },
        { value: 'dropIndex', label: 'Drop Index' },
        { value: 'listCollections', label: 'List Collections' }
      ]
    },
    {
      name: 'database',
      type: 'string',
      displayName: 'Database',
      description: 'Database name',
      required: true,
      default: ''
    },
    {
      name: 'collection',
      type: 'string',
      displayName: 'Collection',
      description: 'Collection name (not required for listCollections)',
      required: false,
      default: '',
      displayOptions: {
        hide: {
          operation: ['listCollections']
        }
      }
    },
    {
      name: 'filter',
      type: 'json',
      displayName: 'Filter',
      description: 'MongoDB filter query (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: [
            'find',
            'findOne',
            'updateOne',
            'updateMany',
            'deleteOne',
            'deleteMany',
            'countDocuments',
            'distinct'
          ]
        }
      }
    },
    {
      name: 'document',
      type: 'json',
      displayName: 'Document',
      description: 'Document to insert (JSON format)',
      required: true,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['insertOne']
        }
      }
    },
    {
      name: 'documents',
      type: 'json',
      displayName: 'Documents',
      description: 'Array of documents to insert (JSON format)',
      required: true,
      default: '[{}]',
      displayOptions: {
        show: {
          operation: ['insertMany']
        }
      }
    },
    {
      name: 'update',
      type: 'json',
      displayName: 'Update',
      description: 'Update operation (JSON format)',
      required: true,
      default: '{"$set": {}}',
      displayOptions: {
        show: {
          operation: ['updateOne', 'updateMany']
        }
      }
    },
    {
      name: 'pipeline',
      type: 'json',
      displayName: 'Aggregation Pipeline',
      description: 'MongoDB aggregation pipeline (JSON array)',
      required: true,
      default: '[{"$match": {}}]',
      displayOptions: {
        show: {
          operation: ['aggregate']
        }
      }
    },
    {
      name: 'field',
      type: 'string',
      displayName: 'Field',
      description: 'Field name for distinct operation',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['distinct']
        }
      }
    },
    {
      name: 'indexSpec',
      type: 'json',
      displayName: 'Index Specification',
      description: 'Index specification (JSON format)',
      required: true,
      default: '{"field": 1}',
      displayOptions: {
        show: {
          operation: ['createIndex']
        }
      }
    },
    {
      name: 'indexName',
      type: 'string',
      displayName: 'Index Name',
      description: 'Name of the index to drop',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['dropIndex']
        }
      }
    },
    {
      name: 'limit',
      type: 'number',
      displayName: 'Limit',
      description: 'Maximum number of documents to return',
      required: false,
      default: 0,
      displayOptions: {
        show: {
          operation: ['find']
        }
      }
    },
    {
      name: 'skip',
      type: 'number',
      displayName: 'Skip',
      description: 'Number of documents to skip',
      required: false,
      default: 0,
      displayOptions: {
        show: {
          operation: ['find']
        }
      }
    },
    {
      name: 'sort',
      type: 'json',
      displayName: 'Sort',
      description: 'Sort specification (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: ['find']
        }
      }
    },
    {
      name: 'options',
      type: 'json',
      displayName: 'Options',
      description: 'Additional options for the operation (JSON format)',
      required: false,
      default: '{}',
      displayOptions: {
        show: {
          operation: [
            'find',
            'findOne',
            'updateOne',
            'updateMany',
            'createIndex'
          ]
        }
      }
    }
  ]
};
