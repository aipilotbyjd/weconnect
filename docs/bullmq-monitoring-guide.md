# BullMQ Monitoring Guide for WeConnect

## Overview

BullMQ is already integrated into WeConnect and uses Redis as its backend. This guide explains how to monitor and manage your queues.

## Current Setup

### Redis Container
- **Container Name**: weconnect-redis
- **Port**: 6379
- **Status**: Running ✅

### Queue Names
- `bull:workflow-execution` - Main workflow execution queue
- `bull:workflow-node` - Individual node execution queue

## Monitoring Options

### 1. Redis CLI (Quick Check)

Connect to Redis and check queue status:

```bash
# Connect to Redis container
docker exec -it weconnect-redis redis-cli

# List all Bull queues
KEYS bull:*

# Check specific queue length
LLEN bull:workflow-execution:wait
LLEN bull:workflow-execution:active
LLEN bull:workflow-execution:completed
LLEN bull:workflow-execution:failed

# Exit Redis CLI
EXIT
```

### 2. Bull Board UI (Recommended)

To enable the Bull Board monitoring UI:

1. **Enable in Docker Compose**
   
   Uncomment the Bull Board section in `docker-compose.yml`:
   ```yaml
   bull-board:
     image: deadly0/bull-board
     container_name: weconnect-bull-board
     environment:
       REDIS_HOST: redis
       REDIS_PORT: 6379
       REDIS_PASSWORD: ""
     ports:
       - "3030:3000"
     depends_on:
       - redis
     networks:
       - weconnect-network
   ```

2. **Start the container**
   ```bash
   docker-compose up -d bull-board
   ```

3. **Access the UI**
   - Open browser: http://localhost:3030
   - View all queues and jobs
   - Monitor job status, retry attempts, and failures

### 3. Built-in API Monitoring (Alternative)

Add Bull Board to your NestJS application:

```bash
npm install @bull-board/api @bull-board/express @bull-board/nestjs
```

Create `bull-board.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { WORKFLOW_EXECUTION_QUEUE, WORKFLOW_NODE_QUEUE } from './infrastructure/queues/constants';

@Module({
  imports: [
    BullBoardModule.forRoot({
      route: '/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature({
      name: WORKFLOW_EXECUTION_QUEUE,
    }),
    BullBoardModule.forFeature({
      name: WORKFLOW_NODE_QUEUE,
    }),
  ],
})
export class QueueMonitoringModule {}
```

Then access at: http://localhost:3001/queues

### 4. Arena (Alternative UI)

Arena is another popular Bull monitoring tool:

```yaml
arena:
  image: mixmaxhq/arena
  container_name: weconnect-arena
  ports:
    - "4567:4567"
  environment:
    REDIS_HOST: redis
    REDIS_PORT: 6379
  depends_on:
    - redis
  networks:
    - weconnect-network
```

Access at: http://localhost:4567

## Queue Management Commands

### Clear Failed Jobs
```bash
docker exec -it weconnect-redis redis-cli
DEL bull:workflow-execution:failed
```

### Clear All Jobs
```bash
docker exec -it weconnect-redis redis-cli
FLUSHDB
```

### Check Queue Health
```bash
# From application logs
docker logs weconnect-app | grep -i queue

# Check Redis memory
docker exec -it weconnect-redis redis-cli INFO memory
```

## Troubleshooting

### Redis Connection Issues
1. Check Redis is running:
   ```bash
   docker ps | grep redis
   ```

2. Test connection:
   ```bash
   docker exec -it weconnect-redis redis-cli PING
   # Should return: PONG
   ```

3. Check application logs:
   ```bash
   npm run start:dev
   # Look for Redis connection errors
   ```

### Queue Processing Issues
1. Check for failed jobs:
   ```bash
   docker exec -it weconnect-redis redis-cli
   LRANGE bull:workflow-execution:failed 0 -1
   ```

2. Monitor active jobs:
   ```bash
   LLEN bull:workflow-execution:active
   ```

3. Check stalled jobs:
   ```bash
   LRANGE bull:workflow-execution:stalled 0 -1
   ```

## Best Practices

1. **Monitor Queue Sizes**: Keep an eye on queue lengths to prevent memory issues
2. **Set TTL for Completed Jobs**: Configure `removeOnComplete` in job options
3. **Handle Failed Jobs**: Implement retry logic and dead letter queues
4. **Use Queue Priorities**: Important workflows should have higher priority
5. **Monitor Redis Memory**: Set max memory policy in Redis

## Queue Configuration

Current configuration in `redis.config.ts`:
- Remove completed jobs after 1 hour or 100 jobs
- Remove failed jobs after 24 hours or 500 jobs
- Retry failed jobs 3 times with exponential backoff
- Initial retry delay: 2 seconds

## Performance Tips

1. **Batch Processing**: Process multiple small jobs together
2. **Rate Limiting**: Prevent queue overflow with rate limits
3. **Separate Queues**: Use different queues for different job types
4. **Redis Persistence**: Enable AOF for durability
5. **Monitor Metrics**: Track job processing time and success rates
