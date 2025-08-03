# Authentication Guide - Drishti

## Overview

Drishti implements a comprehensive, production-ready authentication system using JWT (JSON Web Tokens) for stateless authentication. The system features a dual-token approach with access tokens for API requests and refresh tokens for token renewal.

### Key Features

- **Multi-provider Authentication**: Email/password, Google OAuth, Apple OAuth
- **JWT-based Token Management**: Secure access and refresh tokens
- **Session Management**: Server-side session tracking with device information
- **Security Features**: Rate limiting, account locking, password strength validation
- **Mobile-first Design**: Secure token storage, offline authentication state
- **Comprehensive Testing**: Unit tests, integration tests, security tests

## Authentication Flows

### Registration Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database

    Client->>API: POST /auth/register
    API->>API: Validate input
    API->>API: Hash password
    API->>Database: Create user
    Database-->>API: User created
    API->>API: Generate tokens
    API-->>Client: User data + tokens
```

### Login Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database

    Client->>API: POST /auth/login
    API->>Database: Find user by email
    Database-->>API: User data
    API->>API: Verify password
    API->>API: Generate tokens
    API-->>Client: User data + tokens
```

### Token Refresh Flow
```mermaid
sequenceDiagram
    participant Client
    participant API
    participant Database

    Client->>API: POST /auth/refresh
    API->>API: Validate refresh token
    API->>Database: Check user status
    Database-->>API: User active
    API->>API: Generate new access token
    API-->>Client: New access token
```

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

## Token Structure

### Access Token Payload
```typescript
interface AccessTokenPayload {
  sub: string;        // User ID
  email: string;      // User email
  name: string;       // User name
  role: UserRole;     // User role
  permissions: Permission[];
  iat: number;        // Issued at
  exp: number;        // Expires at
  type: 'access';
}
```

### Refresh Token Payload
```typescript
interface RefreshTokenPayload {
  sub: string;        // User ID
  iat: number;        // Issued at
  exp: number;        // Expires at
  type: 'refresh';
  jti: string;        // JWT ID for revocation
}
```

## Token Management

### Token Expiry
- **Access Token**: 15 minutes (900 seconds)
- **Refresh Token**: 7 days (604800 seconds)

### Token Storage (Mobile App)
```typescript
import * as SecureStore from 'expo-secure-store';

// Store tokens securely
const storeTokens = async (tokens: AuthTokens) => {
  await SecureStore.setItemAsync('access_token', tokens.accessToken);
  await SecureStore.setItemAsync('refresh_token', tokens.refreshToken);
};

// Retrieve tokens
const getTokens = async (): Promise<AuthTokens | null> => {
  const accessToken = await SecureStore.getItemAsync('access_token');
  const refreshToken = await SecureStore.getItemAsync('refresh_token');
  
  if (!accessToken || !refreshToken) return null;
  
  return { accessToken, refreshToken };
};
```

### Automatic Token Refresh
```typescript
// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = await SecureStore.getItemAsync('refresh_token');
      
      if (refreshToken) {
        try {
          const response = await axios.post('/auth/refresh', {
            refreshToken
          });
          
          const { accessToken } = response.data.data;
          await SecureStore.setItemAsync('access_token', accessToken);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${accessToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          await clearTokens();
          navigateToLogin();
        }
      }
    }
    
    return Promise.reject(error);
  }
);
```

## Security Features

### Password Security
- **Hashing**: bcrypt with 12 salt rounds
- **Validation**: Minimum 8 characters, complexity requirements
- **Common Pattern Detection**: Prevents common passwords

```typescript
import bcrypt from 'bcryptjs';

const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

const verifyPassword = async (
  password: string, 
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

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

## Authorization

### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  MODERATOR = 'moderator'
}

enum Permission {
  READ_OWN_DATA = 'read:own',
  WRITE_OWN_DATA = 'write:own',
  READ_ALL_DATA = 'read:all',
  WRITE_ALL_DATA = 'write:all',
  MANAGE_USERS = 'manage:users',
  MANAGE_SYSTEM = 'manage:system'
}
```

### Permission Middleware
```typescript
const requirePermission = (permission: Permission) => {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = request.user;
    
    if (!user.permissions.includes(permission)) {
      return reply.code(403).send({
        success: false,
        error: 'Insufficient permissions'
      });
    }
  };
};
```

## 🔌 API Implementation

### Authentication API
**Complete API Documentation**: See [Authentication Endpoints](../api/ENDPOINTS.md#authentication-endpoints) for detailed specifications including:
- Registration (`POST /auth/register`)
- Login (`POST /auth/login`) 
- Token refresh (`POST /auth/refresh`)
- Logout (`POST /auth/logout`)
- Google OAuth (`GET /auth/google`, `GET /auth/google/callback`)

### Authentication Reference Quick Links
- **[API Overview](../api/API_OVERVIEW.md)** - Base URLs, response formats, rate limiting
- **[Error Handling](../api/ERROR_HANDLING.md)** - Authentication error codes and responses
- **[Endpoints Documentation](../api/ENDPOINTS.md#authentication-endpoints)** - Complete endpoint specifications

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

## Rate Limiting

### Authentication Endpoints
- **Login**: 5 attempts per 15 minutes per IP
- **Register**: 3 attempts per hour per IP
- **Refresh**: 10 attempts per hour per user

### Lockout Policy
- Account lockout after 5 failed login attempts
- Lockout duration: 15 minutes
- Email notification on lockout

## Error Handling

### Authentication Errors
```typescript
enum AuthError {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  PERMISSION_DENIED = 'PERMISSION_DENIED'
}
```

### Error Responses
```json
{
  "success": false,
  "error": "Invalid credentials",
  "code": "INVALID_CREDENTIALS",
  "timestamp": "2024-01-01T00:00:00Z"
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

### Example Unit Test
```typescript
describe('Authentication', () => {
  test('should register new user', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'SecurePass123!'
      }
    });
    
    expect(response.statusCode).toBe(201);
    expect(response.json().success).toBe(true);
  });
});
```

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

---

*This guide consolidates all authentication-related documentation for the Drishti project. For implementation details, refer to the source code in the respective directories.*