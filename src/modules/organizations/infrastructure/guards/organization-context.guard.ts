import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { RequestWithUser } from '../../../auth/domain/interfaces/request-with-user.interface';

@Injectable()
export class OrganizationContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user.currentOrganizationId) {
      throw new BadRequestException(
        'No organization selected. Please select or create an organization.',
      );
    }

    // Add organization ID to request for easy access
    request['organizationId'] = user.currentOrganizationId;

    return true;
  }
}
