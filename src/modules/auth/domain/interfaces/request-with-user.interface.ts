import { Request } from 'express';
import { User } from '../../../users/domain/entities/user.entity';

export interface RequestWithUser extends Request {
  user: User;
}
