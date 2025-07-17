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
import {
  RotationStatus,
  RotationType,
} from '../enums/credential-rotation.enum';

export interface RotationPolicy {
  enabled: boolean;
  rotationType: RotationType;
  rotationIntervalDays: number;
  warningDays: number;
  maxAge: number;
  retainVersions: number;
  autoRotate: boolean;
}

@Entity('credential_rotations')
@Index(['credentialId', 'status'])
@Index(['nextRotationAt'])
@Index(['scheduledAt'])
@Index(['createdByUserId'])
export class CredentialRotation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  credentialId: string;

  @Column({
    type: 'enum',
    enum: RotationType,
    default: RotationType.MANUAL,
  })
  rotationType: RotationType;

  @Column({
    type: 'enum',
    enum: RotationStatus,
    default: RotationStatus.SCHEDULED,
  })
  status: RotationStatus;

  @Column({ type: 'jsonb', nullable: true })
  policy: RotationPolicy;

  @Column({ type: 'timestamp with time zone', nullable: true })
  scheduledAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  nextRotationAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  startedAt: Date;

  @Column({ type: 'timestamp with time zone', nullable: true })
  completedAt: Date;

  @Column('uuid', { nullable: true })
  newCredentialId: string;

  @Column('uuid')
  createdByUserId: string;

  @Column({ type: 'text', nullable: true })
  error: string;

  @Column({ type: 'integer', nullable: true })
  executionTimeMs: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Credential, (credential) => credential.rotations, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'credentialId' })
  credential: Credential;

  @ManyToOne(() => Credential, { nullable: true })
  @JoinColumn({ name: 'newCredentialId' })
  newCredential?: Credential;

  // Virtual properties for user information
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };

  // Helper methods
  isCompleted(): boolean {
    return this.status === RotationStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === RotationStatus.FAILED;
  }

  isInProgress(): boolean {
    return this.status === RotationStatus.IN_PROGRESS;
  }

  isScheduled(): boolean {
    return this.status === RotationStatus.SCHEDULED;
  }

  isDue(): boolean {
    if (!this.nextRotationAt) {
      return false;
    }
    return this.nextRotationAt <= new Date();
  }

  getExecutionTimeSeconds(): number | null {
    return this.executionTimeMs
      ? Math.round(this.executionTimeMs / 1000)
      : null;
  }

  getDaysUntilRotation(): number | null {
    if (!this.nextRotationAt) {
      return null;
    }

    const now = new Date();
    const diffTime = this.nextRotationAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
  }

  getStatusDisplayName(): string {
    switch (this.status) {
      case RotationStatus.SCHEDULED:
        return 'Scheduled';
      case RotationStatus.IN_PROGRESS:
        return 'In Progress';
      case RotationStatus.COMPLETED:
        return 'Completed';
      case RotationStatus.FAILED:
        return 'Failed';
      case RotationStatus.CANCELLED:
        return 'Cancelled';
      case RotationStatus.ACTIVE:
        return 'Active';
      case RotationStatus.EXPIRED:
        return 'Expired';
      default:
        return this.status;
    }
  }

  getRotationTypeDisplayName(): string {
    switch (this.rotationType) {
      case RotationType.MANUAL:
        return 'Manual';
      case RotationType.API_KEY:
        return 'API Key';
      case RotationType.OAUTH2:
        return 'OAuth2 Token';
      case RotationType.PASSWORD:
        return 'Password';
      case RotationType.CERTIFICATE:
        return 'Certificate';
      default:
        return this.rotationType;
    }
  }

  calculateNextRotation(): Date | null {
    if (!this.policy?.autoRotate || !this.policy.rotationIntervalDays) {
      return null;
    }

    const baseDate = this.completedAt || new Date();
    const nextRotation = new Date(baseDate);
    nextRotation.setDate(
      nextRotation.getDate() + this.policy.rotationIntervalDays,
    );

    return nextRotation;
  }

  shouldWarnUser(): boolean {
    if (!this.nextRotationAt || !this.policy?.warningDays) {
      return false;
    }

    const warningDate = new Date(this.nextRotationAt);
    warningDate.setDate(warningDate.getDate() - this.policy.warningDays);

    return new Date() >= warningDate;
  }

  isOverdue(): boolean {
    if (!this.nextRotationAt) {
      return false;
    }

    return new Date() > this.nextRotationAt;
  }

  getDuration(): number | null {
    if (!this.startedAt || !this.completedAt) {
      return null;
    }

    return this.completedAt.getTime() - this.startedAt.getTime();
  }
}
