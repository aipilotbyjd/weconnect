import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../src/modules/auth/domain/entities/user.entity';
import { Organization } from '../src/modules/organizations/domain/entities/organization.entity';
import * as bcrypt from 'bcryptjs';

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const userRepository = app.get<Repository<User>>(getRepositoryToken(User));
    const organizationRepository = app.get<Repository<Organization>>(
      getRepositoryToken(Organization),
    );

    console.log('🌱 Starting database seeding...');

    // Create default organization
    const existingOrg = await organizationRepository.findOne({
      where: { name: 'Default Organization' },
    });

    let organization: Organization;
    if (!existingOrg) {
      organization = organizationRepository.create({
        name: 'Default Organization',
        description: 'Default organization for WeConnect',
        settings: {
          allowUserRegistration: true,
          maxWorkflows: 100,
          maxExecutionsPerMonth: 10000,
        },
      });
      organization = await organizationRepository.save(organization);
      console.log('✅ Created default organization');
    } else {
      organization = existingOrg;
      console.log('ℹ️  Default organization already exists');
    }

    // Create admin user
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@weconnect.com' },
    });

    if (!existingAdmin) {
      const adminUser = userRepository.create({
        email: 'admin@weconnect.com',
        firstName: 'Admin',
        lastName: 'User',
        password: await bcrypt.hash('admin123', 12),
        role: UserRole.ADMIN,
        currentOrganizationId: organization.id,
        organizationMembershipIds: [organization.id],
        isActive: true,
      });
      await userRepository.save(adminUser);
      console.log('✅ Created admin user (admin@weconnect.com / admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
    }

    // Create demo user
    const existingDemo = await userRepository.findOne({
      where: { email: 'demo@weconnect.com' },
    });

    if (!existingDemo) {
      const demoUser = userRepository.create({
        email: 'demo@weconnect.com',
        firstName: 'Demo',
        lastName: 'User',
        password: await bcrypt.hash('demo123', 12),
        role: UserRole.USER,
        currentOrganizationId: organization.id,
        organizationMembershipIds: [organization.id],
        isActive: true,
      });
      await userRepository.save(demoUser);
      console.log('✅ Created demo user (demo@weconnect.com / demo123)');
    } else {
      console.log('ℹ️  Demo user already exists');
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}

seed();