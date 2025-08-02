# Coding Standards

## Overview

This document outlines the coding standards and best practices for the Drishti project. Following these standards ensures code consistency, maintainability, and team collaboration.

## General Principles

### Code Quality
- **Readability**: Write code that tells a story
- **Simplicity**: Prefer simple solutions over complex ones
- **Consistency**: Follow established patterns
- **Maintainability**: Write code that's easy to modify
- **Performance**: Consider performance implications

### SOLID Principles
- **Single Responsibility**: Each function/class has one reason to change
- **Open/Closed**: Open for extension, closed for modification
- **Liskov Substitution**: Subtypes must be substitutable for base types
- **Interface Segregation**: Depend on abstractions, not concretions
- **Dependency Inversion**: High-level modules shouldn't depend on low-level modules

## TypeScript Standards

### Type Definitions
```typescript
// ✅ Good: Explicit and descriptive types
interface UserProfile {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  preferences: UserPreferences;
}

interface UserPreferences {
  language: 'en' | 'es' | 'fr';
  theme: 'light' | 'dark';
  notifications: boolean;
}

// ❌ Bad: Using 'any' or unclear types
interface User {
  data: any;
  info: object;
}
```

### Function Signatures
```typescript
// ✅ Good: Clear parameter and return types
const createUser = async (
  userData: CreateUserRequest
): Promise<ApiResponse<User>> => {
  // Implementation
};

// ✅ Good: Use readonly for immutable data
const processAnalysis = (
  analysis: Readonly<VisualAnalysis>
): ProcessedAnalysis => {
  // Implementation
};

// ❌ Bad: Missing types
const createUser = async (userData) => {
  // Implementation
};
```

### Enums and Constants
```typescript
// ✅ Good: Use const assertions for literal types
const USER_ROLES = {
  ADMIN: 'admin',
  USER: 'user',
  MODERATOR: 'moderator'
} as const;

type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

// ✅ Good: Use enums for related constants
enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  NOT_FOUND = 404,
  INTERNAL_SERVER_ERROR = 500
}
```

## Naming Conventions

### Variables and Functions
```typescript
// ✅ Good: Descriptive camelCase names
const userAuthToken = 'abc123';
const isUserAuthenticated = true;
const getUserProfile = async (userId: string) => { /* */ };

// ❌ Bad: Unclear or abbreviated names
const token = 'abc123';
const auth = true;
const getUsrProf = async (id: string) => { /* */ };
```

### Classes and Interfaces
```typescript
// ✅ Good: PascalCase for classes and interfaces
class UserService {
  private readonly repository: UserRepository;
  
  constructor(repository: UserRepository) {
    this.repository = repository;
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ✅ Good: Prefix interfaces with 'I' if needed for disambiguation
interface IUserRepository {
  findById(id: string): Promise<User | null>;
  create(user: CreateUserRequest): Promise<User>;
}
```

### Files and Directories
```
// ✅ Good: kebab-case for files, PascalCase for components
user-service.ts
auth-middleware.ts
UserProfile.tsx
CameraView.tsx

// ✅ Good: Descriptive directory names
src/
├── components/
├── services/
├── utils/
├── types/
└── constants/
```

## Code Organization

### File Structure
```typescript
// ✅ Good: Organized imports
// External libraries first
import React, { useState, useEffect } from 'react';
import { View, Text } from 'react-native';
import axios from 'axios';

// Internal imports second
import { Button } from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { ApiResponse, User } from '../types';

// Constants and types
interface Props {
  userId: string;
  onUpdate: (user: User) => void;
}

// Component implementation
export const UserProfile: React.FC<Props> = ({ userId, onUpdate }) => {
  // Implementation
};
```

### Function Organization
```typescript
// ✅ Good: Single responsibility functions
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password: string): boolean => {
  return password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);
};

const validateUserInput = (userData: CreateUserRequest): ValidationResult => {
  const errors: string[] = [];
  
  if (!validateEmail(userData.email)) {
    errors.push('Invalid email format');
  }
  
  if (!validatePassword(userData.password)) {
    errors.push('Password must be at least 8 characters with uppercase and number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};
```

## Error Handling

### API Error Handling
```typescript
// ✅ Good: Structured error handling
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleApiError = (error: unknown): ApiResponse<never> => {
  if (error instanceof ApiError) {
    return {
      success: false,
      error: error.message,
      code: error.code
    };
  }
  
  return {
    success: false,
    error: 'An unexpected error occurred',
    code: 'INTERNAL_ERROR'
  };
};
```

### React Error Boundaries
```typescript
// ✅ Good: Error boundary implementation
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to error reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}
```

## React/React Native Standards

### Component Structure
```typescript
// ✅ Good: Well-structured component
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  testID
}) => {
  // Hooks at the top
  const [isPressed, setIsPressed] = useState(false);
  
  // Event handlers
  const handlePress = useCallback(() => {
    if (!disabled && !loading) {
      onPress();
    }
  }, [disabled, loading, onPress]);
  
  // Render
  return (
    <TouchableOpacity
      style={[styles.button, styles[variant]]}
      onPress={handlePress}
      disabled={disabled || loading}
      testID={testID}
    >
      {loading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </TouchableOpacity>
  );
};
```

### Hooks Usage
```typescript
// ✅ Good: Custom hook with proper dependencies
const useApi = <T>(url: string, dependencies: unknown[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.get<T>(url);
        setData(response.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [url, ...dependencies]);
  
  return { data, loading, error };
};
```

## API Standards

### Route Handlers
```typescript
// ✅ Good: Structured route handler
const createUser = async (
  request: FastifyRequest<{ Body: CreateUserRequest }>,
  reply: FastifyReply
): Promise<ApiResponse<User>> => {
  try {
    // Validate input
    const validation = validateUserInput(request.body);
    if (!validation.isValid) {
      return reply.code(400).send({
        success: false,
        error: 'Validation failed',
        details: validation.errors
      });
    }
    
    // Business logic
    const user = await userService.createUser(request.body);
    
    // Success response
    return reply.code(201).send({
      success: true,
      data: user
    });
  } catch (error) {
    request.log.error('User creation failed', { error });
    return reply.code(500).send({
      success: false,
      error: 'Internal server error'
    });
  }
};
```

### Service Layer
```typescript
// ✅ Good: Service with dependency injection
class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly emailService: EmailService,
    private readonly logger: Logger
  ) {}
  
  async createUser(userData: CreateUserRequest): Promise<User> {
    this.logger.info('Creating user', { email: userData.email });
    
    // Check if user exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ApiError('User already exists', 409, 'USER_EXISTS');
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword
    });
    
    // Send welcome email
    await this.emailService.sendWelcomeEmail(user.email, user.name);
    
    return user;
  }
}
```

## Testing Standards

### Unit Tests
```typescript
// ✅ Good: Comprehensive unit test
describe('UserService', () => {
  let userService: UserService;
  let mockUserRepository: jest.Mocked<UserRepository>;
  let mockEmailService: jest.Mocked<EmailService>;
  
  beforeEach(() => {
    mockUserRepository = {
      findByEmail: jest.fn(),
      create: jest.fn()
    } as any;
    
    mockEmailService = {
      sendWelcomeEmail: jest.fn()
    } as any;
    
    userService = new UserService(mockUserRepository, mockEmailService, logger);
  });
  
  describe('createUser', () => {
    test('should create user successfully', async () => {
      // Arrange
      const userData = {
        email: 'test@example.com',
        name: 'Test User',
        password: 'password123'
      };
      
      mockUserRepository.findByEmail.mockResolvedValue(null);
      mockUserRepository.create.mockResolvedValue(mockUser);
      
      // Act
      const result = await userService.createUser(userData);
      
      // Assert
      expect(result).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: expect.any(String) // Hashed password
      });
      expect(mockEmailService.sendWelcomeEmail).toHaveBeenCalledWith(
        userData.email,
        userData.name
      );
    });
  });
});
```

## Documentation Standards

### Code Comments
```typescript
// ✅ Good: Meaningful comments
/**
 * Analyzes an image using AI services and returns structured results
 * @param imageUrl - URL of the image to analyze
 * @param options - Analysis options including language and features
 * @returns Promise resolving to analysis results with confidence scores
 * @throws {ApiError} When image URL is invalid or AI service fails
 */
const analyzeImage = async (
  imageUrl: string,
  options: AnalysisOptions
): Promise<VisualAnalysis> => {
  // Validate image URL format and accessibility
  if (!isValidImageUrl(imageUrl)) {
    throw new ApiError('Invalid image URL', 400, 'INVALID_IMAGE_URL');
  }
  
  // Call AI service with retry logic for transient failures
  const analysis = await aiService.analyze(imageUrl, options);
  
  return analysis;
};
```

### JSDoc Standards
```typescript
/**
 * User authentication service
 * Handles user login, registration, and token management
 */
class AuthService {
  /**
   * Authenticates user with email and password
   * @param email - User's email address
   * @param password - User's plain text password
   * @returns Promise resolving to authentication result with tokens
   * @throws {AuthError} When credentials are invalid
   * @example
   * ```typescript
   * const result = await authService.login('user@example.com', 'password');
   * console.log(result.user.name);
   * ```
   */
  async login(email: string, password: string): Promise<AuthResult> {
    // Implementation
  }
}
```

## Performance Guidelines

### React Performance
```typescript
// ✅ Good: Memoized component
const UserList = React.memo<UserListProps>(({ users, onUserSelect }) => {
  const handleUserPress = useCallback((user: User) => {
    onUserSelect(user);
  }, [onUserSelect]);
  
  return (
    <FlatList
      data={users}
      keyExtractor={(user) => user.id}
      renderItem={({ item }) => (
        <UserItem user={item} onPress={handleUserPress} />
      )}
      getItemLayout={(data, index) => ({
        length: ITEM_HEIGHT,
        offset: ITEM_HEIGHT * index,
        index
      })}
    />
  );
});
```

### Database Queries
```typescript
// ✅ Good: Efficient database queries
const getUsersWithAnalyses = async (
  limit: number = 20,
  offset: number = 0
): Promise<UserWithAnalyses[]> => {
  return db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      analysisCount: count(analyses.id)
    })
    .from(users)
    .leftJoin(analyses, eq(users.id, analyses.userId))
    .groupBy(users.id)
    .limit(limit)
    .offset(offset);
};
```
