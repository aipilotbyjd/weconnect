import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../domain/interfaces/node-executor.interface';
import { Injectable, Logger } from '@nestjs/common';

export const RedisNodeDefinition = new NodeDefinition({
  name: 'Redis',
  category: 'Database',
  description: 'Perform Redis cache and key-value operations including strings, hashes, lists, sets',
  version: '1.0.0',
  icon: 'database',
  color: '#DC382D',
  inputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Input',
      description: 'Input data for the Redis operation'
    }
  ],
  outputs: [
    {
      name: 'default',
      type: 'any',
      displayName: 'Result',
      description: 'Redis operation result'
    }
  ],
  credentials: [
    {
      name: 'redisCredentials',
      displayName: 'Redis Credentials',
      properties: {
        host: {
          type: 'string',
          displayName: 'Host',
          description: 'Redis server host',
          required: true,
          default: 'localhost'
        },
        port: {
          type: 'number',
          displayName: 'Port',
          description: 'Redis server port',
          required: true,
          default: 6379
        },
        password: {
          type: 'string',
          displayName: 'Password',
          description: 'Redis server password (if required)',
          required: false,
          default: ''
        }
      }
    }
  ],
  properties: [
    {
      name: 'operation',
      type: 'select',
      displayName: 'Operation',
      description: 'Redis operation to perform',
      required: true,
      default: 'get',
      options: [
        { value: 'get', label: 'Get Value' },
        { value: 'set', label: 'Set Value' },
        { value: 'del', label: 'Delete Key' },
        { value: 'exists', label: 'Key Exists' },
        { value: 'keys', label: 'Get Keys' },
        { value: 'expire', label: 'Set Expiration' },
        { value: 'incr', label: 'Increment' },
        { value: 'decr', label: 'Decrement' },
        { value: 'hget', label: 'Hash Get' },
        { value: 'hset', label: 'Hash Set' },
        { value: 'hgetall', label: 'Hash Get All' }
      ]
    },
    {
      name: 'database',
      type: 'number',
      displayName: 'Database',
      description: 'Redis database number (0-15)',
      required: false,
      default: 0
    },
    {
      name: 'key',
      type: 'string',
      displayName: 'Key',
      description: 'Redis key name',
      required: true,
      default: ''
    },
    {
      name: 'value',
      type: 'string',
      displayName: 'Value',
      description: 'Value to set',
      required: false,
      default: ''
    },
    {
      name: 'field',
      type: 'string',
      displayName: 'Field',
      description: 'Hash field name',
      required: false,
      default: ''
    }
  ]
});

@Injectable()
export class RedisNodeExecutor implements INodeExecutor {
  private readonly logger = new Logger(RedisNodeExecutor.name);

  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();
    const { parameters, credentials } = context;
    
    try {
      // Import Redis dynamically to avoid dependency issues
      const Redis = require('ioredis');
      
      const host = credentials?.host || parameters.host || 'localhost';
      const port = parseInt(credentials?.port || parameters.port || '6379');
      const password = credentials?.password || parameters.password;
      const database = parseInt(parameters.database || '0');
      const operation = parameters.operation;

      const redis = new Redis({
        host,
        port,
        password,
        db: database,
        maxRetriesPerRequest: 3
      });

      let result: any;

      try {
        switch (operation) {
          case 'get':
            result = await redis.get(parameters.key);
            break;
          case 'set':
            result = await redis.set(parameters.key, parameters.value);
            break;
          case 'del':
            result = await redis.del(parameters.key);
            break;
          case 'exists':
            result = await redis.exists(parameters.key);
            break;
          case 'keys':
            const pattern = parameters.pattern || '*';
            result = await redis.keys(pattern);
            break;
          case 'expire':
            result = await redis.expire(parameters.key, parseInt(parameters.seconds || '3600'));
            break;
          case 'incr':
            result = await redis.incr(parameters.key);
            break;
          case 'decr':
            result = await redis.decr(parameters.key);
            break;
          case 'hget':
            result = await redis.hget(parameters.key, parameters.field);
            break;
          case 'hset':
            result = await redis.hset(parameters.key, parameters.field, parameters.value);
            break;
          case 'hgetall':
            result = await redis.hgetall(parameters.key);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
          success: true,
          data: [result],
          outputs: { default: [result] },
          metadata: {
            executionTime: Date.now() - startTime,
            operation,
            key: parameters.key
          }
        };

      } finally {
        redis.disconnect();
      }

    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime
        }
      };
    }
  }
}
