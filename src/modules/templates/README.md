# Workflow Templates and Marketplace Module

This module provides a complete workflow template marketplace system for WeConnect, allowing users to create, share, and reuse workflow templates.

## Features

### Core Features
- **Template Creation**: Convert existing workflows into reusable templates
- **Template Marketplace**: Browse and search public/marketplace templates
- **Categories & Tags**: Organize templates with hierarchical categories and tags
- **Reviews & Ratings**: Community-driven quality feedback system
- **Template Tiers**: Support for free, premium, and enterprise templates
- **Visibility Control**: Private, organization-only, public, or marketplace visibility
- **Template Variables**: Define configurable variables for template customization
- **Required Credentials**: Specify which credentials/integrations are needed

### Advanced Features
- **Moderation System**: Review and approve templates before marketplace listing
- **Usage Analytics**: Track views, downloads, and usage statistics
- **Version Control**: Template versioning and update management
- **Premium Templates**: Monetization support for template creators
- **Featured Templates**: Highlight official or community-favorite templates

## Architecture

### Entities

1. **WorkflowTemplate**
   - Core template entity with metadata, pricing, and workflow definition
   - Supports multiple visibility levels and pricing tiers
   - Tracks usage statistics and ratings

2. **TemplateCategory**
   - Hierarchical category system using closure table pattern
   - Supports nested categories with parent-child relationships
   - Active/inactive status for category management

3. **TemplateReview**
   - User reviews and ratings (1-5 stars)
   - Moderation support with visibility control
   - Helpful/unhelpful voting system

### Services

1. **WorkflowTemplateService**
   - CRUD operations for templates
   - Advanced search with multiple filters
   - Publishing and moderation workflow
   - Import/download tracking

2. **TemplateReviewService**
   - Review creation and management
   - Automatic rating calculation
   - Moderation capabilities

3. **TemplateCategoryService**
   - Category tree management
   - Circular reference prevention
   - Active category filtering

### API Endpoints

#### Workflow Templates
- `POST /api/v1/workflow-templates` - Create template
- `PUT /api/v1/workflow-templates/:id` - Update template
- `DELETE /api/v1/workflow-templates/:id` - Delete template
- `GET /api/v1/workflow-templates/:id` - Get single template
- `GET /api/v1/workflow-templates` - Search templates
- `POST /api/v1/workflow-templates/:id/publish` - Publish template
- `POST /api/v1/workflow-templates/:id/approve` - Approve template (admin)
- `POST /api/v1/workflow-templates/:id/reject` - Reject template (admin)
- `POST /api/v1/workflow-templates/:id/import` - Import template
- `GET /api/v1/workflow-templates/:id/download` - Download template

#### Template Reviews
- `POST /api/v1/workflow-templates/:templateId/reviews` - Create review
- `PUT /api/v1/workflow-templates/:templateId/reviews/:id` - Update review
- `DELETE /api/v1/workflow-templates/:templateId/reviews/:id` - Delete review
- `GET /api/v1/workflow-templates/:templateId/reviews` - List reviews
- `POST /api/v1/workflow-templates/:templateId/reviews/:id/helpful` - Mark helpful
- `POST /api/v1/workflow-templates/:templateId/reviews/:id/moderate` - Moderate (admin)

#### Template Categories
- `POST /api/v1/template-categories` - Create category (admin)
- `PUT /api/v1/template-categories/:id` - Update category (admin)
- `DELETE /api/v1/template-categories/:id` - Delete category (admin)
- `GET /api/v1/template-categories` - Get all categories
- `GET /api/v1/template-categories/active` - Get active categories
- `GET /api/v1/template-categories/:id` - Get category by ID
- `GET /api/v1/template-categories/slug/:slug` - Get category by slug

## Usage Examples

### Creating a Template

```typescript
const template = await workflowTemplateService.create({
  name: 'Daily Sales Report',
  slug: 'daily-sales-report',
  description: 'Automated daily sales report generation',
  workflowDefinition: {
    nodes: [...],
    connections: [...],
    settings: {}
  },
  requiredCredentials: [
    {
      type: 'google-sheets',
      name: 'Google Sheets',
      description: 'For reading sales data'
    }
  ],
  variables: [
    {
      name: 'reportDate',
      type: 'date',
      required: true,
      description: 'Date for the report'
    }
  ],
  visibility: TemplateVisibility.PUBLIC,
  tier: TemplateTier.FREE,
  tags: ['sales', 'reporting', 'automation'],
  categoryIds: ['category-uuid-1', 'category-uuid-2']
}, currentUser);
```

### Searching Templates

```typescript
const results = await workflowTemplateService.search({
  query: 'sales report',
  categoryIds: ['business-category-id'],
  tiers: [TemplateTier.FREE, TemplateTier.PREMIUM],
  minRating: 4,
  sortBy: TemplateSortBy.POPULAR,
  page: 1,
  limit: 20
}, currentUser);
```

### Publishing a Template

```typescript
// 1. Create as draft
const draft = await workflowTemplateService.create(templateData, user);

// 2. Publish for review
const published = await workflowTemplateService.publish(draft.id, user);

// 3. Admin approves (or rejects)
const approved = await workflowTemplateService.approve(published.id, adminUser);
```

## Database Schema

The module creates the following tables:
- `workflow_templates` - Main template storage
- `template_categories` - Category definitions
- `template_categories_closure` - Category hierarchy (closure table)
- `template_reviews` - User reviews
- `template_categories_mapping` - Many-to-many template-category mapping

## Integration Points

### With Workflow Module
- Import templates to create new workflows
- Export workflows as templates
- Template variables replace workflow parameters

### With Credentials Module
- Templates specify required credentials
- Credential validation on import
- OAuth setup guidance

### With Organizations Module
- Organization-specific template visibility
- Organization branding on templates
- Private template libraries

### With Billing Module (Future)
- Premium template purchases
- Revenue sharing for creators
- Subscription-based access

## Security Considerations

1. **Access Control**
   - Only template creators can modify their templates
   - Organization templates visible only to members
   - Admin-only moderation endpoints

2. **Content Moderation**
   - Review queue for new templates
   - Report inappropriate content
   - Admin moderation tools

3. **Data Privacy**
   - No sensitive data in template definitions
   - Credential requirements without actual credentials
   - User data isolation

## Future Enhancements

1. **Template Versioning**
   - Track template updates
   - Version comparison
   - Rollback capabilities

2. **Template Collections**
   - Curated template sets
   - Bundle pricing
   - Themed collections

3. **Template Analytics**
   - Detailed usage statistics
   - Conversion tracking
   - A/B testing support

4. **Enhanced Marketplace**
   - Template previews
   - Live demos
   - Video tutorials
   - Community forums

5. **Developer Tools**
   - Template SDK
   - CLI for template management
   - GitHub integration

## Module Registration

Add the TemplatesModule to your AppModule:

```typescript
import { TemplatesModule } from './modules/templates/templates.module';

@Module({
  imports: [
    // ... other modules
    TemplatesModule,
  ],
})
export class AppModule {}
```
