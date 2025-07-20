import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { BaseEntity } from '../../../../core/abstracts/base.entity';

export enum OrganizationPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export interface PlanLimits {
  maxWorkflows: number;
  maxExecutionsPerMonth: number;
  maxTeamMembers: number;
  maxCredentials: number;
  maxWorkflowComplexity: number;
  retentionDays: number;
  customDomains: boolean;
  ssoEnabled: boolean;
  apiAccess: boolean;
  prioritySupport: boolean;
}

@Entity('organizations')
@Index(['slug'], { unique: true })
export class Organization extends BaseEntity {

  @Column()
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true })
  logo?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({
    type: 'enum',
    enum: OrganizationPlan,
    default: OrganizationPlan.FREE,
  })
  plan: OrganizationPlan;

  @Column({ nullable: true })
  planLimits: PlanLimits;

  @Column({ nullable: true })
  customSettings?: Record<string, any>;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  stripeCustomerId?: string;

  @Column({ nullable: true })
  stripeSubscriptionId?: string;

  @Column({ nullable: true })
  trialEndsAt?: Date;

  @Column({ default: 0 })
  currentMonthExecutions: number;

  @Column({ nullable: true })
  executionResetDate?: Date;

  // Store related entity IDs as arrays
  @ApiProperty({
    description: 'Organization member IDs',
  })
  @Column({ type: 'array', default: [] })
  memberIds: string[];

  @ApiProperty({
    description: 'Organization workflow IDs',
  })
  @Column({ type: 'array', default: [] })
  workflowIds: string[];

  @ApiProperty({
    description: 'Organization credential IDs',
  })
  @Column({ type: 'array', default: [] })
  credentialIds: string[];

  // Helper method to get plan limits
  getPlanLimits(): PlanLimits {
    if (this.planLimits) {
      return this.planLimits;
    }

    // Default limits based on plan
    const defaultLimits: Record<OrganizationPlan, PlanLimits> = {
      [OrganizationPlan.FREE]: {
        maxWorkflows: 5,
        maxExecutionsPerMonth: 100,
        maxTeamMembers: 1,
        maxCredentials: 2,
        maxWorkflowComplexity: 20,
        retentionDays: 7,
        customDomains: false,
        ssoEnabled: false,
        apiAccess: false,
        prioritySupport: false,
      },
      [OrganizationPlan.STARTER]: {
        maxWorkflows: 20,
        maxExecutionsPerMonth: 1000,
        maxTeamMembers: 5,
        maxCredentials: 10,
        maxWorkflowComplexity: 50,
        retentionDays: 30,
        customDomains: false,
        ssoEnabled: false,
        apiAccess: true,
        prioritySupport: false,
      },
      [OrganizationPlan.PRO]: {
        maxWorkflows: 100,
        maxExecutionsPerMonth: 10000,
        maxTeamMembers: 20,
        maxCredentials: 50,
        maxWorkflowComplexity: 100,
        retentionDays: 90,
        customDomains: true,
        ssoEnabled: true,
        apiAccess: true,
        prioritySupport: true,
      },
      [OrganizationPlan.ENTERPRISE]: {
        maxWorkflows: -1, // unlimited
        maxExecutionsPerMonth: -1,
        maxTeamMembers: -1,
        maxCredentials: -1,
        maxWorkflowComplexity: -1,
        retentionDays: 365,
        customDomains: true,
        ssoEnabled: true,
        apiAccess: true,
        prioritySupport: true,
      },
    };

    return defaultLimits[this.plan];
  }

  // Check if limit is exceeded
  isWithinLimit(resource: keyof PlanLimits, current: number): boolean {
    const limits = this.getPlanLimits();
    const limit = limits[resource];

    if (typeof limit === 'number') {
      return limit === -1 || current < limit;
    }

    return true;
  }
}
