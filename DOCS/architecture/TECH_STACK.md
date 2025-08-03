# Technology Stack - Drishti

## Overview

Drishti uses a modern, TypeScript-first technology stack designed for performance, developer experience, and maintainability. This document serves as the **single source of truth** for all technology decisions and specifications across the project.

> **📋 Note for Epic Documentation**: Epic documents should reference this file instead of repeating technology stack information. See [Tech Stack Reference Template](../_templates/TECH_STACK_REFERENCE.md) for standardized reference patterns.

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
- **Ecosystem**: Rich plugin ecosystem for enterprise features

### Why React Native with Expo?
- **Cross-platform**: Single codebase for iOS and Android
- **Developer Experience**: Hot reload, easy debugging
- **Native APIs**: Easy access to camera, sensors, etc.
- **Community**: Large ecosystem and community support
- **Deployment**: Simplified build and deployment process

### Why PostgreSQL?
- **ACID Compliance**: Data integrity and consistency
- **JSON Support**: Flexible schema with JSONB
- **Performance**: Excellent query performance
- **Extensions**: Rich ecosystem of extensions
- **Scalability**: Proven scalability for enterprise applications

### Why Zustand over Redux?
- **Simplicity**: Less boilerplate code
- **TypeScript**: Excellent TypeScript integration
- **Performance**: Minimal re-renders
- **Bundle Size**: Smaller footprint
- **Learning Curve**: Easier for team adoption

### Why Drizzle ORM?
- **Type Safety**: Full TypeScript integration
- **Performance**: Lightweight with minimal overhead
- **SQL-like**: Familiar SQL-like query syntax
- **Migration System**: Robust schema migration support
- **Developer Experience**: Excellent IntelliSense and debugging

## Version Specifications

### Current Versions (Production)
- **Node.js**: 18.19.0 LTS
- **React Native**: 0.72.3
- **Expo SDK**: 49.0.0
- **TypeScript**: 5.1.3+
- **Fastify**: 4.21.0+
- **PostgreSQL**: 15.4+
- **Drizzle ORM**: Latest stable

### Upgrade Schedule
- **Node.js**: Upgrade to 20 LTS in Q2 2025
- **React Native**: Upgrade to 0.73+ when stable
- **Expo SDK**: Upgrade to 50+ when available
- **PostgreSQL**: Upgrade to 16+ in Q3 2025

## Epic-Specific Technology Usage

### Epic 1: Core Infrastructure
- **Primary Focus**: Foundation setup, basic CRUD operations
- **Key Technologies**: Fastify, PostgreSQL, React Native, Expo
- **Special Considerations**: Mock database for initial development

### Epic 2: Authentication & Security
- **Primary Focus**: JWT authentication, security hardening
- **Key Technologies**: @fastify/jwt, bcryptjs, Expo SecureStore
- **Special Considerations**: Hardware-backed security, OAuth integration

### Epic 3: Data Models & Local Database
- **Primary Focus**: Offline-first architecture, data encryption
- **Key Technologies**: WatermelonDB, Expo SecureStore, Custom encryption
- **Special Considerations**: Local-first design, background sync

### Epic 4: Navigation & UI Framework
- **Primary Focus**: Navigation system, UI component library
- **Key Technologies**: React Navigation, Custom theming, Expo Haptics
- **Special Considerations**: Accessibility, responsive design

## Technology Decision Log

### Approved Technologies
- ✅ **Fastify**: Approved for all API development
- ✅ **React Native + Expo**: Approved for mobile development
- ✅ **PostgreSQL**: Approved for production database
- ✅ **TypeScript**: Mandatory for all new code
- ✅ **Zustand**: Approved for state management
- ✅ **Drizzle ORM**: Approved for database operations
- ✅ **Jest**: Approved for testing framework

### Under Evaluation
- 🔄 **Docker**: Containerization for deployment
- 🔄 **Sentry**: Error tracking and monitoring
- 🔄 **Pino**: High-performance logging
- 🔄 **Sharp**: Image processing capabilities

### Deprecated/Avoided
- ❌ **Express**: Replaced by Fastify for performance
- ❌ **Redux**: Replaced by Zustand for simplicity
- ❌ **SQLite**: Replaced by PostgreSQL for production
- ❌ **Prisma**: Replaced by Drizzle for TypeScript integration
