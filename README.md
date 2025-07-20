# WeConnect - Workflow Automation Platform

WeConnect is a powerful, self-hosted workflow automation platform similar to n8n and Zapier. It enables users to create, manage, and execute automated workflows through a visual interface with extensive integration capabilities.

## 🚀 Features

### Core Workflow Engine
- **Visual Workflow Builder**: Drag-and-drop interface for creating complex workflows
- **Node-based Architecture**: Modular system with 50+ built-in nodes
- **Real-time Execution**: Live workflow execution with detailed logging
- **Error Handling**: Comprehensive error handling with retry mechanisms
- **Conditional Logic**: Advanced branching and conditional execution
- **Data Transformation**: Powerful data manipulation and transformation tools

### Built-in Integrations
- **HTTP/REST APIs**: Advanced HTTP client with authentication support
- **Databases**: MongoDB, MySQL, PostgreSQL, Redis
- **Communication**: Slack, Discord, Email (SMTP), Telegram
- **Cloud Services**: AWS S3, Google Sheets, Google APIs
- **Development**: GitHub, GitLab, Docker
- **Productivity**: Notion, Airtable, Trello
- **AI/ML**: OpenAI, Anthropic, Google AI, Azure OpenAI

### Enterprise Features
- **Multi-tenant Architecture**: Organization-based isolation
- **Role-based Access Control**: Granular permissions system
- **Credential Management**: Secure credential storage with encryption
- **Webhook Triggers**: HTTP webhooks with authentication
- **Scheduled Execution**: Cron-based workflow scheduling
- **API Access**: RESTful API for external integrations
- **Monitoring & Analytics**: Execution metrics and performance monitoring

## 🏗️ Architecture

### Technology Stack
- **Backend**: NestJS with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Queue System**: Bull/BullMQ with Redis
- **Authentication**: JWT with Passport strategies
- **Containerization**: Docker with multi-stage builds
- **Monitoring**: Built-in metrics and logging

### Project Structure
```
weconnect/
├── src/
│   ├── core/                   # Core infrastructure
│   ├── config/                 # Configuration files
│   └── modules/
│       ├── workflows/          # Workflow management
│       ├── nodes/              # Node definitions and executors
│       ├── executions/         # Execution engine
│       ├── auth/               # Authentication & authorization
│       ├── organizations/      # Multi-tenant management
│       ├── credentials/        # Secure credential storage
│       ├── webhooks/           # Webhook handling
│       ├── scheduler/          # Scheduled execution
│       ├── templates/          # Workflow templates
│       ├── ai-agents/          # AI/LLM integration
│       └── monitoring/         # System monitoring
├── docker-compose.yml          # Production setup
├── docker-compose.override.yml # Development setup
└── nginx/                      # Reverse proxy config
```

## 🚀 Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- MongoDB 7+
- Redis 7+

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd weconnect
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start development environment**
   ```bash
   # Using Docker (recommended)
   docker-compose up --build -d
   
   # Or locally
   npm run start:dev
   ```

5. **Access the application**
   - API: http://localhost:3000
   - MongoDB GUI: http://localhost:8080 (admin/admin)
   - Redis GUI: http://localhost:8081

### Production Deployment

1. **Create secrets**
   ```bash
   mkdir secrets
   echo "your-secure-password" > secrets/db_password.txt
   ```

2. **Deploy with Docker**
   ```bash
   docker-compose -f docker-compose.yml up --build -d
   ```

3. **Access via Nginx**
   - Application: http://localhost

## 📚 Node Types

### Trigger Nodes
- **Webhook Trigger**: HTTP webhook endpoints with authentication
- **Schedule Trigger**: Cron-based scheduling
- **Manual Trigger**: Manual workflow execution

### Action Nodes
- **HTTP Request**: Advanced HTTP client with retry logic
- **Database Operations**: CRUD operations for multiple databases
- **Email**: Send emails via SMTP
- **File Operations**: File system operations
- **Data Transformation**: Powerful data manipulation

### Integration Nodes
- **Slack**: Send messages, create channels, manage users
- **Google Sheets**: Read/write spreadsheet data
- **GitHub**: Repository operations, issue management
- **AWS S3**: File upload/download operations
- **OpenAI**: AI text generation and processing

### Utility Nodes
- **Condition**: Conditional branching logic
- **Delay**: Workflow pausing
- **Code**: Custom JavaScript execution
- **Merge**: Data merging operations
- **Split**: Array/object splitting

## 🔧 Configuration

### Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DB_HOST=mongodb
DB_PORT=27017
DB_USERNAME=weconnect
DB_PASSWORD=your-password
DB_DATABASE=weconnect

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# Security
JWT_SECRET=your-jwt-secret
ENCRYPTION_KEY=your-32-char-encryption-key
```

### MongoDB Configuration
The application uses MongoDB as the primary database with the following collections:
- `workflows` - Workflow definitions
- `workflow_nodes` - Individual workflow nodes
- `workflow_executions` - Execution history
- `users` - User accounts
- `organizations` - Multi-tenant organizations
- `credentials` - Encrypted credential storage

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication
- Role-based access control (RBAC)
- Organization-level isolation
- API key authentication for webhooks

### Credential Management
- AES-256 encryption for sensitive data
- Credential sharing with permissions
- Automatic credential rotation
- OAuth2 flow support

### Security Best Practices
- Input validation and sanitization
- Rate limiting on API endpoints
- CORS configuration
- Secure headers with Helmet
- SQL injection prevention
- XSS protection

## 📊 Monitoring & Observability

### Execution Monitoring
- Real-time execution status
- Detailed execution logs
- Performance metrics
- Error tracking and alerting

### System Metrics
- Workflow execution statistics
- Node performance analytics
- Resource usage monitoring
- Queue health monitoring

### Logging
- Structured JSON logging
- Log levels (DEBUG, INFO, WARN, ERROR)
- Request/response logging
- Audit trail for sensitive operations

## 🔌 API Documentation

### REST API Endpoints
- `GET /api/workflows` - List workflows
- `POST /api/workflows` - Create workflow
- `PUT /api/workflows/:id` - Update workflow
- `POST /api/workflows/:id/execute` - Execute workflow
- `GET /api/executions` - List executions
- `GET /api/nodes` - List available nodes

### Webhook Endpoints
- `POST /webhook/:workflowId/:nodeId` - Trigger webhook
- `GET /webhook/:workflowId/:nodeId` - Webhook info

### Authentication
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Use token
curl -H "Authorization: Bearer <token>" \
  http://localhost:3000/api/workflows
```

## 🧪 Testing

### Running Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Test Structure
- Unit tests for services and utilities
- Integration tests for API endpoints
- E2E tests for complete workflows
- Performance tests for execution engine

## 🚀 Deployment Options

### Docker Deployment
- Multi-stage Docker builds
- Production-optimized images
- Health checks and monitoring
- Automatic restarts

### Kubernetes Deployment
- Helm charts available
- Horizontal pod autoscaling
- Persistent volume claims
- Service mesh integration

### Cloud Deployment
- AWS ECS/Fargate support
- Google Cloud Run compatibility
- Azure Container Instances
- DigitalOcean App Platform

## 🤝 Contributing

### Development Guidelines
1. Follow TypeScript best practices
2. Write comprehensive tests
3. Document new features
4. Follow conventional commits
5. Update API documentation

### Adding New Nodes
1. Create node definition in `src/modules/nodes/infrastructure/built-in/`
2. Implement `INodeExecutor` interface
3. Register in `built-in-nodes.service.ts`
4. Add tests and documentation

### Code Quality
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks
- Automated testing on CI/CD

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Documentation
- [API Reference](docs/api.md)
- [Node Development Guide](docs/nodes.md)
- [Deployment Guide](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

### Community
- GitHub Issues for bug reports
- GitHub Discussions for questions
- Discord community (coming soon)
- Stack Overflow tag: `weconnect`

## 🗺️ Roadmap

### Upcoming Features
- [ ] Visual workflow editor UI
- [ ] Workflow templates marketplace
- [ ] Advanced debugging tools
- [ ] Workflow versioning system
- [ ] Multi-language support
- [ ] Mobile app for monitoring
- [ ] Advanced analytics dashboard
- [ ] Workflow collaboration features

### Integration Roadmap
- [ ] Salesforce integration
- [ ] HubSpot integration
- [ ] Shopify integration
- [ ] Stripe payment processing
- [ ] Twilio SMS/Voice
- [ ] Microsoft Office 365
- [ ] Jira/Confluence
- [ ] Zendesk support

---

**WeConnect** - Empowering automation for everyone 🚀