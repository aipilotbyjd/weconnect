import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { Credential } from './credential.entity';
import { SharePermission, ShareStatus } from '../enums/credential-share.enum';

@Entity('credential_shares')
@Index(['credentialId', 'sharedWithUserId', 'status'])
@Index(['sharedByUserId'])
@Index(['expiresAt'])
export class CredentialShare {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  credentialId: string;

  @Column('uuid')
  sharedByUserId: string;

  @Column('uuid')
  sharedWithUserId: string;

  @Column({
    type: 'enum',
    enum: SharePermission,
    array: true,
    default: [SharePermission.READ],
  })
  permissions: SharePermission[];

  @Column({
    type: 'enum',
    enum: ShareStatus,
    default: ShareStatus.ACTIVE,
  })
  status: ShareStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt: Date;

  @Column({ type: 'text', nullable: true })
  note: string;

  @Column({ type: 'timestamp with time zone' })
  sharedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  revokedAt: Date;

  @Column('uuid', { nullable: true })
  revokedByUserId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Credential, credential => credential.shares, {
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
    return this.permissions.map(permission => {
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
