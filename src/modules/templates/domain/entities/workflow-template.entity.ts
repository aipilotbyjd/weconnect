import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { User } from '../../../auth/domain/entities/user.entity';
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

@Entity('workflow_templates')
export class WorkflowTemplate extends BaseEntity {
  @Column()
  name: string;

  @Column({ unique: true })
  slug: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text', nullable: true })
  longDescription?: string;

  @Column({ type: 'json' })
  workflowDefinition: {
    nodes: any[];
    connections: any[];
    settings: Record<string, any>;
  };

  @Column({ type: 'json', nullable: true })
  requiredCredentials?: {
    type: string;
    name: string;
    description: string;
  }[];

  @Column({ type: 'json', nullable: true })
  variables?: {
    name: string;
    type: string;
    defaultValue?: any;
    required: boolean;
    description?: string;
  }[];

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
  })
  status: TemplateStatus;

  @Column({
    type: 'enum',
    enum: TemplateVisibility,
    default: TemplateVisibility.PRIVATE,
  })
  visibility: TemplateVisibility;

  @Column({
    type: 'enum',
    enum: TemplateTier,
    default: TemplateTier.FREE,
  })
  tier: TemplateTier;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  price: number;

  @Column({ nullable: true })
  iconUrl?: string;

  @Column({ nullable: true })
  previewUrl?: string;

  @Column({ type: 'json', nullable: true })
  screenshots?: string[];

  @Column({ type: 'json' })
  tags: string[];

  @Column({ type: 'json', nullable: true })
  metadata?: {
    version: string;
    author: string;
    website?: string;
    supportUrl?: string;
    documentationUrl?: string;
    videoUrl?: string;
  };

  @Column({ default: 0 })
  usageCount: number;

  @Column({ default: 0 })
  downloadCount: number;

  @Column({ default: 0 })
  viewCount: number;

  @Column({ type: 'float', default: 0 })
  averageRating: number;

  @Column({ default: 0 })
  reviewCount: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ default: false })
  isOfficial: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp', nullable: true })
  publishedAt?: Date;

  // Relations
  @ManyToOne(() => User)
  @JoinColumn()
  creator: User;

  @Column()
  creatorId: string;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn()
  organization?: Organization;

  @Column({ nullable: true })
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
