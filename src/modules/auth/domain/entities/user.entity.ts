import {
  Entity,
  Column,
  BeforeInsert,
  Index,
  ObjectId,
} from 'typeorm';
import { BaseEntity } from '../../../../core/abstracts/base.entity';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
@Index(['email'], { unique: true })
export class User extends BaseEntity {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Column()
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Column()
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Column()
  lastName: string;

  @Column()
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Whether user is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ nullable: true })
  lastLoginAt?: Date;

  // Current active organization - store as ObjectId string
  @Column({ nullable: true })
  currentOrganizationId?: string;

  // Organization memberships - store as array of ObjectId strings
  @ApiProperty({
    description: 'User organization membership IDs',
  })
  @Column({ type: 'array', default: [] })
  organizationMembershipIds: string[];

  @Column({ nullable: true })
  profilePicture?: string;

  @Column({ nullable: true })
  timezone?: string;

  @Column({ nullable: true })
  preferences?: Record<string, any>;

  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
