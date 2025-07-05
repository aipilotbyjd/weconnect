import { Injectable } from '@nestjs/common';
import { NodeType } from '../../domain/entities/workflow-node.entity';
import { NodeExecutor } from './node-executor.interface';
import { TriggerNodeExecutor } from './executors/trigger-node.executor';
import { HttpRequestNodeExecutor } from './executors/http-request-node.executor';
import {
  ActionNodeExecutor,
  ConditionNodeExecutor,
  WebhookNodeExecutor,
  EmailNodeExecutor,
  DelayNodeExecutor,
} from './executors';
import { GmailNodeExecutor } from './executors/gmail-node.executor';
import { SlackNodeExecutor } from './executors/slack-node.executor';
import { DiscordNodeExecutor } from './executors/discord-node.executor';
import { TelegramNodeExecutor } from './executors/telegram-node.executor';
import { GitHubNodeExecutor } from './executors/github-node.executor';
import { GoogleSheetsNodeExecutor } from './executors/google-sheets-node.executor';
import { TrelloNodeExecutor } from './executors/trello-node.executor';

@Injectable()
export class NodeExecutorFactory {
  private executors: Map<NodeType, NodeExecutor>;

  constructor(
    private triggerExecutor: TriggerNodeExecutor,
    private actionExecutor: ActionNodeExecutor,
    private conditionExecutor: ConditionNodeExecutor,
    private webhookExecutor: WebhookNodeExecutor,
    private httpRequestExecutor: HttpRequestNodeExecutor,
    private emailExecutor: EmailNodeExecutor,
    private delayExecutor: DelayNodeExecutor,
    private gmailExecutor: GmailNodeExecutor,
    private slackExecutor: SlackNodeExecutor,
    private discordExecutor: DiscordNodeExecutor,
    private telegramExecutor: TelegramNodeExecutor,
    private githubExecutor: GitHubNodeExecutor,
    private googleSheetsExecutor: GoogleSheetsNodeExecutor,
    private trelloExecutor: TrelloNodeExecutor,
  ) {
    this.executors = new MapNodeType, NodeExecutor();
    this.executors.set(NodeType.TRIGGER, this.triggerExecutor);
    this.executors.set(NodeType.ACTION, this.actionExecutor);
    this.executors.set(NodeType.CONDITION, this.conditionExecutor);
    this.executors.set(NodeType.WEBHOOK, this.webhookExecutor);
    this.executors.set(NodeType.HTTP_REQUEST, this.httpRequestExecutor);
    this.executors.set(NodeType.EMAIL, this.emailExecutor);
    this.executors.set(NodeType.DELAY, this.delayExecutor);
    this.executors.set(NodeType.GMAIL, this.gmailExecutor);
    this.executors.set(NodeType.SLACK, this.slackExecutor);
    this.executors.set(NodeType.DISCORD, this.discordExecutor);
    this.executors.set(NodeType.TELEGRAM, this.telegramExecutor);
    this.executors.set(NodeType.GITHUB, this.githubExecutor);
    this.executors.set(NodeType.GOOGLE_SHEETS, this.googleSheetsExecutor);
    this.executors.set(NodeType.TRELLO, this.trelloExecutor);
  }

  getExecutor(nodeType: NodeType): NodeExecutor {
    const executor = this.executors.get(nodeType);
    if (!executor) {
      throw new Error(`No executor found for node type: ${nodeType}`);
    }
    return executor;
  }
}
