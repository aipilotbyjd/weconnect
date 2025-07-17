import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowVariable,
  VariableType,
  VariableScope,
} from '../../domain/entities/workflow-variable.entity';
import { EncryptionService } from '../../../credentials/application/services/encryption.service';

@Injectable()
export class WorkflowVariablesService {
  constructor(
    @InjectRepository(WorkflowVariable)
    private variableRepository: Repository<WorkflowVariable>,
    private encryptionService: EncryptionService,
  ) {}

  async createVariable(data: {
    name: string;
    value: string;
    type: VariableType;
    scope: VariableScope;
    description?: string;
    workflowId?: string;
    userId: string;
    organizationId?: string;
  }): Promise<WorkflowVariable> {
    // Check if variable already exists
    const existing = await this.variableRepository.findOne({
      where: {
        name: data.name,
        workflowId: data.workflowId,
        scope: data.scope,
        organizationId: data.organizationId,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Variable with this name already exists in this scope',
      );
    }

    // Encrypt value if it's a secret
    let value = data.value;
    if (data.type === VariableType.SECRET) {
      value = await this.encryptionService.encrypt(data.value);
    }

    const variable = await this.variableRepository.save({
      ...data,
      value,
      isSecret: data.type === VariableType.SECRET,
    });

    // Don't return encrypted value
    if (variable.isSecret) {
      variable.value = '***';
    }

    return variable;
  }

  async updateVariable(
    id: string,
    userId: string,
    data: Partial<{
      value: string;
      description: string;
      type: VariableType;
    }>,
  ): Promise<WorkflowVariable> {
    const variable = await this.variableRepository.findOne({
      where: { id, userId },
    });

    if (!variable) {
      throw new NotFoundException('Variable not found');
    }

    if (variable.isSystem) {
      throw new ForbiddenException('Cannot update system variables');
    }

    // Encrypt new value if it's a secret
    if (data.value !== undefined && variable.type === VariableType.SECRET) {
      data.value = await this.encryptionService.encrypt(data.value);
    }

    Object.assign(variable, data);
    const updated = await this.variableRepository.save(variable);

    // Don't return encrypted value
    if (updated.isSecret) {
      updated.value = '***';
    }

    return updated;
  }

  async deleteVariable(id: string, userId: string): Promise<void> {
    const variable = await this.variableRepository.findOne({
      where: { id, userId },
    });

    if (!variable) {
      throw new NotFoundException('Variable not found');
    }

    if (variable.isSystem) {
      throw new ForbiddenException('Cannot delete system variables');
    }

    await this.variableRepository.delete(id);
  }

  async getVariables(options: {
    workflowId?: string;
    scope?: VariableScope;
    userId: string;
    organizationId?: string;
  }): Promise<WorkflowVariable[]> {
    const query = this.variableRepository.createQueryBuilder('variable');

    if (options.workflowId) {
      query.andWhere('variable.workflowId = :workflowId', {
        workflowId: options.workflowId,
      });
    }

    if (options.scope) {
      query.andWhere('variable.scope = :scope', { scope: options.scope });
    }

    query.andWhere(
      '(variable.userId = :userId OR variable.scope IN (:...publicScopes))',
      {
        userId: options.userId,
        publicScopes: [VariableScope.GLOBAL, VariableScope.ORGANIZATION],
      },
    );

    if (options.organizationId) {
      query.andWhere(
        '(variable.organizationId = :organizationId OR variable.organizationId IS NULL)',
        {
          organizationId: options.organizationId,
        },
      );
    }

    const variables = await query.getMany();

    // Hide secret values
    return variables.map((v) => {
      if (v.isSecret) {
        v.value = '***';
      }
      return v;
    });
  }

  async resolveVariables(
    text: string,
    context: {
      workflowId?: string;
      userId: string;
      organizationId?: string;
      executionData?: Record<string, any>;
    },
  ): Promise<string> {
    // Find all variable references {{variableName}}
    const variablePattern = /\{\{([^}]+)\}\}/g;
    const matches = text.matchAll(variablePattern);

    let resolvedText = text;

    for (const match of matches) {
      const variablePath = match[1].trim();
      const value = await this.resolveVariable(variablePath, context);

      if (value !== undefined) {
        resolvedText = resolvedText.replace(match[0], String(value));
      }
    }

    return resolvedText;
  }

  private async resolveVariable(
    path: string,
    context: {
      workflowId?: string;
      userId: string;
      organizationId?: string;
      executionData?: Record<string, any>;
    },
  ): Promise<any> {
    const parts = path.split('.');
    const variableName = parts[0];

    // Check execution data first
    if (context.executionData && variableName in context.executionData) {
      return this.getNestedValue(context.executionData, parts);
    }

    // Check environment variables
    if (variableName === 'env') {
      return this.getNestedValue(process.env, parts.slice(1));
    }

    // Check workflow/global variables
    const variable = await this.variableRepository.findOne({
      where: [
        { name: variableName, workflowId: context.workflowId },
        {
          name: variableName,
          scope: VariableScope.ORGANIZATION,
          organizationId: context.organizationId,
        },
        { name: variableName, scope: VariableScope.GLOBAL },
      ],
      order: {
        scope: 'ASC', // Prefer workflow > organization > global
      },
    });

    if (!variable) {
      return undefined;
    }

    // Decrypt secret values
    let value = variable.value;
    if (variable.isSecret) {
      value = await this.encryptionService.decrypt(value);
    }

    // Parse JSON values
    if (variable.type === VariableType.JSON) {
      try {
        value = JSON.parse(value);
      } catch {
        // Invalid JSON, return as string
      }
    }

    // Convert to appropriate type
    if (variable.type === VariableType.NUMBER) {
      return parts.length > 1
        ? this.getNestedValue(Number(value), parts.slice(1))
        : Number(value);
    } else if (variable.type === VariableType.BOOLEAN) {
      const boolValue = value === 'true' || value === '1';
      return parts.length > 1
        ? this.getNestedValue(boolValue, parts.slice(1))
        : boolValue;
    }

    return parts.length > 1
      ? this.getNestedValue(value, parts.slice(1))
      : value;
  }

  private getNestedValue(obj: any, path: string[]): any {
    return path.reduce((current, key) => current?.[key], obj);
  }

  async createSystemVariables(
    userId: string,
    organizationId?: string,
  ): Promise<void> {
    const systemVariables = [
      {
        name: 'WORKFLOW_URL',
        value: process.env.APP_URL || 'http://localhost:3000',
        type: VariableType.STRING,
        scope: VariableScope.GLOBAL,
        description: 'Base URL of the WeConnect application',
        isSystem: true,
      },
      {
        name: 'EXECUTION_TIMEOUT',
        value: '300000', // 5 minutes
        type: VariableType.NUMBER,
        scope: VariableScope.GLOBAL,
        description: 'Default execution timeout in milliseconds',
        isSystem: true,
      },
    ];

    for (const variable of systemVariables) {
      const existing = await this.variableRepository.findOne({
        where: { name: variable.name, scope: variable.scope },
      });

      if (!existing) {
        await this.variableRepository.save({
          ...variable,
          userId,
          organizationId,
        });
      }
    }
  }
}
