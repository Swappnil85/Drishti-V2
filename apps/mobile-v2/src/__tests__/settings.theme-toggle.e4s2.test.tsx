import { render } from '@testing-library/react-native';
import App from '../App';

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn().mockResolvedValue(null),
}));

describe('E4-S2: Theme provider smoke', () => {
  it('renders app without crashing', () => {
    const tree = render(<App />);
    expect(tree.toJSON()).toBeTruthy();
  });
});
