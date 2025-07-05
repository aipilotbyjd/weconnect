import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { OrganizationsService } from '../../application/services/organizations.service';

@Injectable()
export class OrganizationCronService {
  private readonly logger = new Logger(OrganizationCronService.name);

  constructor(private organizationsService: OrganizationsService) {}

  // Run at midnight on the first day of every month
  @Cron('0 0 1 * *')
  async resetMonthlyExecutions() {
    this.logger.log('Starting monthly execution count reset');
    try {
      await this.organizationsService.resetMonthlyExecutions();
      this.logger.log('Monthly execution count reset completed');
    } catch (error) {
      this.logger.error('Failed to reset monthly executions', error);
    }
  }

  // Run every day at 2 AM to clean up expired invitations
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredInvitations() {
    this.logger.log('Starting expired invitations cleanup');
    try {
      // Implementation would go here
      // await this.organizationsService.cleanupExpiredInvitations();
      this.logger.log('Expired invitations cleanup completed');
    } catch (error) {
      this.logger.error('Failed to cleanup expired invitations', error);
    }
  }
}
