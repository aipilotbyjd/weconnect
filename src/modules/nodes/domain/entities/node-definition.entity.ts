import { Entity, Column } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';

export interface NodeProperty {
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

@Entity('node_definitions')
export class NodeDefinition extends BaseEntity {
  @Column()
  name: string;

  @Column()
  displayName: string;

  @Column()
  description: string;

  @Column()
  declare version: number;

  @Column('simple-array')
  group: string[];

  @Column()
  icon: string;

  @Column('json')
  defaults: {
    name: string;
    color: string;
  };

  @Column('simple-array')
  inputs: string[];

  @Column('simple-array')
  outputs: string[];

  @Column('json', { nullable: true })
  credentials?: NodeCredential[];

  @Column('json')
  properties: NodeProperty[];

  @Column({ nullable: true })
  subtitle?: string;

  @Column({ default: false })
  isCustom: boolean;

  @Column({ nullable: true })
  packageName?: string;

  @Column({ nullable: true })
  packageVersion?: string;

  @Column({ default: true })
  isActive: boolean;

  constructor(partial: Partial<NodeDefinition> = {}) {
    super();
    Object.assign(this, partial);
  }
}
