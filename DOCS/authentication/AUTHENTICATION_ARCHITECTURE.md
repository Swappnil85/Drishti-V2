# Authentication Architecture - Drishti

## Overview

Drishti implements a comprehensive, production-ready authentication system with the following key features:

- **Multi-provider Authentication**: Email/password, Google OAuth, Apple OAuth
- **JWT-based Token Management**: Secure access and refresh tokens
- **Session Management**: Server-side session tracking with device information
- **Security Features**: Rate limiting, account locking, password strength validation
- **Mobile-first Design**: Secure token storage, offline authentication state
- **Comprehensive Testing**: Unit tests, integration tests, security tests

## Architecture Components

### Backend API Authentication

#### 1. Authentication Service (`apps/api/src/auth/service.ts`)

- **User Registration**: Email verification, password validation, OAuth integration
- **User Login**: Credential verification, session creation, token generation
- **Account Security**: Failed attempt tracking, account locking, password reset

#### 2. JWT Service (`apps/api/src/auth/jwt.ts`)

- **Token Generation**: Access tokens (15 min), refresh tokens (7 days)
- **Token Verification**: Signature validation, expiry checking
- **Security**: RSA-256 signing, configurable expiry times

#### 3. Session Management (`apps/api/src/auth/session.ts`)

- **Session Tracking**: Device info, IP address, user agent
- **Session Security**: Automatic cleanup, concurrent session limits
- **Refresh Token Management**: Secure storage, rotation on refresh

#### 4. Authentication Middleware (`apps/api/src/middleware/auth.ts`)

- **Request Authentication**: Token validation, user verification
- **Rate Limiting**: Configurable limits per endpoint
- **Security Headers**: CORS, XSS protection, content type validation

### Mobile App Authentication

#### 1. AuthService (`apps/mobile/src/services/auth/AuthService.ts`)

- **Secure Storage**: SecureStore for tokens, AsyncStorage for user data
- **State Management**: Real-time authentication state updates
- **Network Handling**: Automatic token refresh, offline state management
- **Device Security**: Device fingerprinting, biometric integration ready

#### 2. AuthContext (`apps/mobile/src/contexts/AuthContext.tsx`)

- **React Context**: Global authentication state management
- **Hooks**: `useAuth`, `useUser`, `useIsAuthenticated`
- **Components**: `AuthGuard`, `withAuth` HOC for route protection

## Security Features

### Password Security

- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters, complexity requirements
- **Common Pattern Detection**: Prevents common passwords

### Token Security

- **JWT Structure**: RS256 signing algorithm
- **Short-lived Access Tokens**: 15-minute expiry
- **Secure Refresh Tokens**: 7-day expiry, rotation on use
- **Token Storage**: SecureStore on mobile, httpOnly cookies on web

### Account Protection

- **Rate Limiting**: 5 login attempts per 15 minutes
- **Account Locking**: Temporary lock after 5 failed attempts
- **Session Management**: Device tracking, concurrent session limits

### Network Security

- **HTTPS Enforcement**: All authentication endpoints require HTTPS
- **CORS Configuration**: Strict origin validation
- **Security Headers**: XSS protection, content type validation
- **Input Sanitization**: SQL injection prevention, XSS filtering

## API Endpoints

### Authentication Routes (`/auth`)

#### POST `/auth/register`

Register new user with email/password or OAuth.

**Request:**

```json
{
  "email": "user@example.com",
  "name": "User Name",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Registration successful. Please verify your email.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "email_verified": false
  }
}
```

#### POST `/auth/login`

Authenticate user and create session.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**

```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "User Name",
    "email_verified": true
  },
  "tokens": {
    "accessToken": "jwt-access-token",
    "refreshToken": "jwt-refresh-token",
    "expiresIn": 900
  }
}
```

#### POST `/auth/refresh`

Refresh access token using refresh token.

#### POST `/auth/logout`

Invalidate session and tokens.

#### GET `/auth/verify`

Verify token validity (used by mobile app).

#### GET `/auth/me`

Get current user information (protected route).

### OAuth Routes

#### GET `/auth/google`

Initiate Google OAuth flow.

#### GET `/auth/google/callback`

Handle Google OAuth callback.

#### POST `/auth/apple`

Handle Apple OAuth authentication.

## Mobile App Integration

### Authentication Flow

1. **App Launch**: Check stored tokens, verify validity
2. **Login/Register**: Present authentication screens
3. **Token Storage**: Securely store tokens using SecureStore
4. **State Management**: Update global authentication state
5. **Auto-refresh**: Automatically refresh expired tokens
6. **Logout**: Clear all stored authentication data

### Usage Examples

#### Basic Authentication

```typescript
import { useAuth } from '../contexts/AuthContext';

function LoginScreen() {
  const { login, isLoading } = useAuth();

  const handleLogin = async () => {
    const result = await login(email, password);
    if (result.success) {
      // Navigation handled automatically by AuthContext
    } else {
      Alert.alert('Login Failed', result.error);
    }
  };
}
```

#### Protected Routes

```typescript
import { AuthGuard } from '../contexts/AuthContext';

function App() {
  return (
    <AuthGuard requireAuth={true} fallback={<LoginScreen />}>
      <MainApp />
    </AuthGuard>
  );
}
```

#### Authentication State

```typescript
import { useAuth, useUser } from '../contexts/AuthContext';

function ProfileScreen() {
  const { logout } = useAuth();
  const user = useUser();

  return (
    <View>
      <Text>Welcome, {user?.name}</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  );
}
```

## Testing Strategy

### Backend Tests (`apps/api/src/tests/auth.test.ts`)

- **Unit Tests**: Individual service methods
- **Integration Tests**: Full authentication flows
- **Security Tests**: SQL injection, XSS, rate limiting
- **Edge Cases**: Invalid inputs, network failures

### Mobile Tests (`apps/mobile/src/tests/AuthService.test.ts`)

- **Service Tests**: AuthService methods
- **Storage Tests**: Secure token storage/retrieval
- **State Tests**: Authentication state management
- **Network Tests**: API integration, error handling

## Deployment Considerations

### Environment Variables

```bash
# JWT Configuration
JWT_ACCESS_SECRET=your-access-token-secret
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Database
DATABASE_URL=postgresql://user:pass@host:port/db

# OAuth (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
APPLE_CLIENT_ID=your-apple-client-id
APPLE_PRIVATE_KEY=your-apple-private-key

# Email (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASSWORD=your-smtp-password
```

### Security Checklist

- [ ] HTTPS enabled in production
- [ ] Strong JWT secrets (256-bit minimum)
- [ ] Database connection encrypted
- [ ] Rate limiting configured
- [ ] Session cleanup scheduled
- [ ] Monitoring and alerting enabled
- [ ] Regular security audits scheduled

## Monitoring and Maintenance

### Metrics to Track

- **Authentication Success Rate**: Login/register success percentage
- **Token Refresh Rate**: How often tokens are refreshed
- **Failed Login Attempts**: Potential security threats
- **Session Duration**: Average user session length
- **Account Lockouts**: Frequency and patterns

### Maintenance Tasks

- **Token Cleanup**: Remove expired refresh tokens
- **Session Cleanup**: Remove inactive sessions
- **Security Updates**: Regular dependency updates
- **Performance Monitoring**: API response times
- **Log Analysis**: Security event analysis

## Performance Considerations

### Database Optimization

- **Indexes**: Email, OAuth provider/ID, session tokens
- **Connection Pooling**: Maximum 20 connections
- **Query Optimization**: Prepared statements, efficient joins

### Caching Strategy

- **Token Validation**: Cache valid tokens for 5 minutes
- **User Data**: Cache user profiles for 15 minutes
- **Rate Limiting**: In-memory store with Redis fallback

### Scalability

- **Horizontal Scaling**: Stateless authentication design
- **Load Balancing**: Session affinity not required
- **Database Sharding**: User-based partitioning ready
