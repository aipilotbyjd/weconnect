import {
  ObjectIdColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  ObjectId,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export abstract class BaseEntity {
  @ApiProperty({ description: 'Unique identifier' })
  @ObjectIdColumn()
  _id: ObjectId;

  @ApiProperty({ description: 'String representation of ID' })
  get id(): string {
    return this._id.toString();
  }

  @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt?: Date;

  @ApiProperty({ description: 'Version for optimistic locking' })
  @Column({ default: 1 })
  version: number;
}
