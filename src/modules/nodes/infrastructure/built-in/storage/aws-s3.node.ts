import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import {
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  CopyObjectCommand,
  HeadObjectCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListBucketsCommand,
  GetBucketLocationCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const AWSS3NodeDefinition = new NodeDefinition({
  name: 'AWS S3',
  displayName: 'AWS S3',
  description: 'Interact with Amazon S3 for cloud storage operations',
  version: 1,
  group: ['storage', 'cloud'],
  icon: 'simple-icons:amazons3',
  defaults: {
    name: 'AWS S3',
    color: '#FF9900',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'aws',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Upload File', value: 'uploadFile' },
        { name: 'Download File', value: 'downloadFile' },
        { name: 'Delete File', value: 'deleteFile' },
        { name: 'List Files', value: 'listFiles' },
        { name: 'Copy File', value: 'copyFile' },
        { name: 'Get File Info', value: 'getFileInfo' },
        { name: 'Generate Presigned URL', value: 'generatePresignedUrl' },
        { name: 'Create Bucket', value: 'createBucket' },
        { name: 'Delete Bucket', value: 'deleteBucket' },
        { name: 'List Buckets', value: 'listBuckets' },
        { name: 'Get Bucket Location', value: 'getBucketLocation' },
      ],
      default: 'listFiles',
      required: true,
    },
    {
      name: 'bucketName',
      displayName: 'Bucket Name',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['uploadFile', 'downloadFile', 'deleteFile', 'listFiles', 'copyFile', 'getFileInfo', 'generatePresignedUrl', 'deleteBucket', 'getBucketLocation'],
        },
      },
      required: true,
      description: 'The name of the S3 bucket',
    },
    {
      name: 'key',
      displayName: 'Object Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['uploadFile', 'downloadFile', 'deleteFile', 'getFileInfo', 'generatePresignedUrl'],
        },
      },
      required: true,
      description: 'The key (path) of the object in S3',
    },
    {
      name: 'sourceKey',
      displayName: 'Source Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['copyFile'],
        },
      },
      required: true,
      description: 'The key of the source object to copy',
    },
    {
      name: 'destinationKey',
      displayName: 'Destination Key',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['copyFile'],
        },
      },
      required: true,
      description: 'The key for the destination object',
    },
    {
      name: 'destinationBucket',
      displayName: 'Destination Bucket',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['copyFile'],
        },
      },
      description: 'The destination bucket (leave empty to use same bucket)',
    },
    {
      name: 'fileContent',
      displayName: 'File Content',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'The content to upload (text content)',
    },
    {
      name: 'filePath',
      displayName: 'File Path',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Local file path to upload (alternative to file content)',
    },
    {
      name: 'contentType',
      displayName: 'Content Type',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'MIME type of the file (e.g., image/jpeg, text/plain)',
    },
    {
      name: 'prefix',
      displayName: 'Prefix',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['listFiles'],
        },
      },
      description: 'Prefix to filter objects',
    },
    {
      name: 'maxKeys',
      displayName: 'Max Keys',
      type: 'number',
      default: 1000,
      displayOptions: {
        show: {
          operation: ['listFiles'],
        },
      },
      description: 'Maximum number of objects to return',
    },
    {
      name: 'delimiter',
      displayName: 'Delimiter',
      type: 'string',
      default: '',
      displayOptions: {
        show: {
          operation: ['listFiles'],
        },
      },
      description: 'Delimiter for grouping object keys',
    },
    {
      name: 'region',
      displayName: 'Region',
      type: 'string',
      default: 'us-east-1',
      displayOptions: {
        show: {
          operation: ['createBucket'],
        },
      },
      description: 'AWS region for the new bucket',
    },
    {
      name: 'urlExpiration',
      displayName: 'URL Expiration (seconds)',
      type: 'number',
      default: 3600,
      displayOptions: {
        show: {
          operation: ['generatePresignedUrl'],
        },
      },
      description: 'Expiration time for the presigned URL in seconds',
    },
    {
      name: 'urlOperation',
      displayName: 'URL Operation',
      type: 'options',
      options: [
        { name: 'GET (Download)', value: 'getObject' },
        { name: 'PUT (Upload)', value: 'putObject' },
      ],
      default: 'getObject',
      displayOptions: {
        show: {
          operation: ['generatePresignedUrl'],
        },
      },
      description: 'Operation type for the presigned URL',
    },
    {
      name: 'metadata',
      displayName: 'Metadata',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Custom metadata for the object',
    },
    {
      name: 'tags',
      displayName: 'Tags',
      type: 'json',
      default: {},
      displayOptions: {
        show: {
          operation: ['uploadFile'],
        },
      },
      description: 'Tags for the object as key-value pairs',
    },
  ],
});

export class AWSS3NodeExecutor implements INodeExecutor {
  private s3Client: S3Client | null = null;

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const credentials = context.credentials?.aws;
    
    if (!credentials) {
      return {
        success: false,
        error: 'AWS credentials not configured',
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }

    try {
      // Initialize S3 client
      const config: S3ClientConfig = {
        region: credentials.region || 'us-east-1',
        credentials: {
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
        },
      };

      this.s3Client = new S3Client(config);

      const { operation } = context.parameters;
      let result: any;

      switch (operation) {
        case 'uploadFile':
          result = await this.uploadFile(context);
          break;
        case 'downloadFile':
          result = await this.downloadFile(context);
          break;
        case 'deleteFile':
          result = await this.deleteFile(context);
          break;
        case 'listFiles':
          result = await this.listFiles(context);
          break;
        case 'copyFile':
          result = await this.copyFile(context);
          break;
        case 'getFileInfo':
          result = await this.getFileInfo(context);
          break;
        case 'generatePresignedUrl':
          result = await this.generatePresignedUrl(context);
          break;
        case 'createBucket':
          result = await this.createBucket(context);
          break;
        case 'deleteBucket':
          result = await this.deleteBucket(context);
          break;
        case 'listBuckets':
          result = await this.listBuckets(context);
          break;
        case 'getBucketLocation':
          result = await this.getBucketLocation(context);
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
          bucketName: context.parameters.bucketName,
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

  private async uploadFile(context: NodeExecutionContext): Promise<any> {
    const { bucketName, key, fileContent, filePath, contentType, metadata, tags } = context.parameters;

    let body: string | Buffer;
    
    if (fileContent) {
      body = fileContent;
    } else if (filePath) {
      const fs = require('fs');
      body = fs.readFileSync(filePath);
    } else {
      throw new Error('Either fileContent or filePath must be provided');
    }

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
      Metadata: metadata || {},
      Tagging: tags ? new URLSearchParams(tags).toString() : undefined,
    });

    const response = await this.s3Client!.send(command);

    return {
      etag: response.ETag,
      versionId: response.VersionId,
      location: `s3://${bucketName}/${key}`,
      size: body.length,
    };
  }

  private async downloadFile(context: NodeExecutionContext): Promise<any> {
    const { bucketName, key } = context.parameters;

    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await this.s3Client!.send(command);
    
    const content = await response.Body?.transformToString();

    return {
      content: content,
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  }

  private async deleteFile(context: NodeExecutionContext): Promise<any> {
    const { bucketName, key } = context.parameters;

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await this.s3Client!.send(command);

    return {
      deleted: true,
      key: key,
      versionId: response.VersionId,
      deleteMarker: response.DeleteMarker,
    };
  }

  private async listFiles(context: NodeExecutionContext): Promise<any> {
    const { bucketName, prefix, maxKeys, delimiter } = context.parameters;

    const command = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: prefix || undefined,
      MaxKeys: maxKeys || 1000,
      Delimiter: delimiter || undefined,
    });

    const response = await this.s3Client!.send(command);

    return {
      objects: response.Contents?.map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag,
        storageClass: obj.StorageClass,
      })) || [],
      commonPrefixes: response.CommonPrefixes?.map(cp => cp.Prefix) || [],
      isTruncated: response.IsTruncated,
      nextContinuationToken: response.NextContinuationToken,
      keyCount: response.KeyCount,
    };
  }

  private async copyFile(context: NodeExecutionContext): Promise<any> {
    const { bucketName, sourceKey, destinationKey, destinationBucket } = context.parameters;

    const copySource = `${bucketName}/${sourceKey}`;
    const destBucket = destinationBucket || bucketName;

    const command = new CopyObjectCommand({
      Bucket: destBucket,
      Key: destinationKey,
      CopySource: copySource,
    });

    const response = await this.s3Client!.send(command);

    return {
      etag: response.CopyObjectResult?.ETag,
      lastModified: response.CopyObjectResult?.LastModified,
      sourceBucket: bucketName,
      sourceKey: sourceKey,
      destinationBucket: destBucket,
      destinationKey: destinationKey,
    };
  }

  private async getFileInfo(context: NodeExecutionContext): Promise<any> {
    const { bucketName, key } = context.parameters;

    const command = new HeadObjectCommand({
      Bucket: bucketName,
      Key: key,
    });

    const response = await this.s3Client!.send(command);

    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      etag: response.ETag,
      lastModified: response.LastModified,
      versionId: response.VersionId,
      metadata: response.Metadata,
      storageClass: response.StorageClass,
      serverSideEncryption: response.ServerSideEncryption,
    };
  }

  private async generatePresignedUrl(context: NodeExecutionContext): Promise<any> {
    const { bucketName, key, urlExpiration, urlOperation } = context.parameters;

    let command;
    if (urlOperation === 'putObject') {
      command = new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
    } else {
      command = new GetObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
    }

    const url = await getSignedUrl(this.s3Client!, command, {
      expiresIn: urlExpiration || 3600,
    });

    return {
      url: url,
      operation: urlOperation,
      expiresIn: urlExpiration || 3600,
      bucketName: bucketName,
      key: key,
    };
  }

  private async createBucket(context: NodeExecutionContext): Promise<any> {
    const { bucketName, region } = context.parameters;

    const command = new CreateBucketCommand({
      Bucket: bucketName,
      CreateBucketConfiguration: region !== 'us-east-1' ? {
        LocationConstraint: region,
      } : undefined,
    });

    const response = await this.s3Client!.send(command);

    return {
      bucketName: bucketName,
      location: response.Location,
      created: true,
    };
  }

  private async deleteBucket(context: NodeExecutionContext): Promise<any> {
    const { bucketName } = context.parameters;

    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });

    await this.s3Client!.send(command);

    return {
      bucketName: bucketName,
      deleted: true,
    };
  }

  private async listBuckets(context: NodeExecutionContext): Promise<any> {
    const command = new ListBucketsCommand({});

    const response = await this.s3Client!.send(command);

    return {
      buckets: response.Buckets?.map(bucket => ({
        name: bucket.Name,
        creationDate: bucket.CreationDate,
      })) || [],
      owner: response.Owner,
    };
  }

  private async getBucketLocation(context: NodeExecutionContext): Promise<any> {
    const { bucketName } = context.parameters;

    const command = new GetBucketLocationCommand({
      Bucket: bucketName,
    });

    const response = await this.s3Client!.send(command);

    return {
      bucketName: bucketName,
      region: response.LocationConstraint || 'us-east-1',
    };
  }
}
