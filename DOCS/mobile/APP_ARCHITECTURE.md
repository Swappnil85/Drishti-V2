# Mobile App Architecture

## Overview

The Drishti mobile application is built with React Native and Expo SDK 53, following modern mobile development patterns with a focus on accessibility, performance, and user experience. The app supports iOS, Android, and Web platforms.

## Setup Requirements

### SDK Compatibility

- **Expo SDK**: 53.0.0
- **React**: 19.0.0
- **React Native**: 0.79.5
- **React Native Web**: 0.19.13+

### Entry Point Configuration

The app uses a proper entry point registration system:

```javascript
// index.js (main entry point)
import { registerRootComponent } from 'expo';
import App from './App';

// Registers the app component with React Native
registerRootComponent(App);
```

```json
// package.json
{
  "main": "index.js"
}
```

This ensures proper component registration for both mobile and web platforms.

## Application Structure

```
apps/mobile/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/         # Generic components
│   │   ├── forms/          # Form-specific components
│   │   └── camera/         # Camera-related components
│   ├── screens/            # Screen components
│   │   ├── auth/           # Authentication screens
│   │   ├── camera/         # Camera and capture screens
│   │   ├── analysis/       # Analysis result screens
│   │   └── profile/        # User profile screens
│   ├── navigation/         # Navigation configuration
│   ├── services/           # API and external services
│   ├── store/              # State management
│   ├── hooks/              # Custom React hooks
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   └── constants/          # App constants
├── assets/                 # Static assets
├── App.tsx                 # Root component
├── app.config.js          # Expo configuration
└── package.json           # Dependencies and scripts
```

## Architecture Patterns

### Component Architecture

```
┌─────────────────┐
│   App.tsx       │  Root component with providers
└─────────────────┘
         │
┌─────────────────┐
│  Navigation     │  React Navigation setup
└─────────────────┘
         │
┌─────────────────┐
│   Screens       │  Screen-level components
└─────────────────┘
         │
┌─────────────────┐
│  Components     │  Reusable UI components
└─────────────────┘
```

### State Management Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Layer      │◄──►│  Zustand Store  │◄──►│  API Services   │
│  (Components)   │    │  (State Mgmt)   │    │  (HTTP Client)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Local Storage  │    │  Async Storage  │    │  Secure Store   │
│  (Cache/Temp)   │    │  (Preferences)  │    │  (Tokens/Keys)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Core Components

### Authentication Flow

```typescript
// Auth context provider
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);
```

### Camera Integration

```typescript
// Camera component with AI analysis
interface CameraScreenProps {
  onCapture: (image: CameraCapture) => void;
  onAnalysisComplete: (analysis: VisualAnalysis) => void;
}

const CameraScreen: React.FC<CameraScreenProps> = ({
  onCapture,
  onAnalysisComplete
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraRef, setCameraRef] = useState<Camera | null>(null);

  // Camera permission handling
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Capture and analyze image
  const captureAndAnalyze = async () => {
    if (cameraRef) {
      const photo = await cameraRef.takePictureAsync();
      onCapture(photo);

      // Upload and analyze
      const analysis = await analyzeImage(photo.uri);
      onAnalysisComplete(analysis);
    }
  };

  return (
    <Camera
      ref={setCameraRef}
      style={styles.camera}
      type={Camera.Constants.Type.back}
    >
      <CameraControls onCapture={captureAndAnalyze} />
    </Camera>
  );
};
```

## State Management

### Zustand Store Structure

```typescript
interface AppState {
  // Authentication
  auth: {
    user: User | null;
    tokens: AuthTokens | null;
    isAuthenticated: boolean;
  };

  // Camera & Analysis
  camera: {
    isActive: boolean;
    currentImage: CameraCapture | null;
    analysisHistory: VisualAnalysis[];
  };

  // UI State
  ui: {
    isLoading: boolean;
    activeScreen: string;
    theme: 'light' | 'dark';
  };

  // Settings
  settings: {
    language: string;
    voiceEnabled: boolean;
    autoAnalysis: boolean;
  };
}
```

### Store Implementation

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      auth: {
        user: null,
        tokens: null,
        isAuthenticated: false,
      },

      // Actions
      login: async (email: string, password: string) => {
        const response = await authService.login(email, password);
        set(state => ({
          auth: {
            ...state.auth,
            user: response.user,
            tokens: response.tokens,
            isAuthenticated: true,
          },
        }));
      },

      logout: async () => {
        await authService.logout();
        set(state => ({
          auth: {
            ...state.auth,
            user: null,
            tokens: null,
            isAuthenticated: false,
          },
        }));
      },
    }),
    {
      name: 'drishti-storage',
      partialize: state => ({
        settings: state.settings,
        // Don't persist sensitive auth data
      }),
    }
  )
);
```

## Navigation Structure

### Navigation Hierarchy

```typescript
// Root navigator
const RootNavigator = () => {
  const { isAuthenticated } = useAuth();

  return (
    <NavigationContainer>
      {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
};

// Authenticated app navigation
const AppNavigator = () => (
  <Tab.Navigator>
    <Tab.Screen name="Camera" component={CameraStack} />
    <Tab.Screen name="History" component={HistoryStack} />
    <Tab.Screen name="Profile" component={ProfileStack} />
  </Tab.Navigator>
);

// Camera stack
const CameraStack = () => (
  <Stack.Navigator>
    <Stack.Screen name="CameraView" component={CameraScreen} />
    <Stack.Screen name="AnalysisResult" component={AnalysisScreen} />
    <Stack.Screen name="ImagePreview" component={PreviewScreen} />
  </Stack.Navigator>
);
```

## Performance Optimization

### Image Handling

```typescript
// Optimized image loading
const OptimizedImage: React.FC<ImageProps> = ({ uri, ...props }) => {
  return (
    <Image
      source={{ uri }}
      {...props}
      resizeMode="cover"
      progressiveRenderingEnabled
      fadeDuration={200}
      onError={(error) => {
        console.error('Image load error:', error);
      }}
    />
  );
};
```

### Memory Management

- Automatic image cleanup after analysis
- Lazy loading for large lists
- Component memoization with React.memo
- Efficient re-renders with proper dependencies

### Bundle Optimization

- Code splitting by screen
- Dynamic imports for heavy components
- Asset optimization
- Tree shaking for unused code

## Accessibility Features

### Screen Reader Support

```typescript
// Accessible camera button
<TouchableOpacity
  accessible
  accessibilityLabel="Capture photo for analysis"
  accessibilityHint="Double tap to take a photo and analyze it with AI"
  accessibilityRole="button"
  onPress={capturePhoto}
>
  <CameraIcon />
</TouchableOpacity>
```

### Voice Feedback

```typescript
import * as Speech from 'expo-speech';

const speakAnalysis = (analysis: VisualAnalysis) => {
  Speech.speak(analysis.description, {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.8,
  });
};
```

### High Contrast Mode

- Dynamic color schemes
- Increased font sizes
- Enhanced button visibility
- Reduced motion options

## Error Handling

### Error Boundaries

```typescript
class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Log to crash reporting service
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallbackScreen />;
    }

    return this.props.children;
  }
}
```

### Network Error Handling

- Offline detection
- Retry mechanisms
- Graceful degradation
- User feedback for network issues

## Testing Strategy

### Component Testing

```typescript
import { render, fireEvent } from '@testing-library/react-native';

describe('CameraScreen', () => {
  test('should capture photo when button pressed', async () => {
    const mockOnCapture = jest.fn();

    const { getByTestId } = render(
      <CameraScreen onCapture={mockOnCapture} />
    );

    const captureButton = getByTestId('capture-button');
    fireEvent.press(captureButton);

    expect(mockOnCapture).toHaveBeenCalled();
  });
});
```

### E2E Testing

- User journey testing
- Camera functionality
- API integration
- Offline scenarios
