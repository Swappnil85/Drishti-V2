# Drishti

**AI-Powered Visual Assistance Application**

Drishti is an innovative mobile application that leverages artificial intelligence to provide visual assistance and enhance accessibility for users. The application combines advanced computer vision, natural language processing, and mobile technology to deliver intelligent visual interpretation and assistance.

## 🏗️ Architecture

This project uses a **monorepo structure** with the following components:

- **`apps/api`** - Fastify-based Node.js backend API with PostgreSQL database
- **`apps/mobile`** - React Native Expo mobile application with TypeScript
- **`packages/shared`** - Shared utilities and types across applications

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
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

# Mobile App
npm run dev --workspace=apps/mobile
```

## 📱 Applications

### API Backend (`apps/api`)
- **Framework**: Fastify
- **Database**: PostgreSQL
- **Language**: TypeScript
- **Features**: RESTful API, Authentication, AI Integration

### Mobile App (`apps/mobile`)
- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Features**: Camera Integration, AI-powered Visual Analysis, Accessibility Features

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
│   └── mobile/       # Mobile application
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
