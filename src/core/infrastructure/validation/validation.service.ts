import { Injectable, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

@Injectable()
export class ValidationService {
  /**
   * Validates a data transfer object using class-validator
   */
  async validateDto<T extends object>(
    dtoClass: new () => T,
    data: any,
  ): Promise<ValidationResult> {
    const dto = plainToClass(dtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      return {
        isValid: false,
        errors: this.formatValidationErrors(errors),
      };
    }

    return {
      isValid: true,
      errors: [],
    };
  }

  /**
   * Validates and throws BadRequestException if validation fails
   */
  async validateDtoOrThrow<T extends object>(
    dtoClass: new () => T,
    data: any,
  ): Promise<T> {
    const dto = plainToClass(dtoClass, data);
    const errors = await validate(dto);

    if (errors.length > 0) {
      const errorMessages = this.formatValidationErrors(errors);
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return dto;
  }

  /**
   * Validates workflow node configuration
   */
  validateNodeConfiguration(
    nodeType: string,
    configuration: Record<string, any>,
    schema?: Record<string, any>,
  ): ValidationResult {
    if (!configuration) {
      return {
        isValid: false,
        errors: ['Configuration is required'],
      };
    }

    const errors: string[] = [];

    // Basic validation
    if (typeof configuration !== 'object') {
      errors.push('Configuration must be an object');
    }

    // Schema-based validation if provided
    if (schema) {
      const schemaErrors = this.validateAgainstSchema(configuration, schema);
      errors.push(...schemaErrors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates JSON schema
   */
  validateJsonSchema(data: any, schema: Record<string, any>): ValidationResult {
    const errors = this.validateAgainstSchema(data, schema);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validates workflow structure
   */
  validateWorkflowStructure(workflow: any): ValidationResult {
    const errors: string[] = [];

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow must have nodes array');
    }

    if (!workflow.connections || !Array.isArray(workflow.connections)) {
      errors.push('Workflow must have connections array');
    }

    // Check for orphaned nodes (except trigger nodes)
    if (workflow.nodes && workflow.connections) {
      const connectedNodeIds = new Set();
      workflow.connections.forEach((conn: any) => {
        connectedNodeIds.add(conn.targetNodeId);
        connectedNodeIds.add(conn.sourceNodeId);
      });

      const triggerNodes = workflow.nodes.filter(
        (node: any) => node.type === 'trigger' || node.category === 'trigger',
      );

      const orphanedNodes = workflow.nodes.filter(
        (node: any) =>
          !connectedNodeIds.has(node.id) &&
          !triggerNodes.some((trigger: any) => trigger.id === node.id),
      );

      if (orphanedNodes.length > 0) {
        errors.push(
          `Orphaned nodes detected: ${orphanedNodes.map((n: any) => n.name).join(', ')}`,
        );
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private formatValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];

    errors.forEach((error) => {
      if (error.constraints) {
        Object.values(error.constraints).forEach((message) => {
          messages.push(message);
        });
      }

      if (error.children && error.children.length > 0) {
        messages.push(...this.formatValidationErrors(error.children));
      }
    });

    return messages;
  }

  private validateAgainstSchema(
    data: any,
    schema: Record<string, any>,
  ): string[] {
    const errors: string[] = [];

    // Basic schema validation implementation
    // In a real application, you might want to use a library like Joi or AJV

    if (schema.required && Array.isArray(schema.required)) {
      schema.required.forEach((field: string) => {
        if (
          !(field in data) ||
          data[field] === undefined ||
          data[field] === null
        ) {
          errors.push(`Field '${field}' is required`);
        }
      });
    }

    if (schema.properties) {
      Object.keys(schema.properties).forEach((field) => {
        const fieldSchema = schema.properties[field];
        const fieldValue = data[field];

        if (fieldValue !== undefined && fieldSchema.type) {
          const actualType = Array.isArray(fieldValue)
            ? 'array'
            : typeof fieldValue;
          if (actualType !== fieldSchema.type) {
            errors.push(`Field '${field}' must be of type ${fieldSchema.type}`);
          }
        }
      });
    }

    return errors;
  }
}
