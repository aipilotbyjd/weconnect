import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import { MongoClient, Db, ObjectId } from 'mongodb';

export const MongoDBNodeDefinition = new NodeDefinition({
  name: 'MongoDB',
  displayName: 'MongoDB',
  description: 'Read and write data from MongoDB database',
  version: 1,
  group: ['database'],
  icon: 'fa:database',
  defaults: {
    name: 'MongoDB',
    color: '#47A248',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'mongoDb',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Find Documents', value: 'find' },
        { name: 'Find One Document', value: 'findOne' },
        { name: 'Insert One', value: 'insertOne' },
        { name: 'Insert Many', value: 'insertMany' },
        { name: 'Update One', value: 'updateOne' },
        { name: 'Update Many', value: 'updateMany' },
        { name: 'Delete One', value: 'deleteOne' },
        { name: 'Delete Many', value: 'deleteMany' },
      ],
      default: 'find',
      required: true,
    },
    {
      name: 'database',
      displayName: 'Database',
      type: 'string',
      default: '',
      required: true,
      description: 'The name of the database',
    },
    {
      name: 'collection',
      displayName: 'Collection',
      type: 'string',
      default: '',
      required: true,
      description: 'The name of the collection',
    },
    {
      name: 'filter',
      displayName: 'Filter',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: [
            'find',
            'findOne',
            'updateOne',
            'updateMany',
            'deleteOne',
            'deleteMany',
          ],
        },
      },
      description: 'Filter conditions as JSON object',
    },
    {
      name: 'dataToInsert',
      displayName: 'Data to Insert',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['insertOne', 'insertMany'],
        },
      },
      description: 'The data to insert',
    },
    {
      name: 'dataToUpdate',
      displayName: 'Data to Update',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['updateOne', 'updateMany'],
        },
      },
      description: 'The data to update',
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 10,
      displayOptions: {
        show: {
          operation: ['find'],
        },
      },
      description: 'Maximum number of documents to return',
    },
  ],
});

export class MongoDBNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.mongoDb;

    if (!credentials) {
      return {
        success: false,
        error: 'MongoDB credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      const connectionString = credentials.connectionString;
      const database = context.parameters.database;
      const collection = context.parameters.collection;
      const operation = context.parameters.operation;

      if (!connectionString) {
        throw new Error('MongoDB connection string is required');
      }

      if (!database) {
        throw new Error('Database name is required');
      }

      const client = new MongoClient(connectionString);
      await client.connect();

      const db = client.db(database);
      let result: any;

      try {
        const filter = this.parseFilter(context.parameters.filter);
        const dataToUpdate = JSON.parse(
          context.parameters.dataToUpdate || '{}',
        );

        switch (operation) {
          case 'find':
            result = await db
              .collection(collection)
              .find(filter)
              .limit(parseInt(context.parameters.limit || '0'))
              .toArray();
            break;
          case 'findOne':
            result = await db.collection(collection).findOne(filter);
            break;
          case 'insertOne':
            result = await db
              .collection(collection)
              .insertOne({ ...dataToUpdate });
            break;
          case 'insertMany':
            const documents = Array.isArray(dataToUpdate)
              ? dataToUpdate
              : [dataToUpdate];
            result = await db.collection(collection).insertMany(documents);
            break;
          case 'updateOne':
            result = await db
              .collection(collection)
              .updateOne(filter, { $set: dataToUpdate });
            break;
          case 'updateMany':
            result = await db
              .collection(collection)
              .updateMany(filter, { $set: dataToUpdate });
            break;
          case 'deleteOne':
            result = await db.collection(collection).deleteOne(filter);
            break;
          case 'deleteMany':
            result = await db.collection(collection).deleteMany(filter);
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
            collection,
            database,
          },
        };
      } finally {
        await client.close();
      }
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

  private parseFilter(filter: string): any {
    if (!filter) return {};

    try {
      const query = JSON.parse(filter);
      // Convert _id to ObjectId for MongoDB
      if (query._id) {
        query._id = new ObjectId(query._id);
      }
      return query;
    } catch (error) {
      return {};
    }
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
