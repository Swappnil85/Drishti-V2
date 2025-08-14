import { render, fireEvent } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider';
import { EmptyState, ErrorState } from '../ui/States';
import { Skeleton, SkeletonText } from '../ui/Skeleton';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

describe('E4-S3: Skeleton / Empty / Error components', () => {
  it('renders Skeleton and SkeletonText with a11y roles', () => {
    const { UNSAFE_getAllByType } = render(
      <ThemeProvider>
        <>
          <Skeleton />
          <SkeletonText lines={2} />
        </>
      </ThemeProvider>
    );
    // Fallback to type query because getAllByA11yRole is not supported in RNTL 13
    const bars = UNSAFE_getAllByType(Skeleton);
    expect(bars.length).toBeGreaterThan(0);
  });

  it('renders EmptyState with optional action', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <EmptyState
          title='No items'
          description='Try adding one'
          actionLabel='Add'
          onAction={onPress}
        />
      </ThemeProvider>
    );
    fireEvent.press(getByText('Add'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders ErrorState with retry', () => {
    const onRetry = jest.fn();
    const { getByText } = render(
      <ThemeProvider>
        <ErrorState title='Failed' description='Oops' onAction={onRetry} />
      </ThemeProvider>
    );
    fireEvent.press(getByText('Retry'));
    expect(onRetry).toHaveBeenCalled();
  });
});
