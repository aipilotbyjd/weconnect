import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { BaseSchema } from '../../../../core/abstracts/base.schema';
import { ApiProperty } from '@nestjs/swagger';
import { Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Schema({ collection: 'users' })
export class User extends BaseSchema {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Prop({ required: true, unique: true, index: true })
  email: string;

  @ApiProperty({ description: 'User first name', example: 'John' })
  @Prop({ required: true })
  firstName: string;

  @ApiProperty({ description: 'User last name', example: 'Doe' })
  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Prop({ enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ description: 'Whether user is active' })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: Types.ObjectId })
  currentOrganizationId?: Types.ObjectId;

  @ApiProperty({
    description: 'User organization membership IDs',
  })
  @Prop({ type: [Types.ObjectId], default: [] })
  organizationMembershipIds: Types.ObjectId[];

  @Prop()
  profilePicture?: string;

  @Prop()
  timezone?: string;

  @Prop({ type: Object })
  preferences?: Record<string, any>;

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

export const UserSchema = SchemaFactory.createForClass(User);

// Add pre-save middleware for password hashing
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    const user = this as any;
    await user.hashPassword();
  }
  next();
});
