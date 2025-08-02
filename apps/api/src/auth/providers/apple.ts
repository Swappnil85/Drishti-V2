import appleSignin from 'apple-signin-auth';

// Apple OAuth configuration
export interface AppleOAuthConfig {
  clientId: string;
  teamId: string;
  keyId: string;
  privateKey: string;
  redirectUri: string;
}

// Apple user profile interface
export interface AppleUserProfile {
  id: string;
  email: string;
  name?: string | undefined;
  email_verified: boolean;
}

// Apple OAuth service
export class AppleOAuthService {
  private config: AppleOAuthConfig;

  constructor() {
    this.config = this.getConfig();
  }

  private getConfig(): AppleOAuthConfig {
    const clientId = process.env.APPLE_CLIENT_ID;
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY;
    const redirectUri =
      process.env.APPLE_REDIRECT_URI ||
      'http://localhost:3000/auth/apple/callback';

    if (!clientId || !teamId || !keyId || !privateKey) {
      throw new Error(
        'Apple OAuth configuration missing. Set APPLE_CLIENT_ID, APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables.'
      );
    }

    // Handle private key format (replace \\n with actual newlines)
    const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

    return {
      clientId,
      teamId,
      keyId,
      privateKey: formattedPrivateKey,
      redirectUri,
    };
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: 'name email',
      response_mode: 'form_post',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://appleid.apple.com/auth/authorize?${params.toString()}`;
  }

  // Verify authorization code and get user info
  async verifyAuthorizationCode(
    code: string,
    user?: string
  ): Promise<AppleUserProfile> {
    try {
      // Verify the authorization code
      const clientSecret = appleSignin.getClientSecret({
        clientID: this.config.clientId,
        teamID: this.config.teamId,
        privateKey: this.config.privateKey,
        keyIdentifier: this.config.keyId,
      });

      const tokens = await appleSignin.getAuthorizationToken(code, {
        clientID: this.config.clientId,
        clientSecret,
        redirectUri: this.config.redirectUri,
      });

      if (!tokens.id_token) {
        throw new Error('No ID token received from Apple');
      }

      // Verify and decode the ID token
      const claims = await appleSignin.verifyIdToken(tokens.id_token, {
        audience: this.config.clientId,
        ignoreExpiration: false,
      });

      // Parse user info if provided (only available on first sign-in)
      let userName: string | undefined;
      if (user) {
        try {
          const userInfo = JSON.parse(user);
          if (userInfo.name) {
            userName =
              `${userInfo.name.firstName || ''} ${userInfo.name.lastName || ''}`.trim();
          }
        } catch (error) {
          console.warn('[Apple OAuth] Failed to parse user info:', error);
        }
      }

      const result: AppleUserProfile = {
        id: claims.sub,
        email: claims.email || '',
        email_verified:
          claims.email_verified === 'true' || claims.email_verified === true,
      };

      if (userName) {
        result.name = userName;
      }

      return result;
    } catch (error) {
      console.error('[Apple OAuth] Authorization verification failed:', error);
      throw new Error('Failed to verify Apple authorization code');
    }
  }

  // Refresh access token (Apple doesn't provide refresh tokens for Sign in with Apple)
  async refreshAccessToken(_refreshToken: string): Promise<{
    accessToken: string;
    expiresIn?: number;
  }> {
    // Apple Sign in with Apple doesn't provide refresh tokens
    // The ID token is valid for a long time and should be re-verified as needed
    throw new Error('Apple Sign in with Apple does not support token refresh');
  }

  // Revoke tokens (Apple doesn't provide a revoke endpoint for Sign in with Apple)
  async revokeTokens(_refreshToken: string): Promise<void> {
    // Apple Sign in with Apple doesn't provide a token revocation endpoint
    // Tokens expire automatically
    console.warn(
      '[Apple OAuth] Token revocation not supported for Apple Sign in with Apple'
    );
  }

  // Generate client secret (for server-to-server communication)
  generateClientSecret(): string {
    return appleSignin.getClientSecret({
      clientID: this.config.clientId,
      teamID: this.config.teamId,
      privateKey: this.config.privateKey,
      keyIdentifier: this.config.keyId,
    });
  }

  // Verify ID token independently
  async verifyIdToken(idToken: string): Promise<AppleUserProfile> {
    try {
      const claims = await appleSignin.verifyIdToken(idToken, {
        audience: this.config.clientId,
        ignoreExpiration: false,
      });

      return {
        id: claims.sub,
        email: claims.email || '',
        email_verified:
          claims.email_verified === 'true' || claims.email_verified === true,
      };
    } catch (error) {
      console.error('[Apple OAuth] ID token verification failed:', error);
      throw new Error('Failed to verify Apple ID token');
    }
  }

  // Check if Apple OAuth is configured
  static isConfigured(): boolean {
    return !!(
      process.env.APPLE_CLIENT_ID &&
      process.env.APPLE_TEAM_ID &&
      process.env.APPLE_KEY_ID &&
      process.env.APPLE_PRIVATE_KEY
    );
  }
}

// Export singleton instance
export const appleOAuthService = AppleOAuthService.isConfigured()
  ? new AppleOAuthService()
  : null;
