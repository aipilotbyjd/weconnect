# WeConnect Development Guide

## Overview

This development guide provides instructions for setting up the development environment, coding standards, testing strategies, and contributing guidelines for WeConnect.

## Environment Setup

### Prerequisites
- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **Redis**: 6.0 or higher
- **Docker**: 20.10.0 or higher (for containerized development)
- **pnpm**: Latest version (alternative package manager)

### Clone Repository

```bash
git clone <repository-url>
cd weconnect
```

### Install Dependencies

```bash
# Using pnpm for faster installation
pnpm install
```

### Environment Variables

Create a `.env` file from `.env.example` and customize it for your local setup:

```bash
cp .env.example .env
```

Edit the `.env` file to match your local configuration.

### Database Setup

Ensure PostgreSQL is installed and running locally:

```bash
sudo -u postgres psql
CREATE DATABASE weconnect;
CREATE USER weconnect WITH PASSWORD 'weconnect123';
GRANT ALL PRIVILEGES ON DATABASE weconnect TO weconnect;
\q
```

### Start Development Server

Using NestJS CLI to run the server:

```bash
# Start the NestJS application
docker-compose up --build
```

## Coding Standards

### ESLint  Prettier

We use ESLint and Prettier for code linting and formatting. Ensure your code complies with the set rules before committing.

```bash
# Lint and fix issues
docker-compose exec app npm run lint

# Format code
docker-compose exec app npm run format
```

### Commit Guidelines

We use conventional commits for organizing commit messages. Examples:

- `feat: add new login feature`
- `fix: correct typo in documentation`
- `refactor: cleanup code in the auth module`

### Branching Strategy

Main branching strategy:

- `main`: Stable production code
- `develop`: Development branch
- `feature/xxx`: New feature branches
- `bugfix/xxx`: Bug fix branches
- `hotfix/xxx`: Hotfix branches

### Testing Strategy

#### Unit Tests

All unit tests are inside the `__tests__` folder within each module. We use Jest for testing.

```bash
# Run unit tests
docker-compose exec app npm run test
```

#### End-to-End (E2E) Testing

E2E tests ensure that different parts of the application work together as expected.

```bash
# Run E2E tests
docker-compose exec app npm run test:e2e
```

#### Coverage

Generate a coverage report to evaluate test quality and coverage.

```bash
# Generate coverage report
docker-compose exec app npm run test:cov
```

## Contributing Guidelines

### Reporting Issues

Feel free to open issues on GitHub. Include detailed information about the problem and any relevant code snippets.

### Creating Pull Requests

1. Fork the repository and create your branch from `develop`.
2. Ensure that your code builds successfully.
3. Run all tests and ensure they pass.
4. Verify your code with linting and formatting tools.
5. Create a pull request with a clear description of your changes.

### Reviews and Merging

- All pull requests require at least one approval from another team member.
- Constantly rebase your branch to integrate the latest changes from `develop`.
- All tests must pass before the pull request is merged.

### Continuous Integration

CI is set up to automatically run tests, lint checks, and build verification on every push and pull request using GitHub Actions.

## Documentation

Ensure all new features and important changes are documented. Update the relevant documentation files and README with clear examples and explanations.

## Troubleshooting

### Common Issues

**Dependencies Not Installing:**

- Ensure you have the correct Node.js version.
- Try cleaning the npm cache and reinstalling:

```bash
npm cache clean --force
pnpm install
```

**Database Connection Failed:**

- Ensure PostgreSQL is running and credentials match in `.env`.

**Tests Failing:**

- Ensure you have the correct test data and environment.
- Check for missing migrations or modifications in schema not reflected in test.

**Linting Errors:**

- Make sure you have the correct ESLint and Prettier setup.
- Use `npm run lint` for auto-fixing issues.

## Support

For questions and support, refer to:
- **Contributor's Guide**: [link-to-guide]
- **Discord Channel**: [link-to-discord]
- **Email**: support@weconnect.com

