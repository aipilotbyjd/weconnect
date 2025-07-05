import { Injectable, Logger } from '@nestjs/common';
import { NodeExecutor } from '../../interfaces/node-executor.interface';
import { NodeExecutionContext } from '../../interfaces/node-execution-context.interface';
import { Redis } from 'ioredis';

@Injectable()
export class RedisExecutor implements NodeExecutor {
  private readonly logger = new Logger(RedisExecutor.name);

  async execute(context: NodeExecutionContext): Promise<any> {
    const { parameters, credentials } = context;
    
    try {
      // Get connection details
      const host = credentials?.host || parameters.host || 'localhost';
      const port = parseInt(credentials?.port || parameters.port || '6379');
      const password = credentials?.password || parameters.password;
      const database = parseInt(parameters.database || '0');
      const operation = parameters.operation;

      // Connect to Redis
      const redis = new Redis({
        host,
        port,
        password,
        db: database,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3
      });

      let result: any;

      try {
        switch (operation) {
          case 'get':
            result = await this.getValue(redis, parameters);
            break;
          case 'set':
            result = await this.setValue(redis, parameters);
            break;
          case 'del':
            result = await this.deleteKey(redis, parameters);
            break;
          case 'exists':
            result = await this.keyExists(redis, parameters);
            break;
          case 'keys':
            result = await this.getKeys(redis, parameters);
            break;
          case 'expire':
            result = await this.setExpiration(redis, parameters);
            break;
          case 'ttl':
            result = await this.getTimeToLive(redis, parameters);
            break;
          case 'incr':
            result = await this.incrementValue(redis, parameters);
            break;
          case 'decr':
            result = await this.decrementValue(redis, parameters);
            break;
          case 'hget':
            result = await this.getHashField(redis, parameters);
            break;
          case 'hset':
            result = await this.setHashField(redis, parameters);
            break;
          case 'hgetall':
            result = await this.getAllHashFields(redis, parameters);
            break;
          case 'hdel':
            result = await this.deleteHashField(redis, parameters);
            break;
          case 'lpush':
            result = await this.leftPushList(redis, parameters);
            break;
          case 'rpush':
            result = await this.rightPushList(redis, parameters);
            break;
          case 'lpop':
            result = await this.leftPopList(redis, parameters);
            break;
          case 'rpop':
            result = await this.rightPopList(redis, parameters);
            break;
          case 'lrange':
            result = await this.getListRange(redis, parameters);
            break;
          case 'sadd':
            result = await this.addToSet(redis, parameters);
            break;
          case 'srem':
            result = await this.removeFromSet(redis, parameters);
            break;
          case 'smembers':
            result = await this.getSetMembers(redis, parameters);
            break;
          case 'sismember':
            result = await this.isSetMember(redis, parameters);
            break;
          case 'zadd':
            result = await this.addToSortedSet(redis, parameters);
            break;
          case 'zrem':
            result = await this.removeFromSortedSet(redis, parameters);
            break;
          case 'zrange':
            result = await this.getSortedSetRange(redis, parameters);
            break;
          case 'zrank':
            result = await this.getSortedSetRank(redis, parameters);
            break;
          case 'zscore':
            result = await this.getSortedSetScore(redis, parameters);
            break;
          case 'publish':
            result = await this.publishMessage(redis, parameters);
            break;
          case 'flushdb':
            result = await this.flushDatabase(redis);
            break;
          case 'info':
            result = await this.getInfo(redis, parameters);
            break;
          default:
            throw new Error(`Unsupported operation: ${operation}`);
        }

        return {
          success: true,
          data: result,
          operation,
          key: parameters.key
        };

      } finally {
        redis.disconnect();
      }

    } catch (error) {
      this.logger.error(`Redis operation failed: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message,
        operation: parameters.operation
      };
    }
  }

  private async getValue(redis: Redis, parameters: any): Promise<string | null> {
    return await redis.get(parameters.key);
  }

  private async setValue(redis: Redis, parameters: any): Promise<string> {
    const args: any[] = [parameters.key, parameters.value];
    if (parameters.ttl) {
      args.push('EX', parseInt(parameters.ttl));
    }
    return await redis.set(...args);
  }

  private async deleteKey(redis: Redis, parameters: any): Promise<number> {
    const keys = Array.isArray(parameters.key) ? parameters.key : [parameters.key];
    return await redis.del(...keys);
  }

  private async keyExists(redis: Redis, parameters: any): Promise<number> {
    return await redis.exists(parameters.key);
  }

  private async getKeys(redis: Redis, parameters: any): Promise<string[]> {
    const pattern = parameters.pattern || '*';
    return await redis.keys(pattern);
  }

  private async setExpiration(redis: Redis, parameters: any): Promise<number> {
    return await redis.expire(parameters.key, parseInt(parameters.seconds));
  }

  private async getTimeToLive(redis: Redis, parameters: any): Promise<number> {
    return await redis.ttl(parameters.key);
  }

  private async incrementValue(redis: Redis, parameters: any): Promise<number> {
    const increment = parameters.increment ? parseInt(parameters.increment) : 1;
    return increment === 1 ? 
      await redis.incr(parameters.key) : 
      await redis.incrby(parameters.key, increment);
  }

  private async decrementValue(redis: Redis, parameters: any): Promise<number> {
    const decrement = parameters.decrement ? parseInt(parameters.decrement) : 1;
    return decrement === 1 ? 
      await redis.decr(parameters.key) : 
      await redis.decrby(parameters.key, decrement);
  }

  private async getHashField(redis: Redis, parameters: any): Promise<string | null> {
    return await redis.hget(parameters.key, parameters.field);
  }

  private async setHashField(redis: Redis, parameters: any): Promise<number> {
    return await redis.hset(parameters.key, parameters.field, parameters.value);
  }

  private async getAllHashFields(redis: Redis, parameters: any): Promise<Record<string, string>> {
    return await redis.hgetall(parameters.key);
  }

  private async deleteHashField(redis: Redis, parameters: any): Promise<number> {
    const fields = Array.isArray(parameters.field) ? parameters.field : [parameters.field];
    return await redis.hdel(parameters.key, ...fields);
  }

  private async leftPushList(redis: Redis, parameters: any): Promise<number> {
    const values = Array.isArray(parameters.value) ? parameters.value : [parameters.value];
    return await redis.lpush(parameters.key, ...values);
  }

  private async rightPushList(redis: Redis, parameters: any): Promise<number> {
    const values = Array.isArray(parameters.value) ? parameters.value : [parameters.value];
    return await redis.rpush(parameters.key, ...values);
  }

  private async leftPopList(redis: Redis, parameters: any): Promise<string | null> {
    return await redis.lpop(parameters.key);
  }

  private async rightPopList(redis: Redis, parameters: any): Promise<string | null> {
    return await redis.rpop(parameters.key);
  }

  private async getListRange(redis: Redis, parameters: any): Promise<string[]> {
    const start = parseInt(parameters.start || '0');
    const stop = parseInt(parameters.stop || '-1');
    return await redis.lrange(parameters.key, start, stop);
  }

  private async addToSet(redis: Redis, parameters: any): Promise<number> {
    const members = Array.isArray(parameters.member) ? parameters.member : [parameters.member];
    return await redis.sadd(parameters.key, ...members);
  }

  private async removeFromSet(redis: Redis, parameters: any): Promise<number> {
    const members = Array.isArray(parameters.member) ? parameters.member : [parameters.member];
    return await redis.srem(parameters.key, ...members);
  }

  private async getSetMembers(redis: Redis, parameters: any): Promise<string[]> {
    return await redis.smembers(parameters.key);
  }

  private async isSetMember(redis: Redis, parameters: any): Promise<number> {
    return await redis.sismember(parameters.key, parameters.member);
  }

  private async addToSortedSet(redis: Redis, parameters: any): Promise<number> {
    return await redis.zadd(parameters.key, parameters.score, parameters.member);
  }

  private async removeFromSortedSet(redis: Redis, parameters: any): Promise<number> {
    const members = Array.isArray(parameters.member) ? parameters.member : [parameters.member];
    return await redis.zrem(parameters.key, ...members);
  }

  private async getSortedSetRange(redis: Redis, parameters: any): Promise<string[]> {
    const start = parseInt(parameters.start || '0');
    const stop = parseInt(parameters.stop || '-1');
    const withScores = parameters.withScores === 'true' || parameters.withScores === true;
    
    return withScores ? 
      await redis.zrange(parameters.key, start, stop, 'WITHSCORES') :
      await redis.zrange(parameters.key, start, stop);
  }

  private async getSortedSetRank(redis: Redis, parameters: any): Promise<number | null> {
    return await redis.zrank(parameters.key, parameters.member);
  }

  private async getSortedSetScore(redis: Redis, parameters: any): Promise<string | null> {
    return await redis.zscore(parameters.key, parameters.member);
  }

  private async publishMessage(redis: Redis, parameters: any): Promise<number> {
    return await redis.publish(parameters.channel, parameters.message);
  }

  private async flushDatabase(redis: Redis): Promise<string> {
    return await redis.flushdb();
  }

  private async getInfo(redis: Redis, parameters: any): Promise<string> {
    const section = parameters.section || 'all';
    return await redis.info(section);
  }
}
