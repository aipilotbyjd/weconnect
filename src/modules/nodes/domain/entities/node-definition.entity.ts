import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';export interface NodeProperty {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'options' | 'collection' | 'json';
  required?: boolean;
  default?: any;
  description?: string;
  options?: Array<{ name: string; value: any }> | NodeProperty[];
  placeholder?: string;
  displayOptions?: {
    show?: Record<string, any>;
    hide?: Record<string, any>;
  };
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

@Schema({ collection: 'node_definitions' })
export class NodeDefinition extends BaseSchema {
  @Prop()
  name: string;

  @Prop()
  displayName: string;

  @Prop()
  description: string;

  @Prop()
  declare version: number;

  @Prop('simple-array')
  group: string[];

  @Prop()
  icon: string;

  @Prop('json')
  defaults: {
    name: string;
    color: string;
  };

  @Prop('simple-array')
  inputs: string[];

  @Prop('simple-array')
  outputs: string[];

  @Prop('json', { nullable: true })
  credentials?: NodeCredential[];

  @Prop('json')
  properties: NodeProperty[];

  @Prop({ nullable: true })
  subtitle?: string;

  @Prop({ default: false })
  isCustom: boolean;

  @Prop({ nullable: true })
  packageName?: string;

  @Prop({ nullable: true })
  packageVersion?: string;

  @Prop({ default: true })
  isActive: boolean;

  constructor(partial: Partial<NodeDefinition> = {}) {
    super();
    Object.assign(this, partial);
  }
}


export const NodeDefinitionSchema = SchemaFactory.createForClass(NodeDefinition);