import { render } from '@testing-library/react-native';
import App from '../../App';

// Avoid referencing Jest globals directly during TS typecheck; do runtime mocking in jest.setup.after.js
export const renderApp = () => render(<App />);
