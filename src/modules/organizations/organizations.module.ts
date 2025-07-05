import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { Organization } from './domain/entities/organization.entity';
import { OrganizationMember } from './domain/entities/organization-member.entity';
import { OrganizationsService } from './application/services/organizations.service';
import { OrganizationsController } from './presentation/controllers/organizations.controller';
import { OrganizationCronService } from './infrastructure/jobs/organization-cron.service';
import { OrganizationContextGuard } from './infrastructure/guards/organization-context.guard';
import { AuthModule } from '../auth/auth.module';
import { User } from '../auth/domain/entities/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Organization, OrganizationMember, User]),
    ScheduleModule.forRoot(),
    forwardRef(() => AuthModule),
  ],
  controllers: [OrganizationsController],
  providers: [
    OrganizationsService,
    OrganizationCronService,
    OrganizationContextGuard,
  ],
  exports: [OrganizationsService, OrganizationContextGuard],
})
export class OrganizationsModule {}
