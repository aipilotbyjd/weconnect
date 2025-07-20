import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { BaseSchema } from '../../../../core/abstracts/base.schema';

export enum OrganizationRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  MEMBER = 'member',
  GUEST = 'guest',
}

export interface RolePermissions {
  // Organization management
  canManageOrganization: boolean;
  canManageBilling: boolean;
  canInviteMembers: boolean;
  canRemoveMembers: boolean;
  canManageRoles: boolean;

  // Workflow permissions
  canCreateWorkflows: boolean;
  canEditAllWorkflows: boolean;
  canDeleteAllWorkflows: boolean;
  canExecuteAllWorkflows: boolean;
  canViewAllWorkflows: boolean;

  // Credential permissions
  canCreateCredentials: boolean;
  canEditAllCredentials: boolean;
  canDeleteAllCredentials: boolean;
  canUseAllCredentials: boolean;

  // Execution permissions
  canViewAllExecutions: boolean;
  canRetryExecutions: boolean;
  canDeleteExecutions: boolean;
}

@Schema({ collection: 'organization_members' })
export class OrganizationMember extends BaseSchema {
  @ApiProperty({ description: 'Organization ID this member belongs to' })
  @Prop({ type: Types.ObjectId, ref: 'Organization', required: true })
  organizationId: Types.ObjectId;

  @ApiProperty({ description: 'User ID who is a member' })
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @ApiProperty({ description: 'Member role', enum: OrganizationRole })
  @Prop({
    type: String,
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role: OrganizationRole;

  @ApiProperty({ description: 'User ID who invited this member' })
  @Prop({ type: Types.ObjectId, ref: 'User' })
  invitedBy?: Types.ObjectId;

  @ApiProperty({ description: 'Invitation token' })
  @Prop()
  inviteToken?: string;

  @ApiProperty({ description: 'Invitation expiration date' })
  @Prop()
  inviteExpiresAt?: Date;

  @ApiProperty({ description: 'Whether invitation was accepted' })
  @Prop({ default: false })
  inviteAccepted: boolean;

  @ApiProperty({ description: 'Date invitation was accepted' })
  @Prop()
  acceptedAt?: Date;

  @ApiProperty({ description: 'Whether member is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last activity timestamp' })
  @Prop()
  lastActiveAt?: Date;

  // Get permissions based on role
  getPermissions(): RolePermissions {
    const permissions: Record<OrganizationRole, RolePermissions> = {
      [OrganizationRole.OWNER]: {
        canManageOrganization: true,
        canManageBilling: true,
        canInviteMembers: true,
        canRemoveMembers: true,
        canManageRoles: true,
        canCreateWorkflows: true,
        canEditAllWorkflows: true,
        canDeleteAllWorkflows: true,
        canExecuteAllWorkflows: true,
        canViewAllWorkflows: true,
        canCreateCredentials: true,
        canEditAllCredentials: true,
        canDeleteAllCredentials: true,
        canUseAllCredentials: true,
        canViewAllExecutions: true,
        canRetryExecutions: true,
        canDeleteExecutions: true,
      },
      [OrganizationRole.ADMIN]: {
        canManageOrganization: true,
        canManageBilling: false,
        canInviteMembers: true,
        canRemoveMembers: true,
        canManageRoles: true,
        canCreateWorkflows: true,
        canEditAllWorkflows: true,
        canDeleteAllWorkflows: true,
        canExecuteAllWorkflows: true,
        canViewAllWorkflows: true,
        canCreateCredentials: true,
        canEditAllCredentials: true,
        canDeleteAllCredentials: true,
        canUseAllCredentials: true,
        canViewAllExecutions: true,
        canRetryExecutions: true,
        canDeleteExecutions: true,
      },
      [OrganizationRole.MEMBER]: {
        canManageOrganization: false,
        canManageBilling: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canManageRoles: false,
        canCreateWorkflows: true,
        canEditAllWorkflows: false,
        canDeleteAllWorkflows: false,
        canExecuteAllWorkflows: false,
        canViewAllWorkflows: false,
        canCreateCredentials: true,
        canEditAllCredentials: false,
        canDeleteAllCredentials: false,
        canUseAllCredentials: false,
        canViewAllExecutions: false,
        canRetryExecutions: false,
        canDeleteExecutions: false,
      },
      [OrganizationRole.GUEST]: {
        canManageOrganization: false,
        canManageBilling: false,
        canInviteMembers: false,
        canRemoveMembers: false,
        canManageRoles: false,
        canCreateWorkflows: false,
        canEditAllWorkflows: false,
        canDeleteAllWorkflows: false,
        canExecuteAllWorkflows: false,
        canViewAllWorkflows: true,
        canCreateCredentials: false,
        canEditAllCredentials: false,
        canDeleteAllCredentials: false,
        canUseAllCredentials: false,
        canViewAllExecutions: true,
        canRetryExecutions: false,
        canDeleteExecutions: false,
      },
    };

    return permissions[this.role];
  }

  hasPermission(permission: keyof RolePermissions): boolean {
    const permissions = this.getPermissions();
    return permissions[permission];
  }
}

export const OrganizationMemberSchema = SchemaFactory.createForClass(OrganizationMember);

// Create compound index for unique organization-user combination
OrganizationMemberSchema.index({ organizationId: 1, userId: 1 }, { unique: true });