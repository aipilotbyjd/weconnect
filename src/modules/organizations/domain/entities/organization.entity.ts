import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { Types } from 'mongoose';

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

@Schema({ collection: 'organizations' })
export class Organization extends BaseSchema {

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  description?: string;

  @Prop()
  logo?: string;

  @Prop()
  website?: string;

  @Prop({ enum: OrganizationPlan, default: OrganizationPlan.FREE })
  plan: OrganizationPlan;

  @Prop({ type: Object })
  planLimits?: PlanLimits;

  @Prop({ type: Object })
  customSettings?: Record<string, any>;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  stripeCustomerId?: string;

  @Prop()
  stripeSubscriptionId?: string;

  @Prop()
  trialEndsAt?: Date;

  @Prop({ default: 0 })
  currentMonthExecutions: number;

  @Prop()
  executionResetDate?: Date;

  @ApiProperty({
    description: 'Organization member IDs',
  })
  @Prop({ type: [Types.ObjectId], default: [] })
  memberIds: Types.ObjectId[];

  @ApiProperty({
    description: 'Organization workflow IDs',
  })
  @Prop({ type: [Types.ObjectId], default: [] })
  workflowIds: Types.ObjectId[];

  @ApiProperty({
    description: 'Organization credential IDs',
  })
  @Prop({ type: [Types.ObjectId], default: [] })
  credentialIds: Types.ObjectId[];

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

export const OrganizationSchema = SchemaFactory.createForClass(Organization);