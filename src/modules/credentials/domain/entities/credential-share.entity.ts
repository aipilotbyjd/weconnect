import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Types } from 'mongoose';import { Credential } from './credential.entity';
import { SharePermission, ShareStatus } from '../enums/credential-share.enum';

@Schema({ collection: 'credential_shares' })
export class CredentialShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Prop('uuid')
  credentialId: string;

  @Prop('uuid')
  sharedByUserId: string;

  @Prop('uuid')
  sharedWithUserId: string;

  @Prop({
    type: 'enum',
    enum: SharePermission,
    array: true,
    default: [SharePermission.READ],
  })
  permissions: SharePermission[];

  @Prop({
    type: 'enum',
    enum: ShareStatus,
    default: ShareStatus.ACTIVE,
  })
  status: ShareStatus;

  @Prop({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @Prop({ type: 'text', nullable: true })
  note: string;

  @Prop({ type: 'timestamp with time zone' })
  sharedAt: Date;

  @Prop({ type: 'timestamp with time zone', nullable: true })
  revokedAt: Date;

  @Prop('uuid', { nullable: true })
  revokedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Credential, (credential) => credential.shares, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialId' })
  credential: Credential;

  // Virtual properties for user information
  sharedByUser?: {
    id: string;
    name: string;
    email: string;
  };

  sharedWithUser?: {
    id: string;
    name: string;
    email: string;
  };

  revokedByUser?: {
    id: string;
    name: string;
    email: string;
  };

  // Helper methods
  isExpired(): boolean {
    return this.expiresAt ? this.expiresAt < new Date() : false;
  }

  isActive(): boolean {
    return this.status === ShareStatus.ACTIVE && !this.isExpired();
  }

  hasPermission(permission: SharePermission): boolean {
    return this.permissions.includes(permission);
  }

  canRead(): boolean {
    return this.hasPermission(SharePermission.READ);
  }

  canWrite(): boolean {
    return this.hasPermission(SharePermission.WRITE);
  }

  canExecute(): boolean {
    return this.hasPermission(SharePermission.EXECUTE);
  }

  canManage(): boolean {
    return this.hasPermission(SharePermission.MANAGE);
  }

  getDaysUntilExpiry(): number | null {
    if (!this.expiresAt) {
      return null;
    }

    const now = new Date();
    const diffTime = this.expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  getPermissionNames(): string[] {
    return this.permissions.map((permission) => {
      switch (permission) {
        case SharePermission.READ:
          return 'Read';
        case SharePermission.WRITE:
          return 'Write';
        case SharePermission.EXECUTE:
          return 'Execute';
        case SharePermission.MANAGE:
          return 'Manage';
        default:
          return permission;
      }
    });
  }
}


export const CredentialShareSchema = SchemaFactory.createForClass(CredentialShare);