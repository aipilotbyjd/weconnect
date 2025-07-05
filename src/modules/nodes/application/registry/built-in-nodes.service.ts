import { Injectable, OnModuleInit, Logger, Inject, forwardRef } from '@nestjs/common';
import { NodeRegistryService } from './node-registry.service';

// Core nodes
import { StartNodeDefinition, StartNodeExecutor } from '../../infrastructure/built-in/core/start.node';
import { HttpRequestNodeDefinition, HttpRequestNodeExecutor } from '../../infrastructure/built-in/core/http-request.node';
import { SetNodeDefinition, SetNodeExecutor } from '../../infrastructure/built-in/core/set.node';
import { IfNodeDefinition, IfNodeExecutor } from '../../infrastructure/built-in/core/if.node';
import { FunctionNodeDefinition, FunctionNodeExecutor } from '../../infrastructure/built-in/core/function.node';
import { ScheduledTriggerNodeDefinition, ScheduledTriggerNodeExecutor } from '../../infrastructure/built-in/core/scheduled-trigger.node';
import { WaitNodeDefinition, WaitNodeExecutor } from '../../infrastructure/built-in/core/wait.node';
import { LoopNodeDefinition, LoopNodeExecutor } from '../../infrastructure/built-in/core/loop.node';
import { DateTimeNodeDefinition, DateTimeNodeExecutor } from '../../infrastructure/built-in/core/datetime.node';
import { ValidationNodeDefinition, ValidationNodeExecutor } from '../../infrastructure/built-in/core/validation.node';

// Integration nodes
import { GmailNodeDefinition, GmailNodeExecutor } from '../../infrastructure/built-in/integrations/gmail.node';
import { GmailAdvancedNodeDefinition, GmailAdvancedNodeExecutor } from '../../infrastructure/built-in/integrations/gmail-advanced.node';
import { SMTPNodeDefinition, SMTPNodeExecutor } from '../../infrastructure/built-in/communication/smtp.node';
import { GoogleCalendarNodeDefinition, GoogleCalendarNodeExecutor } from '../../infrastructure/built-in/integrations/google-calendar.node';
import { GoogleDocsNodeDefinition, GoogleDocsNodeExecutor } from '../../infrastructure/built-in/integrations/google-docs.node';
import { GoogleDriveNodeDefinition, GoogleDriveNodeExecutor } from '../../infrastructure/built-in/integrations/google-drive.node';
import { GoogleSheetsNodeDefinition, GoogleSheetsNodeExecutor } from '../../infrastructure/built-in/integrations/google-sheets.node';
import { SlackNodeDefinition, SlackNodeExecutor } from '../../infrastructure/built-in/integrations/slack.node';
import { DiscordNodeDefinition, DiscordNodeExecutor } from '../../infrastructure/built-in/integrations/discord.node';
import { TrelloNodeDefinition, TrelloNodeExecutor } from '../../infrastructure/built-in/integrations/trello.node';
import { GitHubNodeDefinition, GitHubNodeExecutor } from '../../infrastructure/built-in/integrations/github.node';
import { TelegramNodeDefinition, TelegramNodeExecutor } from '../../infrastructure/built-in/integrations/telegram.node';

// Database nodes
import { PostgreSQLNodeDefinition, PostgreSQLNodeExecutor } from '../../infrastructure/built-in/database/postgresql.node';
import { MySQLNodeDefinition, MySQLNodeExecutor } from '../../infrastructure/built-in/database/mysql.node';
// import { MongoDBNodeDefinition, MongoDBNodeExecutor } from '../../infrastructure/built-in/database/mongodb.node';
// import { RedisNodeDefinition, RedisNodeExecutor } from '../../infrastructure/built-in/database/redis.node';

// Data processing nodes
import { JsonTransformNodeDefinition, JsonTransformNodeExecutor } from '../../infrastructure/built-in/data/json-transform.node';
import { FileOperationsNodeDefinition, FileOperationsNodeExecutor } from '../../infrastructure/built-in/data/file-operations.node';
import { TextProcessingNodeDefinition, TextProcessingNodeExecutor } from '../../infrastructure/built-in/data/text-processing.node';

// Advanced integration nodes
import { WhatsAppNodeDefinition, WhatsAppNodeExecutor } from '../../infrastructure/built-in/integrations/whatsapp.node';
import { SocialMediaNodeDefinition, SocialMediaNodeExecutor } from '../../infrastructure/built-in/integrations/social-media.node';

// Communication nodes
import { EmailOperationsNodeDefinition, EmailOperationsNodeExecutor } from '../../infrastructure/built-in/communication/email-operations.node';

// Media nodes
import { ImageProcessingNodeDefinition, ImageProcessingNodeExecutor } from '../../infrastructure/built-in/media/image-processing.node';

// Payment nodes
import { PaymentProcessingNodeDefinition, PaymentProcessingNodeExecutor } from '../../infrastructure/built-in/payments/payment-processing.node';

// Analytics nodes
import { DataAnalyticsNodeDefinition, DataAnalyticsNodeExecutor } from '../../infrastructure/built-in/analytics/data-analytics.node';

// AI Agent nodes
import { AIAgentNodeDefinition, AIAgentNodeExecutor } from '../../../ai-agents/infrastructure/nodes/ai-agent.node';
import { AIAgentExecutorService } from '../../../ai-agents/application/services/ai-agent-executor.service';
import { AIAgentService } from '../../../ai-agents/application/services/ai-agent.service';

@Injectable()
export class BuiltInNodesService implements OnModuleInit {
  private readonly logger = new Logger(BuiltInNodesService.name);

  constructor(
    private readonly nodeRegistry: NodeRegistryService,
    @Inject(forwardRef(() => AIAgentExecutorService))
    private readonly aiAgentExecutorService?: AIAgentExecutorService,
    @Inject(forwardRef(() => AIAgentService))
    private readonly aiAgentService?: AIAgentService,
  ) {}

  async onModuleInit() {
    this.registerBuiltInNodes();
  }

  private registerBuiltInNodes(): void {
    // Register core nodes
    this.nodeRegistry.registerNode(StartNodeDefinition, new StartNodeExecutor());
    this.nodeRegistry.registerNode(HttpRequestNodeDefinition, new HttpRequestNodeExecutor());
    this.nodeRegistry.registerNode(SetNodeDefinition, new SetNodeExecutor());
    this.nodeRegistry.registerNode(IfNodeDefinition, new IfNodeExecutor());
    this.nodeRegistry.registerNode(FunctionNodeDefinition, new FunctionNodeExecutor());
    this.nodeRegistry.registerNode(ScheduledTriggerNodeDefinition, new ScheduledTriggerNodeExecutor());
    this.nodeRegistry.registerNode(WaitNodeDefinition, new WaitNodeExecutor());
    this.nodeRegistry.registerNode(LoopNodeDefinition, new LoopNodeExecutor());
    this.nodeRegistry.registerNode(DateTimeNodeDefinition, new DateTimeNodeExecutor());
    this.nodeRegistry.registerNode(ValidationNodeDefinition, new ValidationNodeExecutor());

    // Register AI agent node (if services are available)
    if (this.aiAgentExecutorService && this.aiAgentService) {
      this.nodeRegistry.registerNode(
        AIAgentNodeDefinition, 
        new AIAgentNodeExecutor(this.aiAgentExecutorService, this.aiAgentService)
      );
    }

    // Register integration nodes
    // Google services
    this.nodeRegistry.registerNode(GmailNodeDefinition, new GmailNodeExecutor());
    this.nodeRegistry.registerNode(GmailAdvancedNodeDefinition, new GmailAdvancedNodeExecutor());
    this.nodeRegistry.registerNode(GoogleCalendarNodeDefinition, new GoogleCalendarNodeExecutor());
    this.nodeRegistry.registerNode(GoogleDocsNodeDefinition, new GoogleDocsNodeExecutor());
    this.nodeRegistry.registerNode(GoogleDriveNodeDefinition, new GoogleDriveNodeExecutor());
    this.nodeRegistry.registerNode(GoogleSheetsNodeDefinition, new GoogleSheetsNodeExecutor());
    
    // Other integrations
    this.nodeRegistry.registerNode(SlackNodeDefinition, new SlackNodeExecutor());
    this.nodeRegistry.registerNode(DiscordNodeDefinition, new DiscordNodeExecutor());
    this.nodeRegistry.registerNode(TrelloNodeDefinition, new TrelloNodeExecutor());
    this.nodeRegistry.registerNode(GitHubNodeDefinition, new GitHubNodeExecutor());
    this.nodeRegistry.registerNode(TelegramNodeDefinition, new TelegramNodeExecutor());
    this.nodeRegistry.registerNode(SMTPNodeDefinition, new SMTPNodeExecutor());
    
    // Database nodes
    this.nodeRegistry.registerNode(PostgreSQLNodeDefinition, new PostgreSQLNodeExecutor());
    this.nodeRegistry.registerNode(MySQLNodeDefinition, new MySQLNodeExecutor());
    // this.nodeRegistry.registerNode(MongoDBNodeDefinition, new MongoDBNodeExecutor());
    // this.nodeRegistry.registerNode(RedisNodeDefinition, new RedisNodeExecutor());
    
    // Data processing nodes
    this.nodeRegistry.registerNode(JsonTransformNodeDefinition, new JsonTransformNodeExecutor());
    this.nodeRegistry.registerNode(FileOperationsNodeDefinition, new FileOperationsNodeExecutor());
    this.nodeRegistry.registerNode(TextProcessingNodeDefinition, new TextProcessingNodeExecutor());
    
    // Advanced integration nodes
    this.nodeRegistry.registerNode(WhatsAppNodeDefinition, new WhatsAppNodeExecutor());
    this.nodeRegistry.registerNode(SocialMediaNodeDefinition, new SocialMediaNodeExecutor());
    
    // Communication nodes
    this.nodeRegistry.registerNode(EmailOperationsNodeDefinition, new EmailOperationsNodeExecutor());
    
    // Media nodes
    this.nodeRegistry.registerNode(ImageProcessingNodeDefinition, new ImageProcessingNodeExecutor());
    
    // Payment nodes
    this.nodeRegistry.registerNode(PaymentProcessingNodeDefinition, new PaymentProcessingNodeExecutor());
    
    // Analytics nodes
    this.nodeRegistry.registerNode(DataAnalyticsNodeDefinition, new DataAnalyticsNodeExecutor());

    this.logger.log(`Registered ${this.nodeRegistry.getRegisteredNodeNames().length} built-in nodes`);
  }

  getAvailableNodes() {
    return this.nodeRegistry.getAllNodeDefinitions();
  }

  getNodesByCategory(category: string) {
    return this.nodeRegistry.getNodesByGroup(category);
  }
}
