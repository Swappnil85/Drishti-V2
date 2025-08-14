import { act, fireEvent, render } from '@testing-library/react-native';
import { ThemeProvider } from '../theme/ThemeProvider';
import { ToastProvider, useToast } from '../ui/overlays/ToastProvider';
import { SheetProvider, useSheet } from '../ui/overlays/SheetProvider';
import { Text, View, Pressable } from 'react-native';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

const Demo = () => {
  const { showToast } = useToast();
  const { openSheet, closeSheet } = useSheet();
  return (
    <View>
      <Pressable accessibilityRole='button' onPress={() => showToast('Hi')}>
        <Text>toast</Text>
      </Pressable>
      <Pressable
        accessibilityRole='button'
        onPress={() =>
          openSheet(close => (
            <Pressable accessibilityRole='button' onPress={close}>
              <Text>inside</Text>
            </Pressable>
          ))
        }
      >
        <Text>sheet</Text>
      </Pressable>
    </View>
  );
};

describe('E4-S4: Overlays (Sheet & Toast)', () => {
  it('shows toast and stacks up to 3', () => {
    const { getByText, getAllByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <SheetProvider>
            <Demo />
          </SheetProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    fireEvent.press(getByText('toast'));
    fireEvent.press(getByText('toast'));
    fireEvent.press(getByText('toast'));
    fireEvent.press(getByText('toast'));
    const alerts = getAllByText('Hi');
    expect(alerts.length).toBe(3);
  });

  it('opens and closes sheet via inner button', () => {
    const { getByText, queryByText } = render(
      <ThemeProvider>
        <ToastProvider>
          <SheetProvider>
            <Demo />
          </SheetProvider>
        </ToastProvider>
      </ThemeProvider>
    );
    fireEvent.press(getByText('sheet'));
    expect(queryByText('inside')).toBeTruthy();
    // close via inner button
    fireEvent.press(getByText('inside'));
    expect(queryByText('inside')).toBeFalsy();
  });
});
