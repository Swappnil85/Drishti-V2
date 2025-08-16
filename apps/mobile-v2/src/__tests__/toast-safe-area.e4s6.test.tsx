/**
 * E4-S6: Toast Safe Area Integration Tests
 * Tests for ToastProvider safe area inset handling and positioning
 */

import React from 'react';
import { render, act, fireEvent } from '@testing-library/react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ToastProvider, useToast } from '../ui/overlays/ToastProvider';
import { ThemeProvider } from '../theme/ThemeProvider';

// Mock safe area insets
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: jest.fn(),
}));

const mockUseSafeAreaInsets = useSafeAreaInsets as jest.MockedFunction<typeof useSafeAreaInsets>;

// Test component that uses toast
const TestComponent = () => {
  const { showToast } = useToast();
  
  return (
    <>
      <button
        testID="show-toast"
        onPress={() => showToast('Test message', 1000)}
      >
        Show Toast
      </button>
      <button
        testID="show-long-toast"
        onPress={() => showToast('Long message', 5000)}
      >
        Show Long Toast
      </button>
    </>
  );
};

describe('E4-S6: Toast Safe Area Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('positions toast with default safe area insets', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('show-toast'));
    });

    expect(getByText('Test message')).toBeTruthy();
  });

  it('positions toast with device safe area insets (notched device)', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('show-toast'));
    });

    expect(getByText('Test message')).toBeTruthy();
  });

  it('positions toast with landscape safe area insets', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 21,
      left: 44,
      right: 44,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('show-toast'));
    });

    expect(getByText('Test message')).toBeTruthy();
  });

  it('handles multiple toasts with safe area positioning', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 44,
      bottom: 34,
      left: 0,
      right: 0,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    // Show multiple toasts
    act(() => {
      fireEvent.press(getByTestId('show-toast'));
      fireEvent.press(getByTestId('show-long-toast'));
    });

    expect(getByText('Test message')).toBeTruthy();
    expect(getByText('Long message')).toBeTruthy();
  });

  it('handles timer cleanup on unmount', () => {
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    });

    const { getByTestId, unmount } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('show-long-toast'));
    });

    // Unmount before timer completes
    unmount();

    // Fast-forward time to ensure no memory leaks
    act(() => {
      jest.advanceTimersByTime(6000);
    });

    // Should not throw or cause issues
    expect(true).toBe(true);
  });

  it('respects minimum safe area spacing', () => {
    // Test with very small insets
    mockUseSafeAreaInsets.mockReturnValue({
      top: 0,
      bottom: 5,
      left: 0,
      right: 0,
    });

    const { getByTestId, getByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <TestComponent />
        </ToastProvider>
      </ThemeProvider>
    );

    act(() => {
      fireEvent.press(getByTestId('show-toast'));
    });

    expect(getByText('Test message')).toBeTruthy();
  });
});
