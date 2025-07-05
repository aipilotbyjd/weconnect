import {
  Entity,
  Column,
  ManyToMany,
  Tree,
  TreeChildren,
  TreeParent,
} from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { WorkflowTemplate } from './workflow-template.entity';

@Entity('template_categories')
@Tree('closure-table')
export class TemplateCategory extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ nullable: true })
  icon?: string;

  @Column({ nullable: true })
  color?: string;

  @Column({ default: 0 })
  displayOrder: number;

  @Column({ default: true })
  isActive: boolean;

  @TreeChildren()
  children: TemplateCategory[];

  @TreeParent()
  parent: TemplateCategory | null;

  @ManyToMany(() => WorkflowTemplate, (template) => template.categories)
  templates: WorkflowTemplate[];
}
