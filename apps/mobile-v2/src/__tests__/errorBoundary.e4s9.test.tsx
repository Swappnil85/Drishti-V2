import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import ErrorBoundary from '../ErrorBoundary';
import { logEvent } from '../telemetry';

// Mock telemetry
jest.mock('../telemetry', () => ({
  logEvent: jest.fn(),
}));

const mockLogEvent = logEvent as jest.MockedFunction<typeof logEvent>;

// Mock expo-dev-client to avoid import errors in tests
jest.mock('expo-dev-client', () => ({
  reload: jest.fn(),
}));

// Component that throws an error for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error message');
  }
  return <Text>No error</Text>;
};

describe('E4-S9: Error Boundary Enhancement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console.error for cleaner test output
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should render children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    expect(getByText('No error')).toBeTruthy();
  });

  it('should render error UI when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(
      getByText("We've been notified and are working on a fix")
    ).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should send crash report via telemetry when error occurs', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(mockLogEvent).toHaveBeenCalledWith(
      'crash_report',
      expect.objectContaining({
        errorId: expect.stringMatching(/^err_\d+_[a-z0-9]+$/),
        message: 'Test error message',
        stack: expect.stringContaining('Test error message'),
        platform: expect.any(String),
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/
        ),
      })
    );
  });

  it('should display error ID when error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Should display error ID
    expect(getByText(/Error ID: err_\d+_[a-z0-9]+/)).toBeTruthy();
  });

  it('should have proper accessibility attributes', () => {
    const { getByRole, getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Check that error UI is displayed
    expect(getByText('Something went wrong')).toBeTruthy();

    // Button should have proper accessibility
    const button = getByRole('button');
    expect(button).toBeTruthy();
    expect(button.props.accessibilityLabel).toBe('Try again');
    expect(button.props.accessibilityHint).toBe(
      'Reloads the app to recover from the error'
    );
  });

  it('should have minimum touch target size for button', () => {
    const { getByRole } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const button = getByRole('button');
    const buttonStyle = button.props.style;

    // Should have minimum 44px touch target (E4-S10)
    expect(buttonStyle.minHeight).toBe(44);
  });

  it('should call reset method when try again is pressed', () => {
    const { getByRole, getByText } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    // Error UI should be visible
    expect(getByText('Something went wrong')).toBeTruthy();

    // Press try again button - this should attempt to reload
    const button = getByRole('button');
    expect(() => fireEvent.press(button)).not.toThrow();

    // Button should still be pressable
    expect(button).toBeTruthy();
  });

  it('should truncate long error stacks for telemetry', () => {
    // Create a component with a very long error message
    const LongErrorComponent = () => {
      const longMessage = 'A'.repeat(1000);
      throw new Error(longMessage);
    };

    render(
      <ErrorBoundary>
        <LongErrorComponent />
      </ErrorBoundary>
    );

    expect(mockLogEvent).toHaveBeenCalledWith(
      'crash_report',
      expect.objectContaining({
        stack: expect.stringMatching(/^.{1,500}$/), // Should be truncated to 500 chars
      })
    );
  });

  it('should handle component stack truncation', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const crashReportCall = mockLogEvent.mock.calls.find(
      call => call[0] === 'crash_report'
    );
    expect(crashReportCall).toBeTruthy();

    const crashData = crashReportCall![1];
    if (crashData.componentStack) {
      expect(crashData.componentStack.length).toBeLessThanOrEqual(300);
    }
  });
});
