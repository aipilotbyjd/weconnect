import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WorkflowNode } from '../../../domain/entities/workflow-node.entity';
import { NodeExecutor } from '../node-executor.interface';

export interface TrelloConfig {
  operation: 'createCard' | 'updateCard' | 'deleteCard' | 'moveCard' | 'addComment' | 'getCards' | 'getBoards' | 'getLists' | 'createList' | 'addMember' | 'addLabel';
  credentialId?: string;
  apiKey?: string;
  token?: string;
  // Board/List/Card IDs
  boardId?: string;
  listId?: string;
  cardId?: string;
  // Card fields
  name?: string;
  description?: string;
  due?: string;
  position?: string | number;
  // Member and label fields
  memberId?: string;
  labelId?: string;
  labelColor?: string;
  labelName?: string;
  // Comment fields
  text?: string;
  // Query parameters
  fields?: string;
  limit?: number;
}

@Injectable()
export class TrelloNodeExecutor implements NodeExecutor {
  private readonly logger = new Logger(TrelloNodeExecutor.name);

  constructor(private httpService: HttpService) {}

  async execute(
    node: WorkflowNode,
    inputData: Record<string, any>,
    executionId: string,
  ): Promise<Record<string, any>> {
    const config = node.configuration as TrelloConfig;
    this.logger.log(`Executing Trello operation: ${config.operation}`);

    try {
      const { apiKey, token } = await this.getCredentials(config, inputData);
      let result: any;

      switch (config.operation) {
        case 'createCard':
          result = await this.createCard(config, inputData, apiKey, token);
          break;
        case 'updateCard':
          result = await this.updateCard(config, inputData, apiKey, token);
          break;
        case 'deleteCard':
          result = await this.deleteCard(config, inputData, apiKey, token);
          break;
        case 'moveCard':
          result = await this.moveCard(config, inputData, apiKey, token);
          break;
        case 'addComment':
          result = await this.addComment(config, inputData, apiKey, token);
          break;
        case 'getCards':
          result = await this.getCards(config, inputData, apiKey, token);
          break;
        case 'getBoards':
          result = await this.getBoards(config, inputData, apiKey, token);
          break;
        case 'getLists':
          result = await this.getLists(config, inputData, apiKey, token);
          break;
        case 'createList':
          result = await this.createList(config, inputData, apiKey, token);
          break;
        case 'addMember':
          result = await this.addMember(config, inputData, apiKey, token);
          break;
        case 'addLabel':
          result = await this.addLabel(config, inputData, apiKey, token);
          break;
        default:
          throw new Error(`Unsupported Trello operation: ${config.operation}`);
      }

      return {
        ...inputData,
        trello: result,
        _trello: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error(`Trello operation failed: ${error.message}`);
      
      return {
        ...inputData,
        trello: null,
        trelloError: error.message,
        _trello: {
          nodeId: node.id,
          nodeName: node.name,
          operation: config.operation,
          error: error.message,
          timestamp: new Date().toISOString(),
        },
      };
    }
  }

  async validate(configuration: Record<string, any>): Promise<boolean> {
    const config = configuration as TrelloConfig;
    
    if (!config.operation) return false;
    if (!config.apiKey && !config.credentialId) return false;
    if (!config.token && !config.credentialId) return false;

    switch (config.operation) {
      case 'createCard':
        return !!(config.listId && config.name);
      case 'updateCard':
      case 'deleteCard':
      case 'moveCard':
      case 'addComment':
        return !!config.cardId;
      case 'getCards':
        return !!(config.boardId || config.listId);
      case 'getBoards':
        return true; // No specific validation needed
      case 'getLists':
        return !!config.boardId;
      case 'createList':
        return !!(config.boardId && config.name);
      case 'addMember':
        return !!(config.cardId && config.memberId);
      case 'addLabel':
        return !!config.cardId;
      default:
        return false;
    }
  }

  private async getCredentials(config: TrelloConfig, inputData: Record<string, any>): Promise<{ apiKey: string; token: string }> {
    let apiKey = config.apiKey;
    let token = config.token;

    if (apiKey) {
      apiKey = this.replaceVariables(apiKey, inputData);
    }

    if (token) {
      token = this.replaceVariables(token, inputData);
    }

    if (config.credentialId) {
      this.logger.warn('Using mock Trello credentials - implement credential management');
      return {
        apiKey: 'mock_trello_api_key',
        token: 'mock_trello_token',
      };
    }

    if (!apiKey || !token) {
      throw new Error('Trello API key and token are required');
    }

    return { apiKey, token };
  }

  private buildAuthParams(apiKey: string, token: string): string {
    return `key=${apiKey}&token=${token}`;
  }

  private async createCard(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const listId = this.replaceVariables(config.listId!, inputData);
    const name = this.replaceVariables(config.name!, inputData);
    const description = config.description ? this.replaceVariables(config.description, inputData) : '';

    const payload: any = {
      idList: listId,
      name,
      desc: description,
    };

    if (config.due) {
      payload.due = this.replaceVariables(config.due, inputData);
    }

    if (config.position) {
      payload.pos = config.position;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.trello.com/1/cards?${this.buildAuthParams(apiKey, token)}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.desc,
      shortUrl: response.data.shortUrl,
      url: response.data.url,
      listId: response.data.idList,
      boardId: response.data.idBoard,
      due: response.data.due,
      position: response.data.pos,
      dateLastActivity: response.data.dateLastActivity,
      status: 'created',
    };
  }

  private async updateCard(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);
    const payload: any = {};

    if (config.name) {
      payload.name = this.replaceVariables(config.name, inputData);
    }

    if (config.description) {
      payload.desc = this.replaceVariables(config.description, inputData);
    }

    if (config.due) {
      payload.due = this.replaceVariables(config.due, inputData);
    }

    if (config.position) {
      payload.pos = config.position;
    }

    const response = await lastValueFrom(
      this.httpService.put(
        `https://api.trello.com/1/cards/${cardId}?${this.buildAuthParams(apiKey, token)}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      description: response.data.desc,
      shortUrl: response.data.shortUrl,
      url: response.data.url,
      due: response.data.due,
      position: response.data.pos,
      dateLastActivity: response.data.dateLastActivity,
      status: 'updated',
    };
  }

  private async deleteCard(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);

    await lastValueFrom(
      this.httpService.delete(
        `https://api.trello.com/1/cards/${cardId}?${this.buildAuthParams(apiKey, token)}`,
      ),
    );

    return {
      cardId,
      status: 'deleted',
      timestamp: new Date().toISOString(),
    };
  }

  private async moveCard(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);
    const listId = this.replaceVariables(config.listId!, inputData);

    const payload: any = {
      idList: listId,
    };

    if (config.position) {
      payload.pos = config.position;
    }

    const response = await lastValueFrom(
      this.httpService.put(
        `https://api.trello.com/1/cards/${cardId}?${this.buildAuthParams(apiKey, token)}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      listId: response.data.idList,
      boardId: response.data.idBoard,
      position: response.data.pos,
      status: 'moved',
    };
  }

  private async addComment(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);
    const text = this.replaceVariables(config.text!, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.trello.com/1/cards/${cardId}/actions/comments?${this.buildAuthParams(apiKey, token)}`,
        { text },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      cardId,
      text: response.data.data.text,
      memberCreator: response.data.memberCreator.fullName,
      date: response.data.date,
      status: 'added',
    };
  }

  private async getCards(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    let url: string;
    
    if (config.listId) {
      const listId = this.replaceVariables(config.listId, inputData);
      url = `https://api.trello.com/1/lists/${listId}/cards`;
    } else if (config.boardId) {
      const boardId = this.replaceVariables(config.boardId, inputData);
      url = `https://api.trello.com/1/boards/${boardId}/cards`;
    } else {
      throw new Error('Either listId or boardId must be provided');
    }

    const queryParams = new URLSearchParams();
    if (config.fields) {
      queryParams.append('fields', config.fields);
    }
    if (config.limit) {
      queryParams.append('limit', config.limit.toString());
    }

    const response = await lastValueFrom(
      this.httpService.get(
        `${url}?${this.buildAuthParams(apiKey, token)}&${queryParams.toString()}`,
      ),
    );

    return {
      cards: response.data.map((card: any) => ({
        id: card.id,
        name: card.name,
        description: card.desc,
        shortUrl: card.shortUrl,
        url: card.url,
        listId: card.idList,
        boardId: card.idBoard,
        due: card.due,
        position: card.pos,
        dateLastActivity: card.dateLastActivity,
        labels: card.labels,
        members: card.members,
      })),
      totalCount: response.data.length,
    };
  }

  private async getBoards(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const queryParams = new URLSearchParams();
    if (config.fields) {
      queryParams.append('fields', config.fields);
    }

    const response = await lastValueFrom(
      this.httpService.get(
        `https://api.trello.com/1/members/me/boards?${this.buildAuthParams(apiKey, token)}&${queryParams.toString()}`,
      ),
    );

    return {
      boards: response.data.map((board: any) => ({
        id: board.id,
        name: board.name,
        description: board.desc,
        shortUrl: board.shortUrl,
        url: board.url,
        closed: board.closed,
        dateLastActivity: board.dateLastActivity,
        prefs: board.prefs,
      })),
      totalCount: response.data.length,
    };
  }

  private async getLists(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const boardId = this.replaceVariables(config.boardId!, inputData);

    const queryParams = new URLSearchParams();
    if (config.fields) {
      queryParams.append('fields', config.fields);
    }

    const response = await lastValueFrom(
      this.httpService.get(
        `https://api.trello.com/1/boards/${boardId}/lists?${this.buildAuthParams(apiKey, token)}&${queryParams.toString()}`,
      ),
    );

    return {
      lists: response.data.map((list: any) => ({
        id: list.id,
        name: list.name,
        closed: list.closed,
        position: list.pos,
        boardId: list.idBoard,
      })),
      totalCount: response.data.length,
    };
  }

  private async createList(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const boardId = this.replaceVariables(config.boardId!, inputData);
    const name = this.replaceVariables(config.name!, inputData);

    const payload: any = {
      name,
      idBoard: boardId,
    };

    if (config.position) {
      payload.pos = config.position;
    }

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.trello.com/1/lists?${this.buildAuthParams(apiKey, token)}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      id: response.data.id,
      name: response.data.name,
      closed: response.data.closed,
      position: response.data.pos,
      boardId: response.data.idBoard,
      status: 'created',
    };
  }

  private async addMember(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);
    const memberId = this.replaceVariables(config.memberId!, inputData);

    const response = await lastValueFrom(
      this.httpService.post(
        `https://api.trello.com/1/cards/${cardId}/idMembers?${this.buildAuthParams(apiKey, token)}`,
        { value: memberId },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      ),
    );

    return {
      cardId,
      memberId,
      members: response.data,
      status: 'added',
    };
  }

  private async addLabel(
    config: TrelloConfig,
    inputData: Record<string, any>,
    apiKey: string,
    token: string,
  ): Promise<any> {
    const cardId = this.replaceVariables(config.cardId!, inputData);

    if (config.labelId) {
      // Add existing label
      const labelId = this.replaceVariables(config.labelId, inputData);
      
      const response = await lastValueFrom(
        this.httpService.post(
          `https://api.trello.com/1/cards/${cardId}/idLabels?${this.buildAuthParams(apiKey, token)}`,
          { value: labelId },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        cardId,
        labelId,
        labels: response.data,
        status: 'added',
      };
    } else if (config.labelColor && config.labelName) {
      // Create and add new label
      const boardId = config.boardId ? this.replaceVariables(config.boardId, inputData) : null;
      
      if (!boardId) {
        throw new Error('boardId is required when creating a new label');
      }

      // First create the label
      const createLabelResponse = await lastValueFrom(
        this.httpService.post(
          `https://api.trello.com/1/labels?${this.buildAuthParams(apiKey, token)}`,
          {
            name: this.replaceVariables(config.labelName, inputData),
            color: config.labelColor,
            idBoard: boardId,
          },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      // Then add it to the card
      const labelId = createLabelResponse.data.id;
      const response = await lastValueFrom(
        this.httpService.post(
          `https://api.trello.com/1/cards/${cardId}/idLabels?${this.buildAuthParams(apiKey, token)}`,
          { value: labelId },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      return {
        cardId,
        labelId,
        labelName: createLabelResponse.data.name,
        labelColor: createLabelResponse.data.color,
        labels: response.data,
        status: 'created_and_added',
      };
    } else {
      throw new Error('Either labelId or both labelColor and labelName must be provided');
    }
  }

  private replaceVariables(str: string, data: Record<string, any>): string {
    return str.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;

      for (const k of keys) {
        value = value?.[k];
      }

      return value !== undefined ? String(value) : match;
    });
  }
}
