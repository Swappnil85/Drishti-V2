import { AppLockState } from '../../services/SecurityService';
import { resolveBootState } from '../RootNavigator';

describe('resolveBootState', () => {
  it('returns onboarding when onboarding not completed', () => {
    const state = resolveBootState({
      onboardingCompleted: false,
      appLockEnabled: false,
      currentLockState: AppLockState.UNLOCKED,
    });
    expect(state).toBe('onboarding');
  });

  it('returns locked when onboarding completed and lock is enabled with locked state', () => {
    const state = resolveBootState({
      onboardingCompleted: true,
      appLockEnabled: true,
      currentLockState: AppLockState.LOCKED,
    });
    expect(state).toBe('locked');
  });

  it('returns app when onboarding completed and not locked', () => {
    const state = resolveBootState({
      onboardingCompleted: true,
      appLockEnabled: false,
      currentLockState: AppLockState.UNLOCKED,
    });
    expect(state).toBe('app');
  });
});

