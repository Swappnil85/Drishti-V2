# Drishti

**AI-Powered Visual Assistance Application**
Note: This repository is in Frontend V2 planning mode. See DOCS/RESET_NOTICE.md and DOCS/v2.


Drishti is an innovative mobile application that leverages artificial intelligence to provide visual assistance and enhance accessibility for users. The application combines advanced computer vision, natural language processing, and mobile technology to deliver intelligent visual interpretation and assistance.

## 🏗️ Architecture

This project uses a **monorepo structure** with the following components:

- **`apps/api`** - Fastify-based Node.js backend API with PostgreSQL database
- ~~**`apps/mobile`** - React Native Expo mobile application with TypeScript~~ (archived → `apps/_archive/mobile-v1/`)
- **`packages/shared`** - Shared utilities and types across applications

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20.0.0 (use `nvm use` to match .nvmrc)
- npm >= 10.0.0
- PostgreSQL (for API backend)
- Expo CLI (for mobile development)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/Swappnil85/Drishti.git
   cd Drishti
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp apps/api/.env.example apps/api/.env
   # Configure your database and API settings
   ```

### Development

Start all applications in development mode:

```bash
npm run dev
```

Or run individual applications:

```bash
# API Backend
npm run dev --workspace=apps/api

# Mobile App (archived)
# npm run dev --workspace=apps/mobile
# See apps/_archive/mobile-v1/
```
Note: Mobile V1 is archived under apps/_archive/mobile-v1/. V2 scaffolding will begin after PRD/Epics approval.


## 🚀 Development Status

### ✅ Epic 1: Core Infrastructure - COMPLETE

- Database setup with WatermelonDB (mobile) and PostgreSQL (backend)
- API foundation with Fastify
- Mobile app foundation with React Native + Expo
- Development environment setup

### ✅ Epic 2: Authentication & Authorization - COMPLETE

- ✅ **User Registration & Login**: PostgreSQL-based user management with email verification
- ✅ **OAuth Integration**: Google and Apple Sign-In with JWT token management
- ✅ **Biometric Authentication**: Face ID, Touch ID, Fingerprint support across platforms
- ✅ **Session Management**: Advanced session tracking with device fingerprinting and security monitoring
- ⚠️ **Security Status**: [Critical security hardening required](https://github.com/Swappnil85/Drishti/issues/1) before production deployment

### 🔄 Epic 3: AI Vision Processing - PLANNED

- Camera integration and image capture
- AI-powered image analysis and description
- Real-time object detection and recognition
- Accessibility features for visual assistance

### Frontend V2 (planning only)

See DOCS/RESET_NOTICE.md and DOCS/v2 for planning artifacts. No new frontend code exists yet.

## 📱 Applications

### API Backend (`apps/api`)

- **Framework**: Fastify
- **Database**: PostgreSQL with Redis caching
- **Language**: TypeScript
- **Features**:
  - RESTful API with comprehensive authentication
  - JWT token management with session tracking
  - OAuth providers (Google, Apple)
  - Multi-factor authentication support
  - Rate limiting and security middleware

### Mobile App (`apps/mobile`)

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Features**:
  - Biometric authentication (Face ID, Touch ID, Fingerprint)
  - Secure credential storage with Expo SecureStore
  - Cross-platform OAuth integration
  - Local database with WatermelonDB
  - Camera integration (planned)

## 🛠️ Development Scripts

- `npm run dev` - Start all applications in development mode
- `npm run build` - Build all applications
- `npm run test` - Run tests across all workspaces
- `npm run lint` - Run ESLint across all workspaces
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 📋 Project Structure

```
Drishti/
├── apps/
│   ├── api/          # Backend API
│   └── _archive/mobile-v1/  # Archived mobile application
├── packages/
│   └── shared/       # Shared utilities
├── DOCS/             # Project documentation
├── .github/          # GitHub Actions workflows
└── ...
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions and support, please open an issue in the GitHub repository.
