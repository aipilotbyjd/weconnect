import { registerAs } from '@nestjs/config';

export default registerAs('redis', () => ({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0', 10),
  keyPrefix: process.env.REDIS_KEY_PREFIX || 'weconnect:',

  // BullMQ specific settings
  bull: {
    prefix: 'bull',
    defaultJobOptions: {
      removeOnComplete: {
        age: 3600, // 1 hour
        count: 100,
      },
      removeOnFail: {
        age: 86400, // 24 hours
        count: 500,
      },
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  },

  // Cache settings
  cache: {
    ttl: 300, // 5 minutes default
    max: 100, // max items in cache
  },
}));
