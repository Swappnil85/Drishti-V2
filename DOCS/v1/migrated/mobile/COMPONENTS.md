# Component Library

## Overview

The Drishti mobile app uses a component-based architecture with reusable, accessible, and well-tested components. All components are built with TypeScript and follow consistent design patterns.

## Component Categories

### Common Components

- **Button** - Primary, secondary, and icon buttons
- **Input** - Text inputs with validation
- **Card** - Content containers
- **Modal** - Overlay dialogs
- **Loading** - Loading indicators
- **Toast** - Notification messages

### Camera Components

- **CameraView** - Main camera interface
- **CameraControls** - Capture and settings controls
- **ImagePreview** - Image preview with actions
- **AnalysisOverlay** - AI analysis results overlay

### Form Components

- **FormField** - Input field with label and validation
- **FormButton** - Form submission buttons
- **FormError** - Error message display
- **FormGroup** - Grouped form elements

## Component Specifications

### Button Component

```typescript
interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  accessibilityLabel?: string;
  testID?: string;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  accessibilityLabel,
  testID
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        styles[variant],
        styles[size],
        disabled && styles.disabled
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      accessible
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator size="small" color={getTextColor(variant)} />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.icon}>{icon}</View>}
          <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};
```

### Input Component

```typescript
interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  error?: string;
  required?: boolean;
  disabled?: boolean;
  testID?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  error,
  required = false,
  disabled = false,
  testID
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      <TextInput
        style={[
          styles.input,
          error && styles.inputError,
          disabled && styles.inputDisabled
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        editable={!disabled}
        accessible
        accessibilityLabel={label}
        testID={testID}
      />
      {error && (
        <Text style={styles.errorText} accessible accessibilityRole="alert">
          {error}
        </Text>
      )}
    </View>
  );
};
```

### CameraView Component

```typescript
interface CameraViewProps {
  onCapture: (image: CameraCapture) => void;
  onClose: () => void;
  analysisMode?: 'realtime' | 'manual';
}

const CameraView: React.FC<CameraViewProps> = ({
  onCapture,
  onClose,
  analysisMode = 'manual'
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.back);
  const [flashMode, setFlashMode] = useState(Camera.Constants.FlashMode.off);
  const cameraRef = useRef<Camera>(null);

  // Permission handling
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
          exif: false
        });

        onCapture({
          uri: photo.uri,
          width: photo.width,
          height: photo.height,
          type: 'image'
        });
      } catch (error) {
        console.error('Camera capture error:', error);
      }
    }
  };

  if (hasPermission === null) {
    return <LoadingScreen />;
  }

  if (hasPermission === false) {
    return <CameraPermissionScreen />;
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        flashMode={flashMode}
      >
        <CameraOverlay
          onCapture={takePicture}
          onClose={onClose}
          onFlipCamera={() => setCameraType(
            cameraType === Camera.Constants.Type.back
              ? Camera.Constants.Type.front
              : Camera.Constants.Type.back
          )}
          onToggleFlash={() => setFlashMode(
            flashMode === Camera.Constants.FlashMode.off
              ? Camera.Constants.FlashMode.on
              : Camera.Constants.FlashMode.off
          )}
        />
      </Camera>
    </View>
  );
};
```

### AnalysisResult Component

```typescript
interface AnalysisResultProps {
  analysis: VisualAnalysis;
  image: CameraCapture;
  onSave?: () => void;
  onRetry?: () => void;
  onShare?: () => void;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({
  analysis,
  image,
  onSave,
  onRetry,
  onShare
}) => {
  const { speakText } = useSpeech();

  const handleSpeakDescription = () => {
    speakText(analysis.description);
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.imageCard}>
        <Image source={{ uri: image.uri }} style={styles.image} />
        <View style={styles.imageOverlay}>
          <Text style={styles.confidence}>
            Confidence: {Math.round(analysis.confidence * 100)}%
          </Text>
        </View>
      </Card>

      <Card style={styles.analysisCard}>
        <View style={styles.header}>
          <Text style={styles.title}>Analysis Result</Text>
          <Button
            title="Speak"
            variant="ghost"
            icon={<SpeakerIcon />}
            onPress={handleSpeakDescription}
            accessibilityLabel="Read analysis aloud"
          />
        </View>

        <Text
          style={styles.description}
          accessible
          accessibilityRole="text"
        >
          {analysis.description}
        </Text>

        {analysis.tags.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={styles.tagsTitle}>Tags:</Text>
            <View style={styles.tags}>
              {analysis.tags.map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card>

      <View style={styles.actions}>
        {onSave && (
          <Button
            title="Save"
            onPress={onSave}
            icon={<SaveIcon />}
          />
        )}
        {onRetry && (
          <Button
            title="Retry"
            variant="outline"
            onPress={onRetry}
            icon={<RetryIcon />}
          />
        )}
        {onShare && (
          <Button
            title="Share"
            variant="outline"
            onPress={onShare}
            icon={<ShareIcon />}
          />
        )}
      </View>
    </ScrollView>
  );
};
```

## Design System

### Color Palette

```typescript
export const colors = {
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#0ea5e9',
    600: '#0284c7',
    900: '#0c4a6e',
  },
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    500: '#6b7280',
    900: '#111827',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
};
```

### Typography

```typescript
export const typography = {
  h1: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    lineHeight: 40,
  },
  h2: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    lineHeight: 32,
  },
  body: {
    fontSize: 16,
    fontWeight: 'normal' as const,
    lineHeight: 24,
  },
  caption: {
    fontSize: 12,
    fontWeight: 'normal' as const,
    lineHeight: 16,
  },
};
```

### Spacing

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

## Component Testing

### Testing Utilities

```typescript
// Custom render function with providers
const renderWithProviders = (
  ui: React.ReactElement,
  options?: RenderOptions
) => {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <NavigationContainer>
      <AuthProvider>
        {children}
      </AuthProvider>
    </NavigationContainer>
  );

  return render(ui, { wrapper: Wrapper, ...options });
};
```

### Component Tests

```typescript
describe('Button Component', () => {
  test('renders with correct title', () => {
    const { getByText } = renderWithProviders(
      <Button title="Test Button" onPress={() => {}} />
    );

    expect(getByText('Test Button')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    const { getByRole } = renderWithProviders(
      <Button title="Test Button" onPress={mockOnPress} />
    );

    fireEvent.press(getByRole('button'));
    expect(mockOnPress).toHaveBeenCalledTimes(1);
  });

  test('shows loading state', () => {
    const { getByTestId } = renderWithProviders(
      <Button title="Test Button" onPress={() => {}} loading />
    );

    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

## Performance Guidelines

### Component Optimization

- Use React.memo for expensive components
- Implement proper dependency arrays in useEffect
- Avoid inline functions in render
- Use useCallback for event handlers

### Image Optimization

- Compress images before upload
- Use appropriate image formats
- Implement progressive loading
- Cache frequently used images

### Memory Management

- Clean up subscriptions in useEffect
- Remove event listeners on unmount
- Clear timers and intervals
- Optimize large lists with FlatList
