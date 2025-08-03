# Troubleshooting Guide

This guide covers common issues and their solutions when developing with Drishti.

## Mobile Development Issues

### Expo SDK Version Mismatch

**Problem**: Getting "SDK version mismatch" error when scanning QR code with Expo Go app.

**Symptoms**:
- QR code scan fails with version compatibility error
- Expo Go shows "This experience was published with an unsupported SDK version"

**Solution**:
1. Check your Expo Go app version and supported SDK versions
2. Upgrade your project to a compatible SDK version:
   ```bash
   cd apps/mobile
   npx expo install --fix
   ```
3. Update package.json dependencies to match SDK version:
   ```bash
   npm install expo@~53.0.0 --legacy-peer-deps
   ```

### Web App Shows Blank Screen

**Problem**: Web version loads but shows blank screen in browser.

**Symptoms**:
- Metro bundling completes successfully
- Browser shows white/blank screen
- No visible content or error messages

**Root Causes & Solutions**:

#### 1. Missing Entry Point Registration
**Error**: "main" has not been registered
**Solution**: Ensure proper app registration:

```javascript
// index.js (main entry point)
import { registerRootComponent } from 'expo';
import App from './App';

registerRootComponent(App);
```

Update package.json:
```json
{
  "main": "index.js"
}
```

#### 2. Expo Router Configuration Issues
**Error**: "Use static rendering with Expo Router to support running without JavaScript"
**Solution**: For simple apps without routing, use basic React Native structure instead of Expo Router.

#### 3. Missing React Native Web
**Solution**: Install react-native-web:
```bash
npm install react-native-web@~0.19.13 --legacy-peer-deps
```

#### 4. Version Compatibility Issues
**Solution**: Update core dependencies:
```bash
npm install react@19.0.0 react-dom@19.0.0 react-native@0.79.5 --legacy-peer-deps
```

### Complete Mobile Setup Fix

If you encounter both SDK mismatch and web blank screen issues:

1. **Update Entry Point**:
   ```bash
   # Update package.json main field
   "main": "index.js"
   ```

2. **Create Proper Entry Point**:
   ```javascript
   // index.js
   import { registerRootComponent } from 'expo';
   import App from './App';
   
   registerRootComponent(App);
   ```

3. **Install Missing Dependencies**:
   ```bash
   npm install expo-constants@~17.1.7 --legacy-peer-deps
   npm install react-native-web@~0.19.13 --legacy-peer-deps
   npm install react@19.0.0 react-dom@19.0.0 react-native@0.79.5 --legacy-peer-deps
   ```

4. **Create Required Assets**:
   ```bash
   mkdir -p assets
   # Add icon.png to assets/ directory
   ```

5. **Clear Cache and Restart**:
   ```bash
   npx expo start --clear --reset-cache
   ```

## API Development Issues

### Database Connection Issues

**Problem**: Cannot connect to PostgreSQL database.

**Solutions**:
```bash
# Check PostgreSQL status
brew services list | grep postgresql

# Start PostgreSQL
brew services start postgresql@15

# Check if database exists
psql -l | grep drishti

# Create database if missing
createdb drishti_dev
```

### Port Already in Use

**Problem**: API server fails to start due to port conflict.

**Solution**:
```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port in .env
PORT=3001
```

### Environment Variables Not Loading

**Problem**: Environment variables are undefined in the application.

**Solutions**:
1. Ensure .env file exists in correct location
2. Check .env file format (no spaces around =)
3. Restart development server after .env changes
4. Verify environment loading in code:
   ```typescript
   console.log('Environment check:', {
     port: process.env.PORT,
     dbUrl: process.env.DATABASE_URL ? 'Set' : 'Missing'
   });
   ```

## General Development Issues

### TypeScript Errors

**Problem**: TypeScript compilation errors or type checking issues.

**Solutions**:
```bash
# Clean TypeScript cache
rm -rf node_modules/.cache
rm -rf apps/*/node_modules/.cache

# Rebuild TypeScript references
npm run build

# Check for type errors
npm run type-check
```

### Node Modules Issues

**Problem**: Dependency conflicts or installation issues.

**Solutions**:
```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm package-lock.json
rm apps/*/package-lock.json

# Fresh install
npm install

# Use legacy peer deps for Expo projects
npm install --legacy-peer-deps
```

### Git Issues

**Problem**: Git conflicts or branch issues.

**Solutions**:
```bash
# Reset to clean state
git stash
git checkout develop
git pull origin develop

# Clean up local branches
git branch -d feature/old-branch

# Force push (use carefully)
git push --force-with-lease origin feature/your-branch
```

## Testing Issues

### Tests Failing

**Problem**: Unit tests or integration tests failing unexpectedly.

**Solutions**:
```bash
# Clear test cache
npm test -- --clearCache

# Run tests in verbose mode
npm test -- --verbose

# Run specific test file
npm test -- --testPathPattern=auth.test.ts

# Update snapshots
npm test -- --updateSnapshot
```

### Mock Issues

**Problem**: Mocks not working correctly in tests.

**Solutions**:
```typescript
// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});

// Reset modules
beforeEach(() => {
  jest.resetModules();
});
```

## Performance Issues

### Slow Development Server

**Problem**: Development server is slow to start or reload.

**Solutions**:
```bash
# Clear all caches
npx expo start --clear --reset-cache

# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"

# Use faster package manager
npm install -g pnpm
pnpm install
```

### Large Bundle Size

**Problem**: Mobile app bundle is too large.

**Solutions**:
1. Analyze bundle size:
   ```bash
   npx expo export --platform web
   npx webpack-bundle-analyzer web-build/static/js/*.js
   ```

2. Remove unused dependencies
3. Use dynamic imports for large libraries
4. Optimize images and assets

## Debugging Tips

### Enable Debug Logging

```bash
# API debugging
DEBUG=drishti:* npm run dev

# Mobile debugging
npx expo start --dev-client
```

### Browser Developer Tools

1. Open Safari/Chrome Developer Tools (F12)
2. Check Console tab for JavaScript errors
3. Check Network tab for failed requests
4. Use React Developer Tools extension

### Mobile Debugging

```bash
# Start with debugging
npx expo start --dev-client

# Use React Native Debugger
npm install -g react-native-debugger
```

## Getting Help

1. **Check Documentation**: Review relevant docs in `/DOCS`
2. **Search Issues**: Check [GitHub Issues](https://github.com/Swappnil85/Drishti/issues)
3. **Create Issue**: If problem persists, create detailed issue with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Node version, etc.)
   - Error messages and logs
4. **Team Communication**: Reach out in team chat for urgent issues

## Useful Commands Reference

```bash
# Development
npm run dev                              # Start all services
npm run dev --workspace=apps/api         # API only
npm run dev --workspace=apps/mobile      # Mobile only

# Testing
npm run test                             # All tests
npm run test:watch                       # Watch mode
npm run test:coverage                    # With coverage

# Building
npm run build                            # Build all
npm run type-check                       # Type checking
npm run lint                             # Linting
npm run format                           # Code formatting

# Mobile specific
npx expo start --clear                   # Clear cache
npx expo start --reset-cache             # Reset Metro cache
npx expo install --fix                   # Fix dependencies
npx expo doctor                          # Check setup

# Database
npm run migrate --workspace=apps/api     # Run migrations
npm run seed --workspace=apps/api        # Seed data
```
