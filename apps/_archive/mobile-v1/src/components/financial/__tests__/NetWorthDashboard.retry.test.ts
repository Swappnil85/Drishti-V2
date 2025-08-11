import { makeRetry } from '../NetWorthDashboard.utils';

describe('NetWorthDashboard retry handler', () => {
  it('calls both refresh functions', () => {
    const a = jest.fn();
    const b = jest.fn();
    const handler = makeRetry(a, b);
    handler();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});

