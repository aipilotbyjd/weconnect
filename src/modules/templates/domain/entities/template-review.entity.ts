import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { WorkflowTemplate } from './workflow-template.entity';
import { User } from '../../../auth/domain/entities/user.entity';

@Schema({ collection: 'template_reviews' })
@Unique(['template', 'reviewer']) // One review per user per template
export class TemplateReview extends BaseSchema {
  @ManyToOne(() => WorkflowTemplate, (template) => template.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  template: WorkflowTemplate;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  reviewer: User;

  @Prop({ type: 'int' })
  rating: number; // 1-5 stars

  @Prop({ type: 'text', nullable: true })
  comment?: string;

  @Prop({ default: false })
  isVerifiedPurchase: boolean;

  @Prop({ default: 0 })
  helpfulCount: number;

  @Prop({ default: 0 })
  unhelpfulCount: number;

  @Prop({ default: true })
  isVisible: boolean;

  @Prop({ nullable: true })
  moderatedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  moderatedBy?: User;

  @Prop({ type: 'text', nullable: true })
  moderationNote?: string;
}


export const TemplateReviewSchema = SchemaFactory.createForClass(TemplateReview);