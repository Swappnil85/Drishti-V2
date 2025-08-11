# Getting Started

## Quick Start Guide

This guide will help you set up the Drishti development environment and start contributing to the project.

## Prerequisites

### Required Software

- **Node.js**: 18.0.0 or higher ([Download](https://nodejs.org/))
- **npm**: 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version ([Download](https://git-scm.com/))
- **PostgreSQL**: 15 or higher ([Download](https://postgresql.org/))

### Mobile Development (Optional)

- **Expo CLI**: `npm install -g @expo/cli`
- **Android Studio**: For Android development
- **Xcode**: For iOS development (macOS only)

### Recommended Tools

- **VS Code**: With recommended extensions
- **Postman/Insomnia**: For API testing
- **pgAdmin/TablePlus**: For database management

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/Swappnil85/Drishti.git
cd Drishti
```

### 2. Install Dependencies

```bash
# Install all dependencies for the monorepo
npm install
```

### 3. Database Setup

```bash
# Start PostgreSQL service
# macOS (with Homebrew)
brew services start postgresql@15

# Ubuntu/Debian
sudo systemctl start postgresql

# Create development database
createdb drishti_dev

# Create database user
psql -d postgres -c "CREATE USER drishti_user WITH PASSWORD 'dev_password';"
psql -d postgres -c "GRANT ALL PRIVILEGES ON DATABASE drishti_dev TO drishti_user;"
```

### 4. Environment Configuration

```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit the environment file
nano apps/api/.env
```

**Required Environment Variables:**

```env
PORT=3000
DATABASE_URL=postgresql://drishti_user:dev_password@localhost:5432/drishti_dev
JWT_SECRET=your-development-jwt-secret
LOG_LEVEL=debug
```

### 5. Start Development Servers

#### Terminal 1 - API Backend

```bash
npm run dev --workspace=apps/api
```

#### Terminal 2 - Mobile App

```bash
npm run dev --workspace=apps/_archive/mobile-v1/
```

### 6. Verify Setup

- **API**: Visit `http://localhost:3000/health`
- **API Docs**: Visit `http://localhost:3000/docs`
- **Mobile**: Scan QR code with Expo Go app

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature-name
```

### 2. Make Changes

- Follow coding standards (see [CODING_STANDARDS.md](./CODING_STANDARDS.md))
- Write tests for new functionality
- Update documentation as needed

### 3. Test Your Changes

```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Run type checking
npm run type-check

# Format code
npm run format
```

### 4. Commit Changes

```bash
# Stage changes
git add .

# Commit with descriptive message
git commit -m "feat: add user authentication endpoint"
```

### 5. Push and Create PR

```bash
# Push to your feature branch
git push origin feature/your-feature-name

# Create pull request via GitHub UI
```

## Project Structure

```
Drishti/
├── apps/
│   ├── api/                 # Backend API (Fastify + PostgreSQL)
│   │   ├── src/
│   │   │   ├── routes/      # API route handlers
│   │   │   ├── services/    # Business logic
│   │   │   ├── models/      # Database models
│   │   │   ├── middleware/  # Custom middleware
│   │   │   └── utils/       # Utility functions
│   │   ├── tests/           # API tests
│   │   └── migrations/      # Database migrations
│   └── mobile/              # Mobile app (React Native + Expo)
│       ├── src/
│       │   ├── components/  # Reusable components
│       │   ├── screens/     # Screen components
│       │   ├── navigation/  # Navigation setup
│       │   ├── services/    # API services
│       │   ├── store/       # State management
│       │   └── utils/       # Utility functions
│       └── assets/          # Static assets
├── packages/
│   └── shared/              # Shared types and utilities
│       ├── src/
│       │   ├── types/       # TypeScript types
│       │   ├── utils/       # Shared utilities
│       │   └── constants/   # Shared constants
│       └── tests/           # Shared package tests
├── DOCS/                    # Project documentation
└── .github/                 # GitHub Actions workflows
```

## Available Scripts

### Root Level Scripts

```bash
# Development
npm run dev              # Start all apps in development mode
npm run build            # Build all packages
npm run test             # Run all tests
npm run lint             # Run ESLint on all packages
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript type checking

# Workspace-specific scripts
npm run dev --workspace=apps/api      # Start API only
npm run dev --workspace=apps/_archive/mobile-v1/   # Start mobile app only
npm run test --workspace=apps/api     # Test API only
```

### API Scripts

```bash
cd apps/api

npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server
npm run test             # Run API tests
npm run test:watch       # Run tests in watch mode
npm run migrate          # Run database migrations
npm run seed             # Seed database with test data
```

### Mobile Scripts

```bash
cd apps/_archive/mobile-v1/

npm run start            # Start Expo development server
npm run android          # Start on Android emulator
npm run ios              # Start on iOS simulator
npm run web              # Start web version
npm run test             # Run mobile app tests
npm run build            # Build for production
```

## Development Tools

### VS Code Extensions

Install the following extensions for the best development experience:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "expo.vscode-expo-tools",
    "ms-vscode.vscode-react-native"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.workingDirectories": ["apps/api", "apps/_archive/mobile-v1/", "packages/shared"]
}
```

## Debugging

### API Debugging

```typescript
// Use built-in Fastify logger
fastify.log.info('User logged in', { userId: user.id });
fastify.log.error('Database error', { error: error.message });

// Debug with VS Code
// Add to launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug API",
  "program": "${workspaceFolder}/apps/api/src/index.ts",
  "runtimeArgs": ["-r", "tsx/cjs"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

### Mobile Debugging

```bash
# Start with debugging enabled
npx expo start --dev-client

# Use React Native Debugger
npm install -g react-native-debugger

# Debug with Flipper (for advanced debugging)
npx expo install react-native-flipper
```

## Testing

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testPathPattern=auth.test.ts
```

### Writing Tests

```typescript
// API endpoint test example
describe('POST /auth/login', () => {
  test('should login with valid credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'test@example.com',
        password: 'password123'
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().success).toBe(true);
  });
});

// Mobile component test example
describe('Button Component', () => {
  test('should render with correct title', () => {
    const { getByText } = render(
      <Button title="Test Button" onPress={() => {}} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });
});
```

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `apps/api/src/routes/`
2. Add validation schema using Zod
3. Implement business logic in service layer
4. Add tests for the endpoint
5. Update API documentation

### Adding a New Mobile Screen

1. Create screen component in `apps/_archive/mobile-v1//src/screens/`
2. Add navigation configuration
3. Implement state management if needed
4. Add accessibility features
5. Write component tests

### Adding Shared Types

1. Define types in `packages/shared/src/types.ts`
2. Export from `packages/shared/src/index.ts`
3. Build shared package: `npm run build --workspace=packages/shared`
4. Use in API and mobile apps

## Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Database Connection Issues

```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Restart PostgreSQL
brew services restart postgresql@15
```

#### Mobile App Won't Start

```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro cache
npx expo start --reset-cache

# Fix SDK version mismatch
npx expo install --fix
npm install expo@~53.0.0 --legacy-peer-deps

# Fix web blank screen - ensure proper entry point
# Update package.json: "main": "index.js"
# Create index.js with registerRootComponent
```

#### Web App Shows Blank Screen

```bash
# Install missing dependencies
npm install react-native-web@~0.19.13 --legacy-peer-deps
npm install expo-constants@~17.1.7 --legacy-peer-deps

# Update core dependencies
npm install react@19.0.0 react-dom@19.0.0 react-native@0.79.5 --legacy-peer-deps

# Ensure proper app registration (see Troubleshooting Guide)
```

#### Expo SDK Version Mismatch

```bash
# Check Expo Go app version compatibility
npx expo doctor

# Upgrade to compatible SDK version
npx expo install --fix
npm install expo@~53.0.0 --legacy-peer-deps

# Clear cache and restart
npx expo start --clear --reset-cache
```

#### TypeScript Errors

```bash
# Clean TypeScript cache
rm -rf node_modules/.cache
rm -rf apps/*/node_modules/.cache

# Rebuild TypeScript references
npm run build
```

### Getting Help

- Check existing [GitHub Issues](https://github.com/Swappnil85/Drishti/issues)
- Review [Troubleshooting Guide](../guides/TROUBLESHOOTING.md) for detailed solutions
- Check [Mobile Setup Issues](../guides/TROUBLESHOOTING.md#mobile-development-issues) for Expo/React Native problems
- Ask questions in team chat or create new issue
