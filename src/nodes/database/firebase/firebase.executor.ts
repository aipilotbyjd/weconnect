import { Injectable, Logger } from '@nestjs/common';
import { NodeExecutor } from '../../interfaces/node-executor.interface';
import { NodeExecutionContext } from '../../interfaces/node-execution-context.interface';

@Injectable()
export class FirebaseExecutor implements NodeExecutor {
  private readonly logger = new Logger(FirebaseExecutor.name);

  async execute(context: NodeExecutionContext): Promise<any> {
    const { parameters, credentials } = context;
    
    try {
      // Import Firebase SDK dynamically
      const { initializeApp, getApps } = await import('firebase/app');
      const { getFirestore, collection, doc, addDoc, setDoc, updateDoc, deleteDoc, getDoc, getDocs, query, where, orderBy, limit, startAfter } = await import('firebase/firestore');
      
      // Get Firebase config
      const firebaseConfig = {
        apiKey: credentials?.apiKey || parameters.apiKey,
        authDomain: credentials?.authDomain || parameters.authDomain,
        projectId: credentials?.projectId || parameters.projectId,
        storageBucket: credentials?.storageBucket || parameters.storageBucket,
        messagingSenderId: credentials?.messagingSenderId || parameters.messagingSenderId,
        appId: credentials?.appId || parameters.appId,
        measurementId: credentials?.measurementId || parameters.measurementId
      };

      if (!firebaseConfig.projectId) {
        throw new Error('Firebase project ID is required');
      }

      // Initialize Firebase app
      let app;
      const existingApps = getApps();
      if (existingApps.length > 0) {
        app = existingApps[0];
      } else {
        app = initializeApp(firebaseConfig);
      }

      const db = getFirestore(app);
      const operation = parameters.operation;
      let result: any;

      switch (operation) {
        case 'get':
          result = await this.getDocument(db, parameters, { doc, getDoc });
          break;
        case 'getCollection':
          result = await this.getCollection(db, parameters, { collection, getDocs, query, where, orderBy, limit, startAfter });
          break;
        case 'add':
          result = await this.addDocument(db, parameters, { collection, addDoc });
          break;
        case 'set':
          result = await this.setDocument(db, parameters, { doc, setDoc });
          break;
        case 'update':
          result = await this.updateDocument(db, parameters, { doc, updateDoc });
          break;
        case 'delete':
          result = await this.deleteDocument(db, parameters, { doc, deleteDoc });
          break;
        default:
          throw new Error(`Unsupported operation: ${operation}`);
      }

      return {
        success: true,
        data: result,
        operation,
        collection: parameters.collection
      };

    } catch (error) {
      this.logger.error(`Firebase operation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        operation: parameters.operation
      };
    }
  }

  private async getDocument(db: any, parameters: any, { doc, getDoc }: any): Promise<any> {
    const docRef = doc(db, parameters.collection, parameters.documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        data: docSnap.data()
      };
    } else {
      return null;
    }
  }

  private async getCollection(db: any, parameters: any, { collection, getDocs, query, where, orderBy, limit, startAfter }: any): Promise<any> {
    let collectionRef = collection(db, parameters.collection);
    let q = collectionRef;

    // Apply filters
    if (parameters.filters) {
      const filters = JSON.parse(parameters.filters);
      for (const filter of filters) {
        q = query(q, where(filter.field, filter.operator, filter.value));
      }
    }

    // Apply ordering
    if (parameters.orderBy) {
      const orderByClause = JSON.parse(parameters.orderBy);
      q = query(q, orderBy(orderByClause.field, orderByClause.direction || 'asc'));
    }

    // Apply limit
    if (parameters.limit) {
      q = query(q, limit(parseInt(parameters.limit)));
    }

    // Apply pagination
    if (parameters.startAfter) {
      // This would need the actual document to start after
      // For simplicity, we'll skip this implementation
    }

    const querySnapshot = await getDocs(q);
    const documents: any[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        data: doc.data()
      });
    });

    return documents;
  }

  private async addDocument(db: any, parameters: any, { collection, addDoc }: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const collectionRef = collection(db, parameters.collection);
    const docRef = await addDoc(collectionRef, data);
    
    return {
      id: docRef.id,
      path: docRef.path
    };
  }

  private async setDocument(db: any, parameters: any, { doc, setDoc }: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const docRef = doc(db, parameters.collection, parameters.documentId);
    
    const options: any = {};
    if (parameters.merge === 'true' || parameters.merge === true) {
      options.merge = true;
    }
    
    await setDoc(docRef, data, options);
    
    return {
      id: parameters.documentId,
      path: docRef.path,
      success: true
    };
  }

  private async updateDocument(db: any, parameters: any, { doc, updateDoc }: any): Promise<any> {
    const data = JSON.parse(parameters.data);
    const docRef = doc(db, parameters.collection, parameters.documentId);
    
    await updateDoc(docRef, data);
    
    return {
      id: parameters.documentId,
      path: docRef.path,
      success: true
    };
  }

  private async deleteDocument(db: any, parameters: any, { doc, deleteDoc }: any): Promise<any> {
    const docRef = doc(db, parameters.collection, parameters.documentId);
    await deleteDoc(docRef);
    
    return {
      id: parameters.documentId,
      path: docRef.path,
      success: true
    };
  }
}
