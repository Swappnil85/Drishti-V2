import React from 'react';
import { render } from '@testing-library/react-native';
import HomeStreaksWins from '../HomeStreaksWins';

describe('HomeStreaksWins', () => {
  it('shows current/best streak and wins', () => {
    const { getByText } = render(
      <HomeStreaksWins
        monthlyChanges={[
          { month: 'Jan', year: 2025, change: 100 },
          { month: 'Feb', year: 2025, change: 200 },
          { month: 'Mar', year: 2025, change: -50 },
          { month: 'Apr', year: 2025, change: 20 },
        ] as any}
      />
    );

    // Best streak should be 2 (Jan, Feb), then reset in Mar
    expect(getByText(/Best Streak/i)).toBeTruthy();
    expect(getByText(/2 mo/)).toBeTruthy();

    // Wins total 3
    expect(getByText(/Wins/i)).toBeTruthy();
    expect(getByText('3')).toBeTruthy();
  });
});

