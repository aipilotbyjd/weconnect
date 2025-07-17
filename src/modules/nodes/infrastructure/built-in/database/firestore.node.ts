import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';

export const FirestoreNodeDefinition = new NodeDefinition({
  name: 'Firestore',
  displayName: 'Firebase Firestore',
  description: 'Interact with Google Firebase Firestore NoSQL database',
  version: 1,
  group: ['database', 'cloud'],
  icon: 'simple-icons:firebase',
  defaults: {
    name: 'Firestore',
    color: '#FFA000',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'firebase',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Get Document', value: 'getDocument' },
        { name: 'Get Collection', value: 'getCollection' },
        { name: 'Create Document', value: 'createDocument' },
        { name: 'Update Document', value: 'updateDocument' },
        { name: 'Delete Document', value: 'deleteDocument' },
        { name: 'Query Collection', value: 'queryCollection' },
        { name: 'Batch Write', value: 'batchWrite' },
        { name: 'Run Transaction', value: 'runTransaction' },
      ],
      default: 'getDocument',
      required: true,
    },
    {
      name: 'collection',
      displayName: 'Collection',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: [
            'getDocument',
            'getCollection',
            'createDocument',
            'updateDocument',
            'deleteDocument',
            'queryCollection',
          ],
        },
      },
      required: true,
      description: 'The name of the collection',
    },
    {
      name: 'documentId',
      displayName: 'Document ID',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['getDocument', 'updateDocument', 'deleteDocument'],
        },
      },
      description: 'The ID of the document (leave empty for auto-generated ID)',
    },
    {
      name: 'data',
      displayName: 'Data',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['createDocument', 'updateDocument'],
        },
      },
      description: 'The data to store in the document',
    },
    {
      name: 'queryFilters',
      displayName: 'Query Filters',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['queryCollection'],
        },
      },
      description: 'Array of query filters: [["field", "operator", "value"]]',
    },
    {
      name: 'orderBy',
      displayName: 'Order By',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['queryCollection', 'getCollection'],
        },
      },
      description: 'Array of ordering: [["field", "direction"]]',
    },
    {
      name: 'limit',
      displayName: 'Limit',
      type: 'number',
      default: 100,
      displayOptions: {
        show: {
          operation: ['queryCollection', 'getCollection'],
        },
      },
      description: 'Maximum number of documents to return',
    },
    {
      name: 'startAfter',
      displayName: 'Start After',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['queryCollection', 'getCollection'],
        },
      },
      description: 'Document ID to start after for pagination',
    },
    {
      name: 'merge',
      displayName: 'Merge',
      type: 'boolean',
      default: false,
      displayOptions: {
        show: {
          operation: ['updateDocument'],
        },
      },
      description: 'Whether to merge the data with existing document',
    },
    {
      name: 'batchOperations',
      displayName: 'Batch Operations',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['batchWrite'],
        },
      },
      description:
        'Array of batch operations: [{"type": "set|update|delete", "collection": "...", "documentId": "...", "data": {...}}]',
    },
    {
      name: 'transactionOperations',
      displayName: 'Transaction Operations',
      type: 'json',
      default: [],
      displayOptions: {
        show: {
          operation: ['runTransaction'],
        },
      },
      description: 'Array of transaction operations',
    },
  ],
});

export class FirestoreNodeExecutor implements INodeExecutor {
  private firestore: Firestore | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.firebase;

    if (!credentials) {
      return {
        success: false,
        error: 'Firebase credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize Firebase Admin SDK if not already initialized
      if (getApps().length === 0) {
        const serviceAccount = JSON.parse(credentials.serviceAccountKey);
        initializeApp({
          credential: cert(serviceAccount),
          projectId: credentials.projectId,
        });
      }

      this.firestore = getFirestore();

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'getDocument':
          result = await this.getDocument(context);
          break;
        case 'getCollection':
          result = await this.getCollection(context);
          break;
        case 'createDocument':
          result = await this.createDocument(context);
          break;
        case 'updateDocument':
          result = await this.updateDocument(context);
          break;
        case 'deleteDocument':
          result = await this.deleteDocument(context);
          break;
        case 'queryCollection':
          result = await this.queryCollection(context);
          break;
        case 'batchWrite':
          result = await this.batchWrite(context);
          break;
        case 'runTransaction':
          result = await this.runTransaction(context);
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
          collection: context.parameters.collection,
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

  private async getDocument(context: NodeExecutionContext): Promise<any> {
    const { collection, documentId } = context.parameters;

    const docRef = this.firestore!.collection(collection).doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Document not found');
    }

    return {
      id: doc.id,
      data: doc.data(),
      exists: doc.exists,
      createTime: doc.createTime,
      updateTime: doc.updateTime,
    };
  }

  private async getCollection(context: NodeExecutionContext): Promise<any> {
    const { collection, orderBy, limit, startAfter } = context.parameters;

    let query: any = this.firestore!.collection(collection);

    // Apply ordering
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach(([field, direction]: [string, string]) => {
        query = query.orderBy(field, direction as 'asc' | 'desc');
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    // Apply pagination
    if (startAfter) {
      const startAfterDoc = await this.firestore!.collection(collection)
        .doc(startAfter)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();

    return {
      docs: snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        createTime: doc.createTime,
        updateTime: doc.updateTime,
      })),
      size: snapshot.size,
      empty: snapshot.empty,
    };
  }

  private async createDocument(context: NodeExecutionContext): Promise<any> {
    const { collection, documentId, data } = context.parameters;

    let docRef;
    if (documentId) {
      docRef = this.firestore!.collection(collection).doc(documentId);
      await docRef.set(data);
    } else {
      docRef = await this.firestore!.collection(collection).add(data);
    }

    const doc = await docRef.get();

    return {
      id: doc.id,
      data: doc.data(),
      createTime: doc.createTime,
      updateTime: doc.updateTime,
    };
  }

  private async updateDocument(context: NodeExecutionContext): Promise<any> {
    const { collection, documentId, data, merge } = context.parameters;

    const docRef = this.firestore!.collection(collection).doc(documentId);

    if (merge) {
      await docRef.set(data, { merge: true });
    } else {
      await docRef.update(data);
    }

    const doc = await docRef.get();

    return {
      id: doc.id,
      data: doc.data(),
      createTime: doc.createTime,
      updateTime: doc.updateTime,
    };
  }

  private async deleteDocument(context: NodeExecutionContext): Promise<any> {
    const { collection, documentId } = context.parameters;

    const docRef = this.firestore!.collection(collection).doc(documentId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Document not found');
    }

    const docData = {
      id: doc.id,
      data: doc.data(),
      createTime: doc.createTime,
      updateTime: doc.updateTime,
    };

    await docRef.delete();

    return {
      deleted: true,
      document: docData,
    };
  }

  private async queryCollection(context: NodeExecutionContext): Promise<any> {
    const { collection, queryFilters, orderBy, limit, startAfter } =
      context.parameters;

    let query: any = this.firestore!.collection(collection);

    // Apply filters
    if (queryFilters && queryFilters.length > 0) {
      queryFilters.forEach(
        ([field, operator, value]: [string, string, any]) => {
          query = query.where(field, operator as any, value);
        },
      );
    }

    // Apply ordering
    if (orderBy && orderBy.length > 0) {
      orderBy.forEach(([field, direction]: [string, string]) => {
        query = query.orderBy(field, direction as 'asc' | 'desc');
      });
    }

    // Apply limit
    if (limit) {
      query = query.limit(limit);
    }

    // Apply pagination
    if (startAfter) {
      const startAfterDoc = await this.firestore!.collection(collection)
        .doc(startAfter)
        .get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();

    return {
      docs: snapshot.docs.map((doc) => ({
        id: doc.id,
        data: doc.data(),
        createTime: doc.createTime,
        updateTime: doc.updateTime,
      })),
      size: snapshot.size,
      empty: snapshot.empty,
    };
  }

  private async batchWrite(context: NodeExecutionContext): Promise<any> {
    const { batchOperations } = context.parameters;

    const batch = this.firestore!.batch();

    for (const operation of batchOperations) {
      const { type, collection, documentId, data } = operation;
      const docRef = this.firestore!.collection(collection).doc(documentId);

      switch (type) {
        case 'set':
          batch.set(docRef, data);
          break;
        case 'update':
          batch.update(docRef, data);
          break;
        case 'delete':
          batch.delete(docRef);
          break;
        default:
          throw new Error(`Unsupported batch operation: ${type}`);
      }
    }

    await batch.commit();

    return {
      success: true,
      operationsCount: batchOperations.length,
    };
  }

  private async runTransaction(context: NodeExecutionContext): Promise<any> {
    const { transactionOperations } = context.parameters;

    const result = await this.firestore!.runTransaction(async (transaction) => {
      const results: any[] = [];

      for (const operation of transactionOperations) {
        const { type, collection, documentId, data } = operation;
        const docRef = this.firestore!.collection(collection).doc(documentId);

        switch (type) {
          case 'get':
            const doc = await transaction.get(docRef);
            results.push({
              id: doc.id,
              data: doc.data(),
              exists: doc.exists,
            });
            break;
          case 'set':
            transaction.set(docRef, data);
            results.push({ operation: 'set', documentId });
            break;
          case 'update':
            transaction.update(docRef, data);
            results.push({ operation: 'update', documentId });
            break;
          case 'delete':
            transaction.delete(docRef);
            results.push({ operation: 'delete', documentId });
            break;
          default:
            throw new Error(`Unsupported transaction operation: ${type}`);
        }
      }

      return results;
    });

    return {
      success: true,
      results: result,
    };
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
