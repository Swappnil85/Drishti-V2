import { Linking } from 'react-native';
import { logEvent } from '../telemetry';

export type DeepLinkRoute = {
  screen: string;
  params?: Record<string, any>;
};

/**
 * Parse deep link URL and extract route information
 * E4-S8: Support drishti://paywall and drishti://accounts
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  try {
    const urlObj = new URL(url);

    // Only handle drishti:// scheme
    if (urlObj.protocol !== 'drishti:') {
      return null;
    }

    // Handle both hostname and pathname formats
    let path = urlObj.hostname;
    if (urlObj.pathname && urlObj.pathname !== '/') {
      path = urlObj.pathname.replace(/^\/+|\/+$/g, '');
    }

    // Log telemetry per AC
    logEvent('deeplink_open', { path });

    switch (path) {
      case 'paywall':
        return { screen: 'Paywall' };
      case 'accounts':
        return { screen: 'Accounts' };
      default:
        return null;
    }
  } catch {
    // Invalid URL format
    return null;
  }
}

/**
 * Handle deep link navigation
 */
export function handleDeepLink(
  url: string,
  navigate: (screen: string, params?: any) => void
): boolean {
  const route = parseDeepLink(url);

  if (!route) {
    return false;
  }

  navigate(route.screen, route.params);
  return true;
}

/**
 * Initialize deep link listeners
 */
export function initializeDeepLinking(
  navigate: (screen: string, params?: any) => void
): () => void {
  // Skip deep linking initialization in test environment
  if (process.env.NODE_ENV === 'test') {
    return () => {};
  }

  // Handle initial URL (app opened via deep link)
  Linking.getInitialURL()
    .then(url => {
      if (url) {
        handleDeepLink(url, navigate);
      }
    })
    .catch(() => {
      // Ignore errors in getting initial URL
    });

  // Handle URL changes (app already open)
  const subscription = Linking.addEventListener('url', ({ url }) => {
    handleDeepLink(url, navigate);
  });

  return () => {
    subscription?.remove();
  };
}
