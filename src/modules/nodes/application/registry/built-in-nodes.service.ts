import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NodeRegistryService } from './node-registry.service';

// Core nodes
import { StartNodeDefinition, StartNodeExecutor } from '../../infrastructure/built-in/core/start.node';
import { HttpRequestNodeDefinition, HttpRequestNodeExecutor } from '../../infrastructure/built-in/core/http-request.node';
import { SetNodeDefinition, SetNodeExecutor } from '../../infrastructure/built-in/core/set.node';
import { IfNodeDefinition, IfNodeExecutor } from '../../infrastructure/built-in/core/if.node';
import { FunctionNodeDefinition, FunctionNodeExecutor } from '../../infrastructure/built-in/core/function.node';
import { ScheduledTriggerNodeDefinition, ScheduledTriggerNodeExecutor } from '../../infrastructure/built-in/core/scheduled-trigger.node';

// Integration nodes
import { GmailNodeDefinition, GmailNodeExecutor } from '../../infrastructure/built-in/integrations/gmail.node';
import { GmailAdvancedNodeDefinition, GmailAdvancedNodeExecutor } from '../../infrastructure/built-in/integrations/gmail-advanced.node';
import { GoogleCalendarNodeDefinition, GoogleCalendarNodeExecutor } from '../../infrastructure/built-in/integrations/google-calendar.node';
import { GoogleDocsNodeDefinition, GoogleDocsNodeExecutor } from '../../infrastructure/built-in/integrations/google-docs.node';
import { GoogleDriveNodeDefinition, GoogleDriveNodeExecutor } from '../../infrastructure/built-in/integrations/google-drive.node';
import { GoogleSheetsNodeDefinition, GoogleSheetsNodeExecutor } from '../../infrastructure/built-in/integrations/google-sheets.node';
import { SlackNodeDefinition, SlackNodeExecutor } from '../../infrastructure/built-in/integrations/slack.node';
import { DiscordNodeDefinition, DiscordNodeExecutor } from '../../infrastructure/built-in/integrations/discord.node';
import { TrelloNodeDefinition, TrelloNodeExecutor } from '../../infrastructure/built-in/integrations/trello.node';
import { GitHubNodeDefinition, GitHubNodeExecutor } from '../../infrastructure/built-in/integrations/github.node';
import { TelegramNodeDefinition, TelegramNodeExecutor } from '../../infrastructure/built-in/integrations/telegram.node';

@Injectable()
export class BuiltInNodesService implements OnModuleInit {
  private readonly logger = new Logger(BuiltInNodesService.name);

  constructor(private readonly nodeRegistry: NodeRegistryService) {}

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

    this.logger.log(`Registered ${this.nodeRegistry.getRegisteredNodeNames().length} built-in nodes`);
  }

  getAvailableNodes() {
    return this.nodeRegistry.getAllNodeDefinitions();
  }

  getNodesByCategory(category: string) {
    return this.nodeRegistry.getNodesByGroup(category);
  }
}
