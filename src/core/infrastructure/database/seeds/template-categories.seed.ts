import { DataSource } from 'typeorm';
import dataSource from '../../../../config/typeorm.config';

const categories = [
  {
    name: 'Business & Productivity',
    slug: 'business-productivity',
    description: 'Templates for business automation and productivity workflows',
    icon: '💼',
    color: '#3498db',
    displayOrder: 1,
    subcategories: [
      {
        name: 'Sales & CRM',
        slug: 'sales-crm',
        description: 'Sales automation and CRM integration templates',
        icon: '💰',
        displayOrder: 1,
      },
      {
        name: 'Marketing',
        slug: 'marketing',
        description: 'Marketing automation and campaign management',
        icon: '📣',
        displayOrder: 2,
      },
      {
        name: 'HR & Recruiting',
        slug: 'hr-recruiting',
        description: 'Human resources and recruitment workflows',
        icon: '👥',
        displayOrder: 3,
      },
      {
        name: 'Finance & Accounting',
        slug: 'finance-accounting',
        description: 'Financial workflows and accounting automation',
        icon: '💵',
        displayOrder: 4,
      },
    ],
  },
  {
    name: 'Data & Analytics',
    slug: 'data-analytics',
    description: 'Data processing, analysis, and reporting templates',
    icon: '📊',
    color: '#9b59b6',
    displayOrder: 2,
    subcategories: [
      {
        name: 'Data Processing',
        slug: 'data-processing',
        description: 'ETL and data transformation workflows',
        icon: '⚙️',
        displayOrder: 1,
      },
      {
        name: 'Reporting',
        slug: 'reporting',
        description: 'Automated reporting and dashboard generation',
        icon: '📈',
        displayOrder: 2,
      },
      {
        name: 'Data Sync',
        slug: 'data-sync',
        description: 'Data synchronization between systems',
        icon: '🔄',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Communication',
    slug: 'communication',
    description: 'Email, messaging, and notification workflows',
    icon: '💬',
    color: '#1abc9c',
    displayOrder: 3,
    subcategories: [
      {
        name: 'Email Automation',
        slug: 'email-automation',
        description: 'Automated email workflows and campaigns',
        icon: '📧',
        displayOrder: 1,
      },
      {
        name: 'Notifications',
        slug: 'notifications',
        description: 'Alert and notification systems',
        icon: '🔔',
        displayOrder: 2,
      },
      {
        name: 'Chat & Messaging',
        slug: 'chat-messaging',
        description: 'Chat bot and messaging automation',
        icon: '💭',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Development & IT',
    slug: 'development-it',
    description: 'Developer tools and IT operations workflows',
    icon: '💻',
    color: '#e74c3c',
    displayOrder: 4,
    subcategories: [
      {
        name: 'DevOps',
        slug: 'devops',
        description: 'CI/CD and deployment automation',
        icon: '🚀',
        displayOrder: 1,
      },
      {
        name: 'Monitoring',
        slug: 'monitoring',
        description: 'System monitoring and alerting',
        icon: '📡',
        displayOrder: 2,
      },
      {
        name: 'API Integration',
        slug: 'api-integration',
        description: 'API connections and integrations',
        icon: '🔌',
        displayOrder: 3,
      },
    ],
  },
  {
    name: 'Social Media',
    slug: 'social-media',
    description: 'Social media management and automation',
    icon: '📱',
    color: '#f39c12',
    displayOrder: 5,
    subcategories: [
      {
        name: 'Content Publishing',
        slug: 'content-publishing',
        description: 'Automated content posting and scheduling',
        icon: '📝',
        displayOrder: 1,
      },
      {
        name: 'Social Monitoring',
        slug: 'social-monitoring',
        description: 'Social media monitoring and analytics',
        icon: '👁️',
        displayOrder: 2,
      },
    ],
  },
  {
    name: 'E-commerce',
    slug: 'e-commerce',
    description: 'Online store and e-commerce automation',
    icon: '🛒',
    color: '#2ecc71',
    displayOrder: 6,
    subcategories: [
      {
        name: 'Order Management',
        slug: 'order-management',
        description: 'Order processing and fulfillment',
        icon: '📦',
        displayOrder: 1,
      },
      {
        name: 'Inventory',
        slug: 'inventory',
        description: 'Inventory tracking and management',
        icon: '📋',
        displayOrder: 2,
      },
      {
        name: 'Customer Support',
        slug: 'customer-support',
        description: 'Customer service automation',
        icon: '🎧',
        displayOrder: 3,
      },
    ],
  },
];

async function seedCategories() {
  await dataSource.initialize();

  try {
    const categoryRepo = dataSource.getTreeRepository('TemplateCategory');

    for (const categoryData of categories) {
      const { subcategories, ...parentData } = categoryData;

      // Check if parent category exists
      let parent = await categoryRepo.findOne({
        where: { slug: parentData.slug },
      });

      if (!parent) {
        // Create parent category
        parent = categoryRepo.create(parentData);
        await categoryRepo.save(parent);
        console.log(`Created parent category: ${parent.name}`);
      }

      // Create subcategories
      if (subcategories) {
        for (const subData of subcategories) {
          const existing = await categoryRepo.findOne({
            where: { slug: subData.slug },
          });

          if (!existing) {
            const subcategory = categoryRepo.create({
              ...subData,
              parent,
            });
            await categoryRepo.save(subcategory);
            console.log(`  Created subcategory: ${subcategory.name}`);
          }
        }
      }
    }

    console.log('\nCategory seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  } finally {
    await dataSource.destroy();
  }
}

// Run the seed if this file is executed directly
if (require.main === module) {
  seedCategories();
}

export default seedCategories;
