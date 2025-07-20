import { Prop, Schema } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export abstract class BaseSchema extends Document {
  @ApiProperty({ description: 'Unique identifier' })
  _id: Types.ObjectId;

  @ApiProperty({ description: 'String representation of ID' })
  get id(): string {
    return this._id.toString();
  }

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;

  @Prop({ default: null })
  deletedAt?: Date;

  @ApiProperty({ description: 'Version for optimistic locking' })
  @Prop({ default: 1 })
  version: number;
}
