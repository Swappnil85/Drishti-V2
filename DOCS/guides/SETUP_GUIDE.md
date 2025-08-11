# Complete Setup Guide

## Overview

This comprehensive guide walks you through setting up the Drishti development environment from scratch, including all dependencies, tools, and configurations needed for full-stack development.

## System Requirements

### Minimum Requirements
- **RAM**: 8GB (16GB recommended)
- **Storage**: 20GB free space (50GB recommended)
- **OS**: macOS 10.15+, Windows 10+, or Ubuntu 18.04+
- **Internet**: Stable broadband connection

### Recommended Specifications
- **RAM**: 16GB or higher
- **Storage**: SSD with 50GB+ free space
- **CPU**: Multi-core processor (Intel i5/AMD Ryzen 5 or better)
- **Display**: 1920x1080 or higher resolution

## Step 1: Install Core Dependencies

### Node.js and npm
```bash
# Option 1: Download from official website
# Visit https://nodejs.org and download LTS version

# Option 2: Using package managers
# macOS (Homebrew)
brew install node@18

# Windows (Chocolatey)
choco install nodejs-lts

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should be 18.x.x or higher
npm --version   # Should be 9.x.x or higher
```

### Git
```bash
# macOS (Homebrew)
brew install git

# Windows (Chocolatey)
choco install git

# Ubuntu/Debian
sudo apt-get install git

# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### PostgreSQL
```bash
# macOS (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# Windows (Chocolatey)
choco install postgresql15

# Ubuntu/Debian
sudo apt-get install postgresql-15 postgresql-contrib-15

# Start PostgreSQL service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version  # Should be 15.x
```

## Step 2: Mobile Development Setup

### Expo CLI
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Verify installation
expo --version
```

### iOS Development (macOS only)
```bash
# Install Xcode from App Store (large download ~10GB)
# After installation, open Xcode and accept license agreements

# Install Xcode Command Line Tools
xcode-select --install

# Install iOS Simulator
# Open Xcode → Preferences → Components → Install iOS Simulators

# Install CocoaPods
sudo gem install cocoapods

# Verify installation
pod --version
```

### Android Development
```bash
# Download and install Android Studio
# Visit https://developer.android.com/studio

# During installation, ensure these components are selected:
# - Android SDK
# - Android SDK Platform
# - Android Virtual Device

# Set environment variables (add to ~/.bashrc or ~/.zshrc)
export ANDROID_HOME=$HOME/Library/Android/sdk  # macOS
export ANDROID_HOME=$HOME/Android/Sdk          # Linux
export ANDROID_HOME=%LOCALAPPDATA%\Android\Sdk # Windows

export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload shell configuration
source ~/.bashrc  # or ~/.zshrc

# Verify installation
adb --version
```

## Step 3: Development Tools

### VS Code
```bash
# Download from https://code.visualstudio.com/

# Install recommended extensions
code --install-extension ms-vscode.vscode-typescript-next
code --install-extension esbenp.prettier-vscode
code --install-extension dbaeumer.vscode-eslint
code --install-extension expo.vscode-expo-tools
code --install-extension ms-vscode.vscode-react-native
```

### Database Management Tools
```bash
# Option 1: pgAdmin (Web-based)
# Download from https://www.pgadmin.org/

# Option 2: TablePlus (macOS/Windows)
# Download from https://tableplus.com/

# Option 3: Command line tools
brew install postgresql  # Includes psql
```

### API Testing Tools
```bash
# Option 1: Postman
# Download from https://www.postman.com/

# Option 2: Insomnia
# Download from https://insomnia.rest/

# Option 3: HTTPie (command line)
brew install httpie  # macOS
pip install httpie   # Cross-platform
```

## Step 4: Project Setup

### Clone Repository
```bash
# Clone the repository
git clone https://github.com/Swappnil85/Drishti.git
cd Drishti

# Add upstream remote (for contributors)
git remote add upstream https://github.com/Swappnil85/Drishti.git

# Verify remotes
git remote -v
```

### Install Dependencies
```bash
# Install all dependencies (this may take several minutes)
npm install

# Verify installation
npm list --depth=0
```

## Step 5: Database Setup

### Create Database
```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql  # Linux
psql postgres          # macOS with Homebrew

# Create database and user
CREATE DATABASE drishti_dev;
CREATE USER drishti_user WITH PASSWORD 'dev_password';
GRANT ALL PRIVILEGES ON DATABASE drishti_dev TO drishti_user;

# Grant additional permissions
GRANT CREATE ON SCHEMA public TO drishti_user;
GRANT USAGE ON SCHEMA public TO drishti_user;

# Exit PostgreSQL
\q
```

### Test Database Connection
```bash
# Test connection
psql -h localhost -U drishti_user -d drishti_dev

# If successful, you should see:
# drishti_dev=>

# Exit
\q
```

## Step 6: Environment Configuration

### API Environment
```bash
# Copy environment template
cp apps/api/.env.example apps/api/.env

# Edit environment file
nano apps/api/.env  # or use your preferred editor
```

**Configure the following variables:**
```env
# Server Configuration
PORT=3000
HOST=0.0.0.0
LOG_LEVEL=debug

# Database Configuration
DATABASE_URL=postgresql://drishti_user:dev_password@localhost:5432/drishti_dev

# JWT Configuration
JWT_SECRET=your-development-jwt-secret-key-here

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# AI Services (Optional for initial setup)
OPENAI_API_KEY=your-openai-api-key-here
GOOGLE_VISION_API_KEY=your-google-vision-api-key-here
```

### Mobile Environment
```bash
# Create mobile environment file (if needed)
touch apps/_archive/mobile-v1//.env

# Add mobile-specific variables
echo "EXPO_PUBLIC_API_URL=http://localhost:3000" >> apps/_archive/mobile-v1//.env
```

## Step 7: Start Development Servers

### Terminal 1 - API Backend
```bash
# Start API development server
npm run dev --workspace=apps/api

# You should see:
# 🚀 Server running at http://0.0.0.0:3000
# 📚 API Documentation available at http://0.0.0.0:3000/docs
```

### Terminal 2 - Mobile App
```bash
# Start mobile development server
npm run dev --workspace=apps/_archive/mobile-v1/

# You should see Expo QR code and options:
# › Press a │ open Android
# › Press i │ open iOS simulator
# › Press w │ open web
```

## Step 8: Verify Setup

### API Health Check
```bash
# Test API health endpoint
curl http://localhost:3000/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-01T00:00:00.000Z"}
```

### API Documentation
Open your browser and visit:
- **API Docs**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health

### Mobile App
1. Install Expo Go app on your phone
2. Scan the QR code displayed in terminal
3. App should load on your device

### Database Connection
```bash
# Test database operations
cd apps/api
npm run migrate  # Run database migrations (when available)
```

## Step 9: IDE Configuration

### VS Code Settings
Create `.vscode/settings.json`:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "eslint.workingDirectories": [
    "apps/api",
    "apps/_archive/mobile-v1/",
    "packages/shared"
  ],
  "files.exclude": {
    "**/node_modules": true,
    "**/dist": true,
    "**/.expo": true
  }
}
```

### VS Code Launch Configuration
Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug API",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/apps/api/src/index.ts",
      "runtimeArgs": ["-r", "tsx/cjs"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

## Troubleshooting

### Common Issues

#### Port Already in Use
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port
PORT=3001 npm run dev --workspace=apps/api
```

#### Database Connection Failed
```bash
# Check PostgreSQL status
brew services list | grep postgresql  # macOS
sudo systemctl status postgresql      # Linux

# Restart PostgreSQL
brew services restart postgresql@15   # macOS
sudo systemctl restart postgresql     # Linux

# Check connection
psql -h localhost -U drishti_user -d drishti_dev
```

#### Node.js Version Issues
```bash
# Check current version
node --version

# Install correct version using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

#### Permission Issues (macOS/Linux)
```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use nvm to avoid permission issues
```

#### Expo/React Native Issues
```bash
# Clear Expo cache
npx expo start --clear

# Reset Metro cache
npx expo start --reset-cache

# Clear npm cache
npm cache clean --force
```

### Getting Help

If you encounter issues:
1. Check the [Troubleshooting Guide](./TROUBLESHOOTING.md)
2. Search existing [GitHub Issues](https://github.com/Swappnil85/Drishti/issues)
3. Create a new issue with detailed information
4. Join our community discussions

## Next Steps

After successful setup:
1. Read the [Getting Started Guide](../development/GETTING_STARTED.md)
2. Review [Coding Standards](../development/CODING_STANDARDS.md)
3. Check out [Contributing Guidelines](../development/CONTRIBUTING.md)
4. Explore the [API Documentation](../api/API_OVERVIEW.md)
5. Start building! 🚀
