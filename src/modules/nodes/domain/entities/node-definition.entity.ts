export interface NodeProperty {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'collection' | 'json';
  required?: boolean;
  default?: any;
  description?: string;
  options?: Array<{ name: string; value: any }> | NodeProperty[];
  placeholder?: string;
  typeOptions?: {
    multipleValues?: boolean;
    loadOptionsMethod?: string;
  };
}

export interface NodeCredential {
  name: string;
  required?: boolean;
  displayOptions?: {
    show?: Record<string, any>;
    hide?: Record<string, any>;
  };
}

export class NodeDefinition {
  name: string;
  displayName: string;
  description: string;
  version: number;
  group: string[];
  icon: string;
  defaults: {
    name: string;
    color: string;
  };
  inputs: string[];
  outputs: string[];
  credentials?: NodeCredential[];
  properties: NodeProperty[];
  subtitle?: string;

  constructor(partial: Partial<NodeDefinition>) {
    Object.assign(this, partial);
  }
}
