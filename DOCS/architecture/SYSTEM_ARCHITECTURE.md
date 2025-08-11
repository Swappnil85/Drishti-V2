# System Architecture

## Overview

Drishti follows a modern microservices architecture with a clear separation between the mobile client, API backend, and shared utilities. The system is designed for scalability, maintainability, and performance.

## High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│   Mobile App    │◄──►│   API Backend   │◄──►│   PostgreSQL    │
│  (React Native) │    │   (Fastify)     │    │   Database      │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Shared Types   │    │   AI Services   │    │   File Storage  │
│   & Utilities   │    │  (OpenAI, etc.) │    │   (Local/Cloud) │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Component Architecture

### 1. Mobile Application (`apps/_archive/mobile-v1/`)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation v6
- **Key Features**:
  - Camera integration for image/video capture
  - Real-time AI analysis display
  - Offline capability for basic features
  - Accessibility features (screen reader support, voice feedback)

### 2. API Backend (`apps/api`)
- **Framework**: Fastify (Node.js)
- **Language**: TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT-based
- **Key Features**:
  - RESTful API design
  - AI service integration
  - File upload and processing
  - Rate limiting and security

### 3. Shared Package (`packages/shared`)
- **Purpose**: Common types, utilities, and constants
- **Language**: TypeScript
- **Validation**: Zod schemas
- **Key Features**:
  - Type safety across applications
  - Shared business logic
  - Common utilities and helpers

## Data Flow

### Image Analysis Flow
1. **Capture**: User captures image/video via mobile app
2. **Upload**: Media uploaded to API backend
3. **Processing**: API sends media to AI services for analysis
4. **Storage**: Results stored in PostgreSQL database
5. **Response**: Analysis results returned to mobile app
6. **Display**: Results displayed with accessibility features

### Authentication Flow
1. **Login**: User authenticates via mobile app
2. **JWT**: API returns JWT token
3. **Storage**: Token stored securely on device
4. **Requests**: Token included in subsequent API requests
5. **Validation**: API validates token for protected endpoints

## Security Considerations

### API Security
- JWT-based authentication
- Rate limiting to prevent abuse
- CORS configuration for cross-origin requests
- Helmet.js for security headers
- Input validation with Zod schemas

### Mobile Security
- Secure token storage
- Certificate pinning for API communication
- Biometric authentication support
- Secure file handling

### Data Security
- Encrypted database connections
- Secure file storage
- GDPR compliance considerations
- Data retention policies

## Scalability Design

### Horizontal Scaling
- Stateless API design
- Database connection pooling
- Load balancer ready
- Microservices architecture

### Performance Optimization
- Efficient database queries
- Image compression and optimization
- Caching strategies
- Lazy loading in mobile app

## Technology Decisions

### Backend: Fastify vs Express
- **Chosen**: Fastify
- **Rationale**: Better performance, built-in TypeScript support, modern plugin system

### Database: PostgreSQL vs MongoDB
- **Chosen**: PostgreSQL
- **Rationale**: ACID compliance, complex queries, mature ecosystem

### Mobile: React Native vs Native
- **Chosen**: React Native with Expo
- **Rationale**: Cross-platform development, rapid prototyping, shared codebase

### State Management: Zustand vs Redux
- **Chosen**: Zustand
- **Rationale**: Simpler API, less boilerplate, TypeScript-first
