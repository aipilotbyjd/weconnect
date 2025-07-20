import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { BaseSchema } from '../../../../core/abstracts/base.schema';import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from '../../../organizations/domain/entities/organization.entity';
import { TemplateCategory } from './template-category.entity';
import { TemplateReview } from './template-review.entity';

export enum TemplateStatus {
  DRAFT = 'draft',
  PENDING_REVIEW = 'pending_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  ARCHIVED = 'archived',
}

export enum TemplateVisibility {
  PRIVATE = 'private',
  ORGANIZATION = 'organization',
  PUBLIC = 'public',
  MARKETPLACE = 'marketplace',
}

export enum TemplateTier {
  FREE = 'free',
  PREMIUM = 'premium',
  ENTERPRISE = 'enterprise',
}

@Schema({ collection: 'workflow_templates' })
export class WorkflowTemplate extends BaseSchema {
  @Prop()
  name: string;

  @Prop({ unique: true })
  slug: string;

  @Prop({ type: 'text' })
  description: string;

  @Prop({ type: 'text', nullable: true })
  longDescription?: string;

  @Prop({ type: 'json' })
  workflowDefinition: {
    nodes: any[];
    connections: any[];
    settings: Record<string, any>;
  };

  @Prop({ type: 'json', nullable: true })
  requiredCredentials?: {
    type: string;
    name: string;
    description: string;
  }[];

  @Prop({ type: 'json', nullable: true })
  variables?: {
    name: string;
    type: string;
    defaultValue?: any;
    required: boolean;
    description?: string;
  }[];

  @Prop({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Prop({
    type: 'enum',
    enum: TemplateVisibility,
    default: TemplateVisibility.PRIVATE,
  })
  visibility: TemplateVisibility;

  @Prop({
    type: 'enum',
    enum: TemplateTier,
    default: TemplateTier.FREE,
  })
  tier: TemplateTier;

  @Prop({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Prop({ nullable: true })
  iconUrl?: string;

  @Prop({ nullable: true })
  previewUrl?: string;

  @Prop({ type: 'json', nullable: true })
  screenshots?: string[];

  @Prop({ type: 'json' })
  tags: string[];

  @Prop({ type: 'json', nullable: true })
  metadata?: {
    version: string;
    author: string;
    website?: string;
    supportUrl?: string;
    documentationUrl?: string;
    videoUrl?: string;
  };

  @Prop({ default: 0 })
  usageCount: number;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ type: 'float', default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  reviewCount: number;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ default: false })
  isOfficial: boolean;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ nullable: true })
  rejectionReason?: string;

  @Prop({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn()
  creator: User;

  @Prop()
  creatorId: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn()
  organization?: Organization;

  @Prop({ nullable: true })
  organizationId?: string;

  @ManyToMany(() => TemplateCategory, (category) => category.templates)
  @JoinTable({
    name: 'template_categories_mapping',
    joinColumn: { name: 'templateId' },
    inverseJoinColumn: { name: 'categoryId' },
  })
  categories: TemplateCategory[];

  @OneToMany(() => TemplateReview, (review) => review.template)
  reviews: TemplateReview[];

  // Helper methods
  canBeUsedBy(userId: string, organizationId?: string): boolean {
    switch (this.visibility) {
      case TemplateVisibility.PRIVATE:
        return this.creatorId === userId;
      case TemplateVisibility.ORGANIZATION:
        return this.organizationId === organizationId;
      case TemplateVisibility.PUBLIC:
      case TemplateVisibility.MARKETPLACE:
        return true;
      default:
        return false;
    }
  }

  incrementUsage(): void {
    this.usageCount++;
  }

  incrementDownload(): void {
    this.downloadCount++;
  }

  incrementView(): void {
    this.viewCount++;
  }

  updateRating(newRating: number, newCount: number): void {
    const totalRating = this.averageRating * this.reviewCount + newRating;
    this.reviewCount = newCount;
    this.averageRating =
      this.reviewCount > 0 ? totalRating / this.reviewCount : 0;
  }
}


export const WorkflowTemplateSchema = SchemaFactory.createForClass(WorkflowTemplate);