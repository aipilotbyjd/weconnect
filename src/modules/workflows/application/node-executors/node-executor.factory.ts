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
  ) {
    this.executors = new Map([
      [NodeType.TRIGGER, this.triggerExecutor],
      [NodeType.ACTION, this.actionExecutor],
      [NodeType.CONDITION, this.conditionExecutor],
      [NodeType.WEBHOOK, this.webhookExecutor],
      [NodeType.HTTP_REQUEST, this.httpRequestExecutor],
      [NodeType.EMAIL, this.emailExecutor],
      [NodeType.DELAY, this.delayExecutor],
    ]);
  }

  getExecutor(nodeType: NodeType): NodeExecutor {
    const executor = this.executors.get(nodeType);
    if (!executor) {
      throw new Error(`No executor found for node type: ${nodeType}`);
    }
    return executor;
  }
}
