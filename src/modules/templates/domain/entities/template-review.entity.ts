import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { WorkflowTemplate } from './workflow-template.entity';
import { User } from '../../../auth/domain/entities/user.entity';

@Entity('template_reviews')
@Unique(['template', 'reviewer']) // One review per user per template
@Index(['template', 'createdAt'])
export class TemplateReview extends BaseEntity {
  @ManyToOne(() => WorkflowTemplate, (template) => template.reviews, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  template: WorkflowTemplate;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  reviewer: User;

  @Column({ type: 'int' })
  @Index()
  rating: number; // 1-5 stars

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ default: false })
  isVerifiedPurchase: boolean;

  @Column({ default: 0 })
  helpfulCount: number;

  @Column({ default: 0 })
  unhelpfulCount: number;

  @Column({ default: true })
  isVisible: boolean;

  @Column({ nullable: true })
  moderatedAt?: Date;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  moderatedBy?: User;

  @Column({ type: 'text', nullable: true })
  moderationNote?: string;
}
