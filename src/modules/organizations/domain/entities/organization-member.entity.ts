import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from '../../../auth/domain/entities/user.entity';
import { Organization } from './organization.entity';

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

@Entity('organization_members')
@Unique(['organization', 'user'])
export class OrganizationMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ type: () => Organization, description: 'Organization this member belongs to' })
  @ManyToOne(() => Organization, (org) => org.members, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  organization: Organization;

  @Column()
  organizationId: string;

  @ApiProperty({ type: () => User, description: 'User who is a member' })
  @ManyToOne(() => User, (user) => user.organizationMemberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  user: User;

  @Column()
  userId: string;

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER,
  })
  role: OrganizationRole;

  @Column({ nullable: true })
  invitedBy?: string;

  @Column({ nullable: true })
  inviteToken?: string;

  @Column({ nullable: true, type: 'timestamp' })
  inviteExpiresAt?: Date;

  @Column({ default: false })
  inviteAccepted: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  acceptedAt?: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'timestamp' })
  lastActiveAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

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
