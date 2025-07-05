import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AIAgentMemory, MemoryType } from '../../domain/entities/ai-agent-memory.entity';
import { BaseMemory } from '@langchain/core/memory';
import { BaseChatMessageHistory } from '@langchain/core/chat_history';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export interface MemoryConfig {
  type: MemoryType;
  maxTokens?: number;
  windowSize?: number;
  returnMessages?: boolean;
  memoryKey?: string;
}

@Injectable()
export class AIMemoryService {
  private readonly logger = new Logger(AIMemoryService.name);

  constructor(
    @InjectRepository(AIAgentMemory)
    private readonly memoryRepository: Repository<AIAgentMemory>,
  ) {}

  /**
   * Create a LangChain memory instance based on configuration
   */
  async createMemory(
    agentId: string,
    sessionId: string,
    config: MemoryConfig,
    llm?: BaseChatModel
  ): Promise<BaseMemory> {
    const { type, maxTokens = 1000, windowSize = 10, returnMessages = true, memoryKey = 'history' } = config;

    // Load existing memory data
    const existingMemory = await this.loadMemoryData(agentId, sessionId, type);
    
    // Create a simple in-memory chat history for now
    // In a production environment, you'd want to implement a proper chat history class
    const chatHistory = {
      messages: existingMemory,
      addMessage: async (message: any) => {
        chatHistory.messages.push(message);
      },
      getMessages: async () => chatHistory.messages,
      clear: async () => {
        chatHistory.messages = [];
      },
    };

    // For now, return a simple memory implementation
    // In a full implementation, you would use proper LangChain memory classes
    return {
      memoryKeys: [memoryKey],
      chatHistory,
      saveContext: async (inputs: any, outputs: any) => {
        // Save conversation to database
        await this.saveMemoryData(agentId, sessionId, type, {
          inputs,
          outputs,
          timestamp: new Date(),
        });
      },
      loadMemoryVariables: async () => {
        const messages = await this.loadMemoryData(agentId, sessionId, type);
        return { [memoryKey]: messages };
      },
      clear: async () => {
        await this.clearMemory(agentId, sessionId, type);
      },
    } as BaseMemory;
  }

  /**
   * Save memory data to database
   */
  async saveMemoryData(
    agentId: string,
    sessionId: string,
    type: MemoryType,
    data: any,
    expiresAt?: Date
  ): Promise<void> {
    try {
      const memory = this.memoryRepository.create({
        agentId,
        sessionId,
        type,
        key: `${sessionId}_${type}`,
        data,
        expiresAt,
      });

      await this.memoryRepository.save(memory);
      this.logger.debug(`Saved memory data for agent ${agentId}, session ${sessionId}, type ${type}`);
    } catch (error) {
      this.logger.error(`Failed to save memory data:`, error);
    }
  }

  /**
   * Load memory data from database
   */
  async loadMemoryData(agentId: string, sessionId: string, type: MemoryType): Promise<any[]> {
    try {
      const memory = await this.memoryRepository.findOne({
        where: {
          agentId,
          sessionId,
          type,
          key: `${sessionId}_${type}`,
        },
        order: { createdAt: 'DESC' },
      });

      if (!memory) {
        return [];
      }

      // Check if memory has expired
      if (memory.expiresAt && memory.expiresAt < new Date()) {
        await this.memoryRepository.remove(memory);
        return [];
      }

      return memory.data || [];
    } catch (error) {
      this.logger.error(`Failed to load memory data:`, error);
      return [];
    }
  }

  /**
   * Clear memory for a specific session
   */
  async clearMemory(agentId: string, sessionId: string, type?: MemoryType): Promise<void> {
    try {
      const query: any = { agentId, sessionId };
      if (type) {
        query.type = type;
      }

      await this.memoryRepository.delete(query);
      this.logger.debug(`Cleared memory for agent ${agentId}, session ${sessionId}`);
    } catch (error) {
      this.logger.error(`Failed to clear memory:`, error);
    }
  }

  /**
   * Get memory statistics for an agent
   */
  async getMemoryStats(agentId: string): Promise<any> {
    try {
      const stats = await this.memoryRepository
        .createQueryBuilder('memory')
        .select('memory.type', 'type')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(LENGTH(memory.data::text))', 'avgSize')
        .where('memory.agentId = :agentId', { agentId })
        .groupBy('memory.type')
        .getRawMany();

      return stats;
    } catch (error) {
      this.logger.error(`Failed to get memory stats:`, error);
      return [];
    }
  }

  /**
   * Clean up expired memory entries
   */
  async cleanupExpiredMemory(): Promise<void> {
    try {
      const result = await this.memoryRepository
        .createQueryBuilder()
        .delete()
        .where('expiresAt < :now', { now: new Date() })
        .execute();

      this.logger.debug(`Cleaned up ${result.affected} expired memory entries`);
    } catch (error) {
      this.logger.error(`Failed to cleanup expired memory:`, error);
    }
  }

  /**
   * Get memory usage by agent
   */
  async getMemoryUsage(agentId: string): Promise<any> {
    try {
      const usage = await this.memoryRepository
        .createQueryBuilder('memory')
        .select([
          'COUNT(*) as totalEntries',
          'SUM(LENGTH(memory.data::text)) as totalSize',
          'MAX(memory.createdAt) as lastActivity',
        ])
        .where('memory.agentId = :agentId', { agentId })
        .getRawOne();

      return usage;
    } catch (error) {
      this.logger.error(`Failed to get memory usage:`, error);
      return null;
    }
  }

  /**
   * Archive old memory data
   */
  async archiveOldMemory(olderThanDays: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const result = await this.memoryRepository
        .createQueryBuilder()
        .delete()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .execute();

      this.logger.debug(`Archived ${result.affected} old memory entries`);
    } catch (error) {
      this.logger.error(`Failed to archive old memory:`, error);
    }
  }
}
