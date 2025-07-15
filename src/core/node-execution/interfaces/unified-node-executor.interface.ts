import { WorkflowNode } from '../../../modules/workflows/domain/entities/workflow-node.entity';

export interface NodeExecutionContext {
    // Core execution context
    nodeId: string;
    workflowId: string;
    executionId: string;
    organizationId: string;
    userId: string;

    // Node configuration and data
    node: WorkflowNode;
    inputData: any[];
    parameters: Record<string, any>;
    credentials?: Record<string, any>;

    // Workflow context
    previousNodeOutputs: Record<string, any>;
    workflowVariables: Record<string, any>;

    // Execution metadata
    metadata?: Record<string, any>;
    retryCount?: number;
    isRetry?: boolean;
}

export interface NodeExecutionResult {
    success: boolean;
    data?: any[];
    outputData?: any;
    error?: string;
    errorMessage?: string;

    // Multiple outputs support (for conditional nodes)
    outputs?: Record<string, any[]>;

    // Execution metadata
    logs?: string[];
    metadata?: {
        executionTime?: number;
        itemsProcessed?: number;
        apiCallsUsed?: number;
        [key: string]: any;
    };

    // Flow control
    shouldContinue?: boolean;
    nextNodes?: string[];

    // Retry configuration
    shouldRetry?: boolean;
    retryAfter?: number; // seconds
}

export interface NodeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}

export interface NodeSchema {
    name: string;
    displayName: string;
    description: string;
    version: number;
    group: string[];
    icon?: string;
    color?: string;

    // Input/Output configuration
    inputs: string[];
    outputs: string[];

    // Credentials required
    credentials?: {
        name: string;
        required: boolean;
        displayName?: string;
    }[];

    // Node properties/parameters
    properties: NodeProperty[];

    // Resource requirements
    resources?: {
        memoryMB?: number;
        timeoutSeconds?: number;
        rateLimitPerMinute?: number;
    };
}

export interface NodeProperty {
    name: string;
    displayName: string;
    type: 'string' | 'number' | 'boolean' | 'options' | 'json' | 'multiOptions' | 'dateTime' | 'color';
    required?: boolean;
    default?: any;
    placeholder?: string;
    description?: string;
    options?: { name: string; value: any }[];
    multipleValues?: boolean;
    displayOptions?: {
        show?: Record<string, any[]>;
        hide?: Record<string, any[]>;
    };
}

export interface IUnifiedNodeExecutor {
    /**
     * Execute the node with given context
     */
    execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;

    /**
     * Validate node configuration
     */
    validate(configuration: Record<string, any>): NodeValidationResult;

    /**
     * Get node schema/definition
     */
    getSchema(): NodeSchema;

    /**
     * Test connection/credentials (optional)
     */
    testConnection?(credentials: Record<string, any>): Promise<boolean>;

    /**
     * Get available options dynamically (e.g., list of channels, databases, etc.)
     */
    getOptions?(
        optionName: string,
        credentials: Record<string, any>,
        parameters: Record<string, any>
    ): Promise<{ name: string; value: any }[]>;
}

export abstract class BaseUnifiedNodeExecutor implements IUnifiedNodeExecutor {
    abstract execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;
    abstract getSchema(): NodeSchema;

    validate(configuration: Record<string, any>): NodeValidationResult {
        const schema = this.getSchema();
        const errors: string[] = [];

        // Validate required properties
        for (const property of schema.properties) {
            if (property.required && !configuration[property.name]) {
                errors.push(`${property.displayName} is required`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }

    protected createSuccessResult(
        outputData: any,
        metadata?: Record<string, any>
    ): NodeExecutionResult {
        return {
            success: true,
            data: Array.isArray(outputData) ? outputData : [outputData],
            outputData,
            metadata,
            shouldContinue: true,
        };
    }

    protected createErrorResult(
        errorMessage: string,
        shouldRetry: boolean = false,
        retryAfter?: number
    ): NodeExecutionResult {
        return {
            success: false,
            errorMessage,
            shouldContinue: false,
            shouldRetry,
            retryAfter,
        };
    }

    protected replaceVariables(str: string, context: NodeExecutionContext): string {
        if (typeof str !== 'string') return str;

        return str.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
            try {
                const trimmed = expression.trim();

                // Handle simple variable access
                if (trimmed.startsWith('$input.')) {
                    const path = trimmed.substring(7); // Remove '$input.'
                    return this.getNestedValue(context.inputData[0], path) || match;
                }

                if (trimmed.startsWith('$node.')) {
                    const path = trimmed.substring(6); // Remove '$node.'
                    return this.getNestedValue(context.previousNodeOutputs, path) || match;
                }

                if (trimmed.startsWith('$vars.')) {
                    const path = trimmed.substring(6); // Remove '$vars.'
                    return this.getNestedValue(context.workflowVariables, path) || match;
                }

                // Direct parameter access
                return this.getNestedValue(context.parameters, trimmed) || match;
            } catch (error) {
                return match;
            }
        });
    }

    private getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    protected async makeHttpRequest(
        url: string,
        options: {
            method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
            headers?: Record<string, string>;
            data?: any;
            timeout?: number;
        } = {}
    ): Promise<any> {
        // This would use your HTTP service
        // For now, returning a placeholder
        throw new Error('HTTP request method not implemented in base class');
    }
}