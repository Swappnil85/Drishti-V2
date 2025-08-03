# Authentication Reference Template

> **📖 Complete Documentation**: For full authentication details, see [Authentication Guide](../authentication/AUTHENTICATION_GUIDE.md)

## Quick Reference

### Authentication Flow
- **Login/Register**: JWT-based authentication with dual tokens
- **Token Management**: 15-minute access tokens, 7-day refresh tokens
- **Security**: bcrypt password hashing, rate limiting, account lockout

### Key Components
- **Backend**: JWT Service, Auth Middleware, Session Management
- **Mobile**: AuthService, AuthContext, Secure token storage
- **Security**: RBAC, OAuth integration, comprehensive testing

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

### Authentication Flow Summary
1. **Registration/Login** → Receive JWT + Refresh tokens
2. **API Requests** → Include `Authorization: Bearer <jwt_token>` header
3. **Token Refresh** → Use refresh token to get new JWT
4. **Logout** → Invalidate tokens server-side

### Epic-Specific Authentication Notes
*Add any epic-specific authentication requirements or customizations here*

**Example Epic-Specific Content:**
- Custom authentication middleware
- Additional validation rules
- Epic-specific user roles or permissions
- Integration with epic-specific services

### Mobile Integration
```typescript
// Basic usage example
import { useAuth } from '../contexts/AuthContext';

const { login, logout, user, isAuthenticated } = useAuth();
```

---

**Usage Instructions for Epic Documentation:**

1. **For Epic Overviews**: Include only epic-specific authentication requirements
2. **For Technical Guides**: Reference specific sections of the main guide
3. **For QA Plans**: Link to authentication testing sections
4. **For Security Reviews**: Reference security features and implementation

**Example Reference Patterns:**

```markdown
## Authentication

This epic implements [JWT-based authentication](../authentication/AUTHENTICATION_GUIDE.md#token-structure) with the following epic-specific features:

- Epic-specific requirement 1
- Epic-specific requirement 2

For complete authentication documentation, see [Authentication Guide](../authentication/AUTHENTICATION_GUIDE.md).
```

```markdown
## Security Implementation

Authentication security follows the [established security framework](../authentication/AUTHENTICATION_GUIDE.md#security-features) with these additions:

- Additional security measure 1
- Additional security measure 2
```

**Benefits of Using References:**
- ✅ Eliminates duplicate content
- ✅ Ensures consistency across documentation
- ✅ Easier maintenance and updates
- ✅ Clearer separation of concerns
- ✅ Reduced documentation size