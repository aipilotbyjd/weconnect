import { NodeDefinition } from '../../interfaces/node-definition.interface';

export const redisDefinition: NodeDefinition = {
  name: 'Redis',
  category: 'Database',
  description: 'Perform Redis cache and key-value operations including strings, hashes, lists, sets, and sorted sets',
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
        { value: 'ttl', label: 'Time To Live' },
        { value: 'incr', label: 'Increment' },
        { value: 'decr', label: 'Decrement' },
        { value: 'hget', label: 'Hash Get' },
        { value: 'hset', label: 'Hash Set' },
        { value: 'hgetall', label: 'Hash Get All' },
        { value: 'hdel', label: 'Hash Delete' },
        { value: 'lpush', label: 'List Left Push' },
        { value: 'rpush', label: 'List Right Push' },
        { value: 'lpop', label: 'List Left Pop' },
        { value: 'rpop', label: 'List Right Pop' },
        { value: 'lrange', label: 'List Range' },
        { value: 'sadd', label: 'Set Add' },
        { value: 'srem', label: 'Set Remove' },
        { value: 'smembers', label: 'Set Members' },
        { value: 'sismember', label: 'Set Is Member' },
        { value: 'zadd', label: 'Sorted Set Add' },
        { value: 'zrem', label: 'Sorted Set Remove' },
        { value: 'zrange', label: 'Sorted Set Range' },
        { value: 'zrank', label: 'Sorted Set Rank' },
        { value: 'zscore', label: 'Sorted Set Score' },
        { value: 'publish', label: 'Publish Message' },
        { value: 'flushdb', label: 'Flush Database' },
        { value: 'info', label: 'Server Info' }
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
      default: '',
      displayOptions: {
        hide: {
          operation: ['keys', 'flushdb', 'info']
        }
      }
    },
    {
      name: 'value',
      type: 'string',
      displayName: 'Value',
      description: 'Value to set or add',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['set', 'lpush', 'rpush', 'hset']
        }
      }
    },
    {
      name: 'ttl',
      type: 'number',
      displayName: 'TTL (seconds)',
      description: 'Time to live in seconds',
      required: false,
      default: '',
      displayOptions: {
        show: {
          operation: ['set']
        }
      }
    },
    {
      name: 'pattern',
      type: 'string',
      displayName: 'Pattern',
      description: 'Key pattern for search (use * for wildcard)',
      required: false,
      default: '*',
      displayOptions: {
        show: {
          operation: ['keys']
        }
      }
    },
    {
      name: 'seconds',
      type: 'number',
      displayName: 'Seconds',
      description: 'Expiration time in seconds',
      required: true,
      default: 3600,
      displayOptions: {
        show: {
          operation: ['expire']
        }
      }
    },
    {
      name: 'increment',
      type: 'number',
      displayName: 'Increment',
      description: 'Increment value (default: 1)',
      required: false,
      default: 1,
      displayOptions: {
        show: {
          operation: ['incr']
        }
      }
    },
    {
      name: 'decrement',
      type: 'number',
      displayName: 'Decrement',
      description: 'Decrement value (default: 1)',
      required: false,
      default: 1,
      displayOptions: {
        show: {
          operation: ['decr']
        }
      }
    },
    {
      name: 'field',
      type: 'string',
      displayName: 'Field',
      description: 'Hash field name',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['hget', 'hset', 'hdel']
        }
      }
    },
    {
      name: 'start',
      type: 'number',
      displayName: 'Start',
      description: 'Start index for range operations',
      required: false,
      default: 0,
      displayOptions: {
        show: {
          operation: ['lrange', 'zrange']
        }
      }
    },
    {
      name: 'stop',
      type: 'number',
      displayName: 'Stop',
      description: 'Stop index for range operations (-1 for end)',
      required: false,
      default: -1,
      displayOptions: {
        show: {
          operation: ['lrange', 'zrange']
        }
      }
    },
    {
      name: 'member',
      type: 'string',
      displayName: 'Member',
      description: 'Set or sorted set member',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['sadd', 'srem', 'sismember', 'zadd', 'zrem', 'zrank', 'zscore']
        }
      }
    },
    {
      name: 'score',
      type: 'number',
      displayName: 'Score',
      description: 'Score for sorted set member',
      required: true,
      default: 0,
      displayOptions: {
        show: {
          operation: ['zadd']
        }
      }
    },
    {
      name: 'withScores',
      type: 'boolean',
      displayName: 'With Scores',
      description: 'Include scores in sorted set range result',
      required: false,
      default: false,
      displayOptions: {
        show: {
          operation: ['zrange']
        }
      }
    },
    {
      name: 'channel',
      type: 'string',
      displayName: 'Channel',
      description: 'Pub/Sub channel name',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['publish']
        }
      }
    },
    {
      name: 'message',
      type: 'string',
      displayName: 'Message',
      description: 'Message to publish',
      required: true,
      default: '',
      displayOptions: {
        show: {
          operation: ['publish']
        }
      }
    },
    {
      name: 'section',
      type: 'select',
      displayName: 'Info Section',
      description: 'Redis info section to retrieve',
      required: false,
      default: 'all',
      options: [
        { value: 'all', label: 'All Sections' },
        { value: 'server', label: 'Server' },
        { value: 'clients', label: 'Clients' },
        { value: 'memory', label: 'Memory' },
        { value: 'persistence', label: 'Persistence' },
        { value: 'stats', label: 'Stats' },
        { value: 'replication', label: 'Replication' },
        { value: 'cpu', label: 'CPU' },
        { value: 'commandstats', label: 'Command Stats' },
        { value: 'cluster', label: 'Cluster' },
        { value: 'keyspace', label: 'Keyspace' }
      ],
      displayOptions: {
        show: {
          operation: ['info']
        }
      }
    }
  ]
};
