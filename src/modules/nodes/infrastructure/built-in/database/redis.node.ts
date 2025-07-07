import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import { INodeExecutor, NodeExecutionContext, NodeExecutionResult } from '../../../../../core/abstracts/base-node.interface';
import { Injectable, Logger } from '@nestjs/common';

export const RedisNodeDefinition = new NodeDefinition({
  name: 'Redis',
  displayName: 'Redis',
  description: 'Perform Redis cache and key-value operations including strings, hashes, lists, sets',
  version: 1,
  group: ['Database'],
  icon: 'database',
  defaults: {
    name: 'Redis',
    color: '#DC382D'
  },
  inputs: ['default'],
  outputs: ['default'],
  credentials: [
    {
      name: 'redisCredentials',
      required: true
    }
  ],
  properties: [
    {
      name: 'operation',
      type: 'options',
      displayName: 'Operation',
      description: 'Redis operation to perform',
      required: true,
      default: 'get',
      options: [
        { name: 'Get Value', value: 'get' },
        { name: 'Set Value', value: 'set' },
        { name: 'Delete Key', value: 'del' },
        { name: 'Key Exists', value: 'exists' },
        { name: 'Get Keys', value: 'keys' },
        { name: 'Set Expiration', value: 'expire' },
        { name: 'Increment', value: 'incr' },
        { name: 'Decrement', value: 'decr' },
        { name: 'Hash Get', value: 'hget' },
        { name: 'Hash Set', value: 'hset' },
        { name: 'Hash Get All', value: 'hgetall' }
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
  ],
  isCustom: false,
  isActive: true
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

  validate(configuration: Record<string, any>): boolean {
    // Basic validation for Redis operations
    if (!configuration.operation) {
      return false;
    }

    if (!configuration.key) {
      return false;
    }

    if (['set', 'hset'].includes(configuration.operation) && !configuration.value) {
      return false;
    }

    if (['hget', 'hset'].includes(configuration.operation) && !configuration.field) {
      return false;
    }

    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {
        operation: {
          type: 'string',
          enum: ['get', 'set', 'del', 'exists', 'keys', 'expire', 'incr', 'decr', 'hget', 'hset', 'hgetall']
        },
        key: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        field: {
          type: 'string'
        },
        database: {
          type: 'number',
          minimum: 0,
          maximum: 15
        }
      },
      required: ['operation', 'key']
    };
  }
}
