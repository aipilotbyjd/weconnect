# Organizations Module

This module provides multi-tenancy support for WeConnect, allowing users to create and manage organizations with team members, roles, and resource limits.

## Features

### Organization Management
- Create and manage multiple organizations
- Organization profiles with name, description, logo, website
- Unique slugs for each organization
- Organization switching for users

### Team Management
- Invite members via email
- Role-based permissions (Owner, Admin, Member, Guest)
- Transfer ownership
- Remove members
- Update member roles

### Subscription Plans
- **Free**: 5 workflows, 100 executions/month, 1 member
- **Starter**: 20 workflows, 1,000 executions/month, 5 members
- **Pro**: 100 workflows, 10,000 executions/month, 20 members
- **Enterprise**: Unlimited resources, custom limits

### Resource Limits
- Workflow limits per plan
- Monthly execution limits with automatic reset
- Team member limits
- Credential limits
- Retention policies

## API Endpoints

### Organization Management
- `POST /organizations` - Create organization
- `GET /organizations` - List user's organizations
- `GET /organizations/:id` - Get organization details
- `PUT /organizations/:id` - Update organization
- `DELETE /organizations/:id` - Delete organization
- `POST /organizations/:id/switch` - Switch active organization

### Member Management
- `POST /organizations/:id/members/invite` - Invite member
- `POST /organizations/invites/accept?token=xxx` - Accept invitation
- `PUT /organizations/:id/members/:memberId/role` - Update member role
- `DELETE /organizations/:id/members/:memberId` - Remove member
- `POST /organizations/:id/transfer-ownership` - Transfer ownership

## Usage

### Guards

Use `OrganizationContextGuard` to ensure user has selected an organization:

```typescript
@Controller('workflows')
@UseGuards(JwtAuthGuard, OrganizationContextGuard)
export class WorkflowsController {
  // All routes require organization context
}
```

### Decorators

Get current organization ID in controllers:

```typescript
@Get()
async findAll(@OrganizationId() organizationId: string) {
  // Use organizationId
}
```

### Service Usage

Check resource limits before creating resources:

```typescript
const canCreate = await this.organizationsService.checkResourceLimit(
  organizationId,
  'maxWorkflows',
  1
);

if (!canCreate) {
  throw new BadRequestException('Workflow limit reached');
}
```

Increment execution count:

```typescript
await this.organizationsService.incrementExecutionCount(organizationId);
```

## Permissions

### Owner
- Full access to everything
- Can delete organization
- Can transfer ownership
- Can manage billing

### Admin
- Can manage organization settings
- Can invite/remove members
- Can manage all workflows and credentials
- Cannot manage billing

### Member
- Can create own workflows and credentials
- Can view own executions
- Cannot manage organization or other users' resources

### Guest
- Read-only access to workflows
- Can view executions
- Cannot create or modify anything

## Database Schema

### Organization
- id (UUID)
- slug (unique)
- name
- plan
- planLimits
- currentMonthExecutions
- executionResetDate

### OrganizationMember
- id (UUID)
- organizationId
- userId
- role
- inviteToken
- inviteAccepted

## Multi-Tenancy Implementation

1. **Data Isolation**: All resources (workflows, credentials, executions) are linked to organizations
2. **Context Enforcement**: OrganizationContextGuard ensures organization is selected
3. **Permission Checks**: Role-based access control at service level
4. **Resource Limits**: Plan-based limits enforced before resource creation

## Scheduled Jobs

- **Monthly Reset**: Execution counts reset on 1st of each month at midnight
- **Invitation Cleanup**: Expired invitations cleaned daily at 2 AM

## Best Practices

1. Always use `OrganizationContextGuard` for routes that access organization resources
2. Check permissions using `organizationsService.checkPermission()`
3. Validate resource limits before creating new resources
4. Use transactions when creating organization-related data
5. Include organizationId in all resource queries for proper isolation
