# WeConnect Entities - Deep Dive Documentation

## Table of Contents
1. [Base Entity](#base-entity)
2. [AI Agents Module](#ai-agents-module)
3. [Authentication Module](#authentication-module)  
4. [Organizations Module](#organizations-module)
5. [Credentials Module](#credentials-module)
6. [Workflows Module](#workflows-module)
7. [Executions Module](#executions-module)
8. [Templates Module](#templates-module)
9. [Webhooks Module](#webhooks-module)
10. [Scheduler Module](#scheduler-module)
11. [Monitoring Module](#monitoring-module)

## Base Entity

All entities in WeConnect extend from `BaseEntity`, providing common fields and functionality.

```typescript
@Entity()
export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;                     // UUID primary key for all entities

  @CreateDateColumn({ type: 'timestamp with time zone' })
  createdAt: Date;               // Automatic creation timestamp

  @UpdateDateColumn({ type: 'timestamp with time zone' })
  updatedAt: Date;               // Automatic update timestamp

  @DeleteDateColumn({ type: 'timestamp with time zone', nullable: true })
  deletedAt?: Date;              // Soft delete timestamp

  @Column({ type: 'int', default: 1 })
  version: number;               // Optimistic locking version
}
```

### Features
- **UUID Primary Keys**: Ensures uniqueness across distributed systems
- **Timestamp Tracking**: Automatic creation and update tracking
- **Soft Deletion**: Records are marked as deleted rather than physically removed
- **Optimistic Locking**: Prevents concurrent update conflicts
- **Timezone Awareness**: All timestamps stored with timezone information

## AI Agents Module

### AIAgent Entity

```typescript
@Entity('ai_agents')
@Index(['provider', 'model'])
@Index(['createdAt'])
export class AIAgent extends BaseEntity {
  @Column({ length: 255 })
  name: string;                  // Agent display name (max 255 chars)

  @Column('text')
  description: string;           // Detailed agent description

  @Column({ length: 50 })
  provider: string;              // AI provider (openai, anthropic, etc.)

  @Column({ length: 100 })
  model: string;                 // Model identifier (gpt-4, claude-3, etc.)

  @Column({ type: 'jsonb', default: {} })
  configuration: {
    systemPrompt?: string;       // System instruction prompt
    temperature?: number;        // Model creativity (0.0-1.0)
    maxTokens?: number;         // Maximum response tokens
    topP?: number;              // Nucleus sampling parameter
    frequencyPenalty?: number;   // Repetition penalty
    presencePenalty?: number;    // Topic diversity penalty
    stopSequences?: string[];    // Stop generation sequences
    memoryType?: MemoryType;     // Memory strategy
    memoryConfig?: object;       // Memory configuration
  };

  // Performance metrics (calculated fields)
  @Column({ type: 'int', default: 0 })
  totalExecutions: number;       // Total number of executions

  @Column({ type: 'float', default: 0 })
  averageResponseTime: number;   // Average response time in ms

  @Column({ type: 'float', default: 0 })
  successRate: number;           // Success rate percentage

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastExecutedAt?: Date;         // Last execution timestamp

  // Relationships
  @OneToMany(() => AIAgentExecution, execution => execution.agent)
  executions: AIAgentExecution[];

  @OneToMany(() => AIAgentTool, tool => tool.agent, { cascade: true })
  tools: AIAgentTool[];

  @OneToMany(() => AIAgentMemory, memory => memory.agent, { cascade: true })
  memories: AIAgentMemory[];
}
```

### AIAgentExecution Entity

```typescript
@Entity('ai_agent_executions')
@Index(['agentId', 'status'])
@Index(['createdAt'])
@Index(['executionTime'])
export class AIAgentExecution extends BaseEntity {
  @Column('uuid')
  agentId: string;               // Reference to AIAgent

  @Column({ length: 50, default: 'pending' })
  status: 'pending' | 'running' | 'completed' | 'failed' | 'timeout';

  @Column('text')
  input: string;                 // User input/prompt

  @Column('text', { nullable: true })
  output?: string;               // AI response

  @Column({ type: 'int' })
  inputTokens: number;           // Tokens in input

  @Column({ type: 'int', nullable: true })
  outputTokens?: number;         // Tokens in output

  @Column({ type: 'int' })
  executionTime: number;         // Execution time in milliseconds

  @Column({ type: 'float', nullable: true })
  cost?: number;                 // Execution cost in USD

  @Column('text', { nullable: true })
  error?: string;                // Error message if failed

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    provider?: string;           // AI provider used
    model?: string;              // Model used
    temperature?: number;        // Temperature setting
    maxTokens?: number;         // Max tokens setting
    userId?: string;            // User who initiated
    sessionId?: string;         // Conversation session
    toolsUsed?: string[];       // Tools utilized
  };

  // Relationships
  @ManyToOne(() => AIAgent, agent => agent.executions)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;
}
```

### AIAgentTool Entity

```typescript
@Entity('ai_agent_tools')
@Index(['agentId', 'toolName'])
@Index(['isActive'])
export class AIAgentTool extends BaseEntity {
  @Column('uuid')
  agentId: string;               // Reference to AIAgent

  @Column({ length: 100 })
  toolName: string;              // Tool identifier

  @Column({ length: 255 })
  displayName: string;           // Human-readable tool name

  @Column('text', { nullable: true })
  description?: string;          // Tool description

  @Column({ type: 'jsonb', default: {} })
  configuration: {
    apiEndpoint?: string;        // Tool API endpoint
    apiKey?: string;             // Encrypted API key
    parameters?: object;         // Tool parameters
    timeout?: number;            // Request timeout
    retryCount?: number;         // Retry attempts
  };

  @Column({ default: true })
  isActive: boolean;             // Tool availability

  @Column({ type: 'int', default: 0 })
  usageCount: number;            // Times tool was used

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;             // Last usage timestamp

  // Relationships
  @ManyToOne(() => AIAgent, agent => agent.tools)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;
}
```

### AIAgentMemory Entity

```typescript
@Entity('ai_agent_memories')
@Index(['agentId', 'memoryType'])
@Index(['sessionId'])
@Index(['createdAt'])
export class AIAgentMemory extends BaseEntity {
  @Column('uuid')
  agentId: string;               // Reference to AIAgent

  @Column({ length: 100, nullable: true })
  sessionId?: string;            // Conversation session ID

  @Column({
    type: 'enum',
    enum: MemoryType,
    default: MemoryType.CONVERSATION
  })
  memoryType: MemoryType;        // Type of memory

  @Column({ length: 255 })
  key: string;                   // Memory key/identifier

  @Column('text')
  content: string;               // Memory content

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    importance?: number;         // Memory importance (0-1)
    tags?: string[];            // Memory tags
    expires?: Date;             // Expiration date
    source?: string;            // Content source
  };

  // Relationships
  @ManyToOne(() => AIAgent, agent => agent.memories)
  @JoinColumn({ name: 'agentId' })
  agent: AIAgent;
}

export enum MemoryType {
  CONVERSATION = 'conversation',  // Chat history
  EPISODIC = 'episodic',         // Specific events
  SEMANTIC = 'semantic',         // Facts and knowledge
  PROCEDURAL = 'procedural',     // Skills and procedures
}
```

## Authentication Module

### User Entity

```typescript
@Entity('users')
@Index(['email'], { unique: true })
@Index(['isActive'])
@Index(['role'])
@Index(['currentOrganizationId'])
export class User extends BaseEntity {
  @Column({ length: 255, unique: true })
  email: string;                 // User email (unique)

  @Column({ length: 255 })
  password: string;              // Hashed password (bcrypt)

  @Column({ length: 100 })
  firstName: string;             // User first name

  @Column({ length: 100 })
  lastName: string;              // User last name

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role: UserRole;                // User role

  @Column({ default: true })
  isActive: boolean;             // Account status

  @Column({ default: false })
  emailVerified: boolean;        // Email verification status

  @Column('uuid', { nullable: true })
  currentOrganizationId?: string; // Active organization

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastLoginAt?: Date;            // Last login timestamp

  @Column({ type: 'timestamp with time zone', nullable: true })
  passwordChangedAt?: Date;      // Password change timestamp

  @Column({ length: 500, nullable: true })
  avatar?: string;               // Avatar URL

  @Column({ type: 'jsonb', default: {} })
  preferences: {
    theme?: 'light' | 'dark';    // UI theme
    language?: string;           // Preferred language
    timezone?: string;           // User timezone
    notifications?: {
      email?: boolean;           // Email notifications
      push?: boolean;            // Push notifications
      workflow?: boolean;        // Workflow notifications
    };
  };

  @Column({ type: 'jsonb', default: {} })
  metadata: {
    loginCount?: number;         // Total logins
    lastIpAddress?: string;      // Last IP address
    userAgent?: string;          // Last user agent
    signupSource?: string;       // Signup source
  };

  // Methods
  async validatePassword(password: string): Promise<boolean> {
    return await bcrypt.compare(password, this.password);
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Relationships
  @OneToMany(() => OrganizationMember, member => member.user)
  organizationMemberships: OrganizationMember[];

  @OneToMany(() => Workflow, workflow => workflow.user)
  workflows: Workflow[];

  @OneToMany(() => Credential, credential => credential.user)
  credentials: Credential[];

  @OneToMany(() => ApiKey, apiKey => apiKey.user)
  apiKeys: ApiKey[];

  @OneToMany(() => ExecutionLimit, limit => limit.user)
  executionLimits: ExecutionLimit[];
}

export enum UserRole {
  ADMIN = 'admin',               // Full system access
  USER = 'user',                 // Standard user access
  READONLY = 'readonly',         // Read-only access
  GUEST = 'guest'                // Limited guest access
}
```

### ApiKey Entity

```typescript
@Entity('api_keys')
@Index(['userId'])
@Index(['keyHash'], { unique: true })
@Index(['isActive'])
@Index(['expiresAt'])
export class ApiKey extends BaseEntity {
  @Column('uuid')
  userId: string;                // Reference to User

  @Column({ length: 255 })
  name: string;                  // Key name/description

  @Column({ length: 64, unique: true })
  keyHash: string;               // Hashed API key (SHA-256)

  @Column({ length: 8 })
  keyPrefix: string;             // First 8 characters (for identification)

  @Column({ type: 'jsonb', default: [] })
  scopes: string[];              // Permitted scopes

  @Column({ default: true })
  isActive: boolean;             // Key status

  @Column({ type: 'timestamp with time zone', nullable: true })
  expiresAt?: Date;              // Expiration date

  @Column({ type: 'timestamp with time zone', nullable: true })
  lastUsedAt?: Date;             // Last usage timestamp

  @Column({ type: 'int', default: 0 })
  usageCount: number;            // Usage counter

  @Column({ type: 'jsonb', default: {} })
  rateLimits: {
    requestsPerMinute?: number;  // Requests per minute limit
    requestsPerHour?: number;    // Requests per hour limit
    requestsPerDay?: number;     // Requests per day limit
  };

  @Column({ type: 'jsonb', default: {} })
  permissions: {
    canRead?: boolean;           // Read permission
    canWrite?: boolean;          // Write permission
    canDelete?: boolean;         // Delete permission
    canExecute?: boolean;        // Execute workflows
    restrictedIPs?: string[];    // IP restrictions
  };

  // Relationships
  @ManyToOne(() => User, user => user.apiKeys)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Methods
  get isExpired(): boolean {
    return this.expiresAt ? new Date() > this.expiresAt : false;
  }
}
```

### ExecutionLimit Entity

```typescript
@Entity('execution_limits')
@Index(['userId'])
@Index(['limitType'])
@Index(['periodStart'])
export class ExecutionLimit extends BaseEntity {
  @Column('uuid')
  userId: string;                // Reference to User

  @Column({
    type: 'enum',
    enum: LimitType
  })
  limitType: LimitType;          // Type of limit

  @Column({ type: 'int' })
  maxExecutions: number;         // Maximum executions allowed

  @Column({ type: 'int', default: 0 })
  currentExecutions: number;     // Current execution count

  @Column({ type: 'timestamp with time zone' })
  periodStart: Date;             // Limit period start

  @Column({ type: 'timestamp with time zone' })
  periodEnd: Date;               // Limit period end

  @Column({ default: true })
  isActive: boolean;             // Limit status

  // Relationships
  @ManyToOne(() => User, user => user.executionLimits)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Methods
  get isExceeded(): boolean {
    return this.currentExecutions >= this.maxExecutions;
  }

  get remainingExecutions(): number {
    return Math.max(0, this.maxExecutions - this.currentExecutions);
  }
}

export enum LimitType {
  HOURLY = 'hourly',
  DAILY = 'daily',
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}
```

## Organizations Module

### Organization Entity (Detailed)

```typescript
@Entity('organizations')
@Index(['slug'], { unique: true })
@Index(['plan'])
@Index(['isActive'])
@Index(['stripeCustomerId'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  slug: string;                  // URL-friendly identifier

  @Column({ length: 255 })
  name: string;                  // Organization name

  @Column('text', { nullable: true })
  description?: string;          // Organization description

  @Column({ length: 500, nullable: true })
  logo?: string;                 // Logo URL

  @Column({ length: 255, nullable: true })
  website?: string;              // Organization website

  @Column({
    type: 'enum',
    enum: OrganizationPlan,
    default: OrganizationPlan.FREE
  })
  plan: OrganizationPlan;        // Subscription plan

  @Column({ type: 'jsonb', nullable: true })
  planLimits: PlanLimits;        // Plan-specific limits

  @Column({ type: 'jsonb', default: {} })
  customSettings: {
    branding?: {
      primaryColor?: string;     // Brand primary color
      secondaryColor?: string;   // Brand secondary color
      logoUrl?: string;          // Custom logo URL
    };
    security?: {
      enforceSSO?: boolean;      // Enforce SSO login
      allowedDomains?: string[]; // Allowed email domains
      sessionTimeout?: number;   // Session timeout minutes
    };
    workflow?: {
      defaultRetention?: number; // Default execution retention
      maxComplexity?: number;    // Max workflow complexity
    };
  };

  @Column({ default: true })
  isActive: boolean;             // Organization status

  @Column({ length: 100, nullable: true })
  stripeCustomerId?: string;     // Stripe customer ID

  @Column({ length: 100, nullable: true })
  stripeSubscriptionId?: string; // Stripe subscription ID

  @Column({ type: 'timestamp with time zone', nullable: true })
  trialEndsAt?: Date;            // Trial end date

  @Column({ type: 'int', default: 0 })
  currentMonthExecutions: number; // Current month usage

  @Column({ type: 'timestamp with time zone', nullable: true })
  executionResetDate?: Date;     // Usage reset date

  // Billing information
  @Column({ type: 'jsonb', nullable: true })
  billingInfo: {
    companyName?: string;        // Legal company name
    taxId?: string;              // Tax identification
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    billingEmail?: string;       // Billing contact email
  };

  // Relationships
  @OneToMany(() => OrganizationMember, member => member.organization, { cascade: true })
  members: OrganizationMember[];

  @OneToMany(() => Workflow, workflow => workflow.organization)
  workflows: Workflow[];

  @OneToMany(() => Credential, credential => credential.organization)
  credentials: Credential[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Methods
  getPlanLimits(): PlanLimits {
    return this.planLimits || this.getDefaultPlanLimits();
  }

  isWithinLimit(resource: keyof PlanLimits, current: number): boolean {
    const limits = this.getPlanLimits();
    const limit = limits[resource];
    return typeof limit === 'number' ? (limit === -1 || current < limit) : true;
  }

  canAddMember(): boolean {
    return this.isWithinLimit('maxTeamMembers', this.members?.length || 0);
  }

  canCreateWorkflow(): boolean {
    return this.isWithinLimit('maxWorkflows', this.workflows?.length || 0);
  }

  get isTrialExpired(): boolean {
    return this.trialEndsAt ? new Date() > this.trialEndsAt : false;
  }
}
```

### OrganizationMember Entity

```typescript
@Entity('organization_members')
@Index(['organizationId', 'userId'], { unique: true })
@Index(['role'])
@Index(['isActive'])
export class OrganizationMember extends BaseEntity {
  @Column('uuid')
  organizationId: string;        // Reference to Organization

  @Column('uuid')
  userId: string;                // Reference to User

  @Column({
    type: 'enum',
    enum: OrganizationRole,
    default: OrganizationRole.MEMBER
  })
  role: OrganizationRole;        // Member role

  @Column({ default: true })
  isActive: boolean;             // Membership status

  @Column({ type: 'timestamp with time zone', nullable: true })
  invitedAt?: Date;              // Invitation timestamp

  @Column({ type: 'timestamp with time zone', nullable: true })
  joinedAt?: Date;               // Join timestamp

  @Column('uuid', { nullable: true })
  invitedBy?: string;            // User who sent invitation

  @Column({ type: 'jsonb', default: {} })
  permissions: {
    workflows?: {
      create?: boolean;          // Can create workflows
      read?: boolean;            // Can view workflows
      update?: boolean;          // Can edit workflows
      delete?: boolean;          // Can delete workflows
      execute?: boolean;         // Can execute workflows
    };
    credentials?: {
      create?: boolean;          // Can create credentials
      read?: boolean;            // Can view credentials
      update?: boolean;          // Can edit credentials
      delete?: boolean;          // Can delete credentials
      use?: boolean;             // Can use credentials
    };
    organization?: {
      invite?: boolean;          // Can invite members
      manage?: boolean;          // Can manage organization
      billing?: boolean;         // Can manage billing
    };
  };

  // Relationships
  @ManyToOne(() => Organization, org => org.members)
  @JoinColumn({ name: 'organizationId' })
  organization: Organization;

  @ManyToOne(() => User, user => user.organizationMemberships)
  @JoinColumn({ name: 'userId' })
  user: User;

  // Methods
  get isPending(): boolean {
    return this.invitedAt != null && this.joinedAt == null;
  }

  hasPermission(resource: string, action: string): boolean {
    const resourcePermissions = this.permissions[resource];
    return resourcePermissions?.[action] === true;
  }
}

export enum OrganizationRole {
  OWNER = 'owner',               // Full control
  ADMIN = 'admin',               // Administrative access
  MEMBER = 'member',             // Standard access
  VIEWER = 'viewer'              // Read-only access
}
```

This is just the beginning of the in-depth documentation. Would you like me to continue with the remaining entities (Credentials, Workflows, Executions, Templates, Webhooks, Scheduler, and Monitoring modules) in the same level of detail?

Each entity documentation includes:
- Complete field definitions with types and constraints
- Database indexes for performance optimization
- Detailed relationships with foreign keys
- Business logic methods
- Enums and their meanings
- Metadata and configuration objects
- Performance counters and metrics
- Security and access control fields
- Timestamps and lifecycle tracking
