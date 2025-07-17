import { NodeDefinition } from '../../../domain/entities/node-definition.entity';
import {
  INodeExecutor,
  NodeExecutionContext,
  NodeExecutionResult,
} from '../../../../../core/abstracts/base-node.interface';

export const TrelloNodeDefinition = new NodeDefinition({
  name: 'Trello',
  displayName: 'Trello',
  description: 'Interacts with Trello boards',
  version: 1,
  group: ['productivity'],
  icon: 'fa:trello',
  defaults: {
    name: 'Trello',
    color: '#026AA7',
  },
  inputs: ['main'],
  outputs: ['main'],
  credentials: [
    {
      name: 'trelloApi',
      required: true,
    },
  ],
  properties: [
    {
      name: 'operation',
      displayName: 'Operation',
      type: 'options',
      options: [
        { name: 'Create Card', value: 'createCard' },
        { name: 'Get Board', value: 'getBoard' },
        { name: 'List Boards', value: 'listBoards' },
      ],
      default: 'createCard',
      required: true,
    },
    {
      name: 'boardId',
      displayName: 'Board ID',
      type: 'string',
      required: true,
      placeholder: 'Enter board ID',
    },
    {
      name: 'listId',
      displayName: 'List ID',
      type: 'string',
      required: false,
      placeholder: 'Enter list ID (if creating card)',
    },
    {
      name: 'cardName',
      displayName: 'Card Name',
      type: 'string',
      required: false,
      placeholder: 'Enter card name',
    },
    {
      name: 'cardDesc',
      displayName: 'Card Description',
      type: 'string',
      required: false,
      placeholder: 'Enter card description',
    },
  ],
});

export class TrelloNodeExecutor implements INodeExecutor {
  async execute(context: NodeExecutionContext): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      const { operation, boardId, listId, cardName, cardDesc } =
        context.parameters;

      // Simulate Trello API integration
      // In a real implementation, you would use Trello API client

      if (operation === 'createCard') {
        if (!boardId || !listId || !cardName) {
          throw new Error(
            'Board ID, List ID, and Card Name are required for creating card',
          );
        }

        const cardData = {
          id: `card_${Date.now()}`,
          name: cardName,
          desc: cardDesc || '',
          boardId,
          listId,
          createdAt: new Date().toISOString(),
          status: 'created',
        };

        return {
          success: true,
          data: [cardData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'createCard',
          },
        };
      } else if (operation === 'getBoard') {
        // Simulate getting board
        const boardData = {
          id: boardId,
          name: 'Sample Board',
          description: 'A sample Trello board',
          createdAt: new Date().toISOString(),
        };

        return {
          success: true,
          data: [boardData],
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: 1,
            operation: 'getBoard',
          },
        };
      } else if (operation === 'listBoards') {
        // Simulate listing boards
        const boardsList = [
          {
            id: 'board_001',
            name: 'Board 1',
            description: 'First board',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'board_002',
            name: 'Board 2',
            description: 'Second board',
            createdAt: new Date().toISOString(),
          },
        ];

        return {
          success: true,
          data: boardsList,
          metadata: {
            executionTime: Date.now() - startTime,
            itemsProcessed: boardsList.length,
            operation: 'listBoards',
          },
        };
      }

      throw new Error(`Unknown operation: ${operation}`);
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          executionTime: Date.now() - startTime,
        },
      };
    }
  }

  validate(configuration: Record<string, any>): boolean {
    // Basic validation - override in specific implementations
    return true;
  }

  getConfigurationSchema(): any {
    return {
      type: 'object',
      properties: {},
      required: [],
    };
  }
}
