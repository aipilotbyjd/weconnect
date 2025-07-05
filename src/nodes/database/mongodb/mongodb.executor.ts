import { Injectable, Logger } from '@nestjs/common';
import { NodeExecutor } from '../../interfaces/node-executor.interface';
import { NodeExecutionContext } from '../../interfaces/node-execution-context.interface';
import { MongoClient, Db, Collection, ObjectId } from 'mongodb';

@Injectable()
export class MongoDBExecutor implements NodeExecutor {
  private readonly logger = new Logger(MongoDBExecutor.name);

  async execute(context: NodeExecutionContext): Promise<any> {
    const { parameters, credentials } = context;
    
    try {
      // Get connection details
      const connectionString = credentials?.connectionString || parameters.connectionString;
      const database = parameters.database;
      const collection = parameters.collection;
      const operation = parameters.operation;

      if (!connectionString) {
        throw new Error('MongoDB connection string is required');
      }

      if (!database) {
        throw new Error('Database name is required');
      }

      // Connect to MongoDB
      const client = new MongoClient(connectionString);
      await client.connect();
      
      const db = client.db(database);
      let result: any;

      try {
        switch (operation) {
          case 'find':
            result = await this.findDocuments(db, collection, parameters);
            break;
          case 'findOne':
            result = await this.findOneDocument(db, collection, parameters);
            break;
          case 'insertOne':
            result = await this.insertOneDocument(db, collection, parameters);
            break;
          case 'insertMany':
            result = await this.insertManyDocuments(db, collection, parameters);
            break;
          case 'updateOne':
            result = await this.updateOneDocument(db, collection, parameters);
            break;
          case 'updateMany':
            result = await this.updateManyDocuments(db, collection, parameters);
            break;
          case 'deleteOne':
            result = await this.deleteOneDocument(db, collection, parameters);
            break;
          case 'deleteMany':
            result = await this.deleteManyDocuments(db, collection, parameters);
            break;
          case 'aggregate':
            result = await this.aggregateDocuments(db, collection, parameters);
            break;
          case 'countDocuments':
            result = await this.countDocuments(db, collection, parameters);
            break;
          case 'distinct':
            result = await this.distinctValues(db, collection, parameters);
            break;
          case 'createIndex':
            result = await this.createIndex(db, collection, parameters);
            break;
          case 'dropIndex':
            result = await this.dropIndex(db, collection, parameters);
            break;
          case 'listCollections':
            result = await this.listCollections(db);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
          success: true,
          data: result,
          operation,
          collection,
          database
        };

      } finally {
        await client.close();
      }

    } catch (error) {
      this.logger.error(`MongoDB operation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        operation: parameters.operation
      };
    }
  }

  private async findDocuments(db: Db, collectionName: string, parameters: any): Promise<any[]> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    const options = this.parseOptions(parameters.options);
    
    const cursor = collection.find(filter, options);
    
    if (parameters.limit) cursor.limit(parseInt(parameters.limit));
    if (parameters.skip) cursor.skip(parseInt(parameters.skip));
    if (parameters.sort) cursor.sort(JSON.parse(parameters.sort));
    
    return await cursor.toArray();
  }

  private async findOneDocument(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    const options = this.parseOptions(parameters.options);
    
    return await collection.findOne(filter, options);
  }

  private async insertOneDocument(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const document = JSON.parse(parameters.document);
    
    return await collection.insertOne(document);
  }

  private async insertManyDocuments(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const documents = JSON.parse(parameters.documents);
    
    return await collection.insertMany(documents);
  }

  private async updateOneDocument(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    const update = JSON.parse(parameters.update);
    const options = this.parseOptions(parameters.options);
    
    return await collection.updateOne(filter, update, options);
  }

  private async updateManyDocuments(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    const update = JSON.parse(parameters.update);
    const options = this.parseOptions(parameters.options);
    
    return await collection.updateMany(filter, update, options);
  }

  private async deleteOneDocument(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    
    return await collection.deleteOne(filter);
  }

  private async deleteManyDocuments(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    
    return await collection.deleteMany(filter);
  }

  private async aggregateDocuments(db: Db, collectionName: string, parameters: any): Promise<any[]> {
    const collection = db.collection(collectionName);
    const pipeline = JSON.parse(parameters.pipeline);
    
    return await collection.aggregate(pipeline).toArray();
  }

  private async countDocuments(db: Db, collectionName: string, parameters: any): Promise<number> {
    const collection = db.collection(collectionName);
    const filter = this.parseFilter(parameters.filter);
    
    return await collection.countDocuments(filter);
  }

  private async distinctValues(db: Db, collectionName: string, parameters: any): Promise<any[]> {
    const collection = db.collection(collectionName);
    const field = parameters.field;
    const filter = this.parseFilter(parameters.filter);
    
    return await collection.distinct(field, filter);
  }

  private async createIndex(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const indexSpec = JSON.parse(parameters.indexSpec);
    const options = this.parseOptions(parameters.options);
    
    return await collection.createIndex(indexSpec, options);
  }

  private async dropIndex(db: Db, collectionName: string, parameters: any): Promise<any> {
    const collection = db.collection(collectionName);
    const indexName = parameters.indexName;
    
    return await collection.dropIndex(indexName);
  }

  private async listCollections(db: Db): Promise<any[]> {
    return await db.listCollections().toArray();
  }

  private parseFilter(filter: string): any {
    if (!filter) return {};
    
    try {
      const parsed = JSON.parse(filter);
      // Handle ObjectId references
      return this.convertObjectIds(parsed);
    } catch (error) {
      return {};
    }
  }

  private parseOptions(options: string): any {
    if (!options) return {};
    
    try {
      return JSON.parse(options);
    } catch (error) {
      return {};
    }
  }

  private convertObjectIds(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.convertObjectIds(item));
    }

    const result: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (key === '_id' && typeof value === 'string' && ObjectId.isValid(value)) {
        result[key] = new ObjectId(value);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.convertObjectIds(value);
      } else {
        result[key] = value;
      }
    }
    return result;
  }
}
