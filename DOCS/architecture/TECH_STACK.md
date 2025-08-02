# Technology Stack

## Overview

Drishti uses a modern, TypeScript-first technology stack designed for performance, developer experience, and maintainability.

## Frontend (Mobile App)

### Core Framework
- **React Native 0.72.3** - Cross-platform mobile development
- **Expo SDK 49** - Development tooling and native APIs
- **TypeScript 5.1+** - Type safety and developer experience

### UI & Navigation
- **React Navigation v6** - Navigation library
- **React Native Vector Icons** - Icon library
- **React Native Gesture Handler** - Touch gesture handling
- **React Native Reanimated** - Smooth animations

### State Management
- **Zustand** - Lightweight state management
- **React Query/TanStack Query** - Server state management (future)

### Development Tools
- **Expo CLI** - Development and build tooling
- **Metro** - JavaScript bundler
- **Flipper** - Debugging and profiling

## Backend (API)

### Core Framework
- **Node.js 18+** - JavaScript runtime
- **Fastify 4.21+** - High-performance web framework
- **TypeScript 5.1+** - Type safety and developer experience

### Database & ORM
- **PostgreSQL 15+** - Primary database
- **Drizzle ORM** - Type-safe database toolkit
- **Drizzle Kit** - Database migrations and introspection

### Authentication & Security
- **@fastify/jwt** - JWT token handling
- **@fastify/helmet** - Security headers
- **@fastify/cors** - Cross-origin resource sharing
- **@fastify/rate-limit** - Rate limiting
- **bcryptjs** - Password hashing

### API Documentation
- **@fastify/swagger** - OpenAPI specification
- **@fastify/swagger-ui** - Interactive API documentation

### File Handling
- **@fastify/multipart** - File upload handling
- **Sharp** - Image processing (future)

## Shared Libraries

### Validation & Types
- **Zod** - Runtime type validation
- **TypeScript** - Compile-time type checking

### Utilities
- **date-fns** - Date manipulation (future)
- **lodash** - Utility functions (future)

## AI & Machine Learning

### Computer Vision
- **OpenAI GPT-4 Vision** - Image analysis and description
- **Google Cloud Vision API** - Object detection and OCR
- **Azure Cognitive Services** - Additional vision capabilities

### Natural Language Processing
- **OpenAI GPT-4** - Text generation and processing
- **Speech-to-Text APIs** - Voice input processing

## Development Tools

### Code Quality
- **ESLint** - JavaScript/TypeScript linting
- **Prettier** - Code formatting
- **Husky** - Git hooks (future)
- **lint-staged** - Staged file linting (future)

### Testing
- **Jest** - Unit and integration testing
- **Testing Library** - Component testing
- **Supertest** - API endpoint testing (future)

### Build & Deployment
- **TypeScript Compiler** - Type checking and compilation
- **tsx** - TypeScript execution for development
- **Docker** - Containerization (future)

## DevOps & Infrastructure

### Version Control
- **Git** - Source code management
- **GitHub** - Repository hosting and collaboration

### CI/CD
- **GitHub Actions** - Continuous integration and deployment
- **npm** - Package management and workspaces

### Monitoring & Logging
- **Fastify Logger** - Structured logging
- **Pino** - High-performance logging (future)
- **Sentry** - Error tracking (future)

## Package Management

### Monorepo Management
- **npm Workspaces** - Monorepo package management
- **TypeScript Project References** - Build optimization

### Dependency Management
- **npm** - Primary package manager
- **package-lock.json** - Dependency locking
- **npm audit** - Security vulnerability scanning

## Development Environment

### Required Software
- **Node.js 18+** - JavaScript runtime
- **npm 9+** - Package manager
- **PostgreSQL 15+** - Database
- **Expo CLI** - Mobile development
- **Android Studio/Xcode** - Mobile device testing

### Recommended Tools
- **VS Code** - Code editor
- **Postman/Insomnia** - API testing
- **pgAdmin/TablePlus** - Database management
- **React Native Debugger** - Mobile debugging

## Technology Rationale

### Why Fastify over Express?
- **Performance**: 2-3x faster than Express
- **TypeScript**: First-class TypeScript support
- **Plugin System**: Modular and extensible architecture
- **Validation**: Built-in request/response validation

### Why React Native with Expo?
- **Cross-platform**: Single codebase for iOS and Android
- **Developer Experience**: Hot reload, easy debugging
- **Native APIs**: Easy access to camera, sensors, etc.
- **Community**: Large ecosystem and community support

### Why PostgreSQL?
- **ACID Compliance**: Data integrity and consistency
- **JSON Support**: Flexible schema with JSONB
- **Performance**: Excellent query performance
- **Extensions**: Rich ecosystem of extensions

### Why Zustand over Redux?
- **Simplicity**: Less boilerplate code
- **TypeScript**: Excellent TypeScript integration
- **Performance**: Minimal re-renders
- **Bundle Size**: Smaller footprint
