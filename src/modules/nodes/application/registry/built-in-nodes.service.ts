import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { NodeRegistryService } from './node-registry.service';

// Core nodes
import { StartNodeDefinition, StartNodeExecutor } from '../../infrastructure/built-in/core/start.node';
import { HttpRequestNodeDefinition, HttpRequestNodeExecutor } from '../../infrastructure/built-in/core/http-request.node';
import { SetNodeDefinition, SetNodeExecutor } from '../../infrastructure/built-in/core/set.node';
import { IfNodeDefinition, IfNodeExecutor } from '../../infrastructure/built-in/core/if.node';
import { FunctionNodeDefinition, FunctionNodeExecutor } from '../../infrastructure/built-in/core/function.node';

// Integration nodes
import { GmailNodeDefinition, GmailNodeExecutor } from '../../infrastructure/built-in/integrations/gmail.node';
import { SlackNodeDefinition, SlackNodeExecutor } from '../../infrastructure/built-in/integrations/slack.node';

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

    // Register integration nodes
    this.nodeRegistry.registerNode(GmailNodeDefinition, new GmailNodeExecutor());
    this.nodeRegistry.registerNode(SlackNodeDefinition, new SlackNodeExecutor());

    this.logger.log(`Registered ${this.nodeRegistry.getRegisteredNodeNames().length} built-in nodes`);
  }

  getAvailableNodes() {
    return this.nodeRegistry.getAllNodeDefinitions();
  }

  getNodesByCategory(category: string) {
    return this.nodeRegistry.getNodesByGroup(category);
  }
}
