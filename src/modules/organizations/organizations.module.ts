import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { Organization, OrganizationSchema } from './domain/entities/organization.entity';
import { OrganizationMember, OrganizationMemberSchema } from './domain/entities/organization-member.entity';
import { OrganizationsService } from './application/services/organizations.service';
import { OrganizationsController } from './presentation/controllers/organizations.controller';
import { OrganizationCronService } from './infrastructure/jobs/organization-cron.service';
import { OrganizationContextGuard } from './infrastructure/guards/organization-context.guard';
import { AuthModule } from '../auth/auth.module';
import { User, UserSchema } from '../auth/domain/entities/user.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Organization.name, schema: OrganizationSchema },
      { name: OrganizationMember.name, schema: OrganizationMemberSchema },
      { name: User.name, schema: UserSchema },
    ]),
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
