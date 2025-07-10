import { DataSource } from 'typeorm';
import dataSource from '../../../../config/typeorm.config';
import * as bcrypt from 'bcryptjs';

const users = [
  {
    email: 'admin@weconnect.com',
    password: 'Admin123!',
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    isActive: true,
  },
  {
    email: 'test@weconnect.com',
    password: 'Test123!',
    firstName: 'Test',
    lastName: 'User',
    role: 'user',
    isActive: true,
  },
];

async function seedUsers() {
  await dataSource.initialize();
  
  try {
    const userRepo = dataSource.getRepository('User');
    const orgRepo = dataSource.getRepository('Organization');
    const orgMemberRepo = dataSource.getRepository('OrganizationMember');
    
    // Get the default organization
    const defaultOrg = await orgRepo.findOne({
      where: { slug: 'default-org' },
    });
    
    if (!defaultOrg) {
      console.error('Default organization not found! Please run migrations first.');
      return;
    }
    
    for (const userData of users) {
      // Check if user already exists
      const existingUser = await userRepo.findOne({
        where: { email: userData.email },
      });
      
      if (!existingUser) {
        // Hash password
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        // Create user
        const user = userRepo.create({
          ...userData,
          password: hashedPassword,
          currentOrganizationId: defaultOrg.id,
        });
        
        await userRepo.save(user);
        console.log(`Created user: ${user.email}`);
        
        // Add user to default organization
        const orgMember = orgMemberRepo.create({
          organizationId: defaultOrg.id,
          userId: user.id,
          role: userData.role === 'admin' ? 'owner' : 'member',
          inviteAccepted: true,
          acceptedAt: new Date(),
        });
        
        await orgMemberRepo.save(orgMember);
        console.log(`Added ${user.email} to default organization`);
      } else {
        console.log(`User ${userData.email} already exists`);
      }
    }
    
    console.log('\nUser seeding completed successfully!');
    console.log('\nYou can now login with:');
    console.log('- Email: admin@weconnect.com, Password: Admin123!');
    console.log('- Email: test@weconnect.com, Password: Test123!');
  } catch (error) {
    console.error('Error seeding users:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedUsers();
}

export default seedUsers;
