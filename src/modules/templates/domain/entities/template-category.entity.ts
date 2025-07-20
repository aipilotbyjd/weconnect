import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { WorkflowTemplate } from './workflow-template.entity';

@Schema({ collection: 'template_categories' })
@Tree('closure-table')
export class TemplateCategory extends BaseSchema {
  @Prop()
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ type: 'text', nullable: true })
  description?: string;

  @Prop({ nullable: true })
  icon?: string;

  @Prop({ nullable: true })
  color?: string;

  @Prop({ default: 0 })
  displayOrder: number;

  @Prop({ default: true })
  isActive: boolean;

  @TreeChildren()
  children: TemplateCategory[];

  @TreeParent()
  parent: TemplateCategory | null;

  @ManyToMany(() => WorkflowTemplate, (template) => template.categories)
  templates: WorkflowTemplate[];
}


export const TemplateCategorySchema = SchemaFactory.createForClass(TemplateCategory);