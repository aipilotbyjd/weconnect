import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

// Entities
import { AIAgent } from './domain/entities/ai-agent.entity';
import { AIAgentExecution } from './domain/entities/ai-agent-execution.entity';
import { AIAgentMemory } from './domain/entities/ai-agent-memory.entity';
import { AIAgentTool } from './domain/entities/ai-agent-tool.entity';

// Services
import { AIAgentService } from './application/services/ai-agent.service';
import { AIProviderService } from './application/services/ai-provider.service';
import { AIToolService } from './application/services/ai-tool.service';
import { AIMemoryService } from './application/services/ai-memory.service';
import { AIAgentExecutorService } from './application/services/ai-agent-executor.service';

// Controllers
import { AIAgentController } from './presentation/controllers/ai-agent.controller';

// Node Implementation
import { AIAgentNodeExecutor } from './infrastructure/executors/ai-agent-node.executor';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AIAgent,
      AIAgentExecution,
      AIAgentMemory,
      AIAgentTool,
    ]),
    ConfigModule,
    HttpModule,
  ],
  providers: [
    AIAgentService,
    AIProviderService,
    AIToolService,
    AIMemoryService,
    AIAgentExecutorService,
    AIAgentNodeExecutor,
  ],
  controllers: [AIAgentController],
  exports: [
    AIAgentService,
    AIProviderService,
    AIToolService,
    AIMemoryService,
    AIAgentExecutorService,
    AIAgentNodeExecutor,
  ],
})
export class AIAgentsModule {}
