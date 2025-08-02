import { OAuth2Client } from 'google-auth-library';

// Google OAuth configuration
export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
}

// Google user profile interface
export interface GoogleUserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string | undefined;
  email_verified: boolean;
}

// Google OAuth service
export class GoogleOAuthService {
  private client: OAuth2Client;
  private config: GoogleOAuthConfig;

  constructor() {
    this.config = this.getConfig();
    this.client = new OAuth2Client(
      this.config.clientId,
      this.config.clientSecret,
      this.config.redirectUri
    );
  }

  private getConfig(): GoogleOAuthConfig {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      'http://localhost:3000/auth/google/callback';

    if (!clientId || !clientSecret) {
      throw new Error(
        'Google OAuth configuration missing. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET environment variables.'
      );
    }

    return {
      clientId,
      clientSecret,
      redirectUri,
    };
  }

  // Generate authorization URL
  getAuthorizationUrl(state?: string): string {
    const scopes = [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile',
    ];

    const authUrlOptions: any = {
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent screen to get refresh token
    };

    if (state) {
      authUrlOptions.state = state;
    }

    return this.client.generateAuthUrl(authUrlOptions);
  }

  // Exchange authorization code for tokens
  async exchangeCodeForTokens(code: string): Promise<{
    accessToken: string;
    refreshToken?: string | undefined;
    idToken?: string | undefined;
  }> {
    try {
      const { tokens } = await this.client.getToken(code);

      if (!tokens.access_token) {
        throw new Error('No access token received from Google');
      }

      const result: {
        accessToken: string;
        refreshToken?: string | undefined;
        idToken?: string | undefined;
      } = {
        accessToken: tokens.access_token,
      };

      if (tokens.refresh_token) {
        result.refreshToken = tokens.refresh_token;
      }

      if (tokens.id_token) {
        result.idToken = tokens.id_token;
      }

      return result;
    } catch (error) {
      console.error('[Google OAuth] Token exchange failed:', error);
      throw new Error('Failed to exchange authorization code for tokens');
    }
  }

  // Get user profile using access token
  async getUserProfile(accessToken: string): Promise<GoogleUserProfile> {
    try {
      this.client.setCredentials({ access_token: accessToken });

      const response = await fetch(
        'https://www.googleapis.com/oauth2/v2/userinfo',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Google API request failed: ${response.status}`);
      }

      const profile = await response.json();

      const result: GoogleUserProfile = {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        email_verified: profile.verified_email || false,
      };

      if (profile.picture) {
        result.picture = profile.picture;
      }

      return result;
    } catch (error) {
      console.error('[Google OAuth] Failed to get user profile:', error);
      throw new Error('Failed to retrieve user profile from Google');
    }
  }

  // Verify ID token (alternative method)
  async verifyIdToken(idToken: string): Promise<GoogleUserProfile> {
    try {
      const ticket = await this.client.verifyIdToken({
        idToken,
        audience: this.config.clientId,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        throw new Error('Invalid ID token payload');
      }

      return {
        id: payload.sub,
        email: payload.email || '',
        name: payload.name || '',
        picture: payload.picture,
        email_verified: payload.email_verified || false,
      };
    } catch (error) {
      console.error('[Google OAuth] ID token verification failed:', error);
      throw new Error('Failed to verify Google ID token');
    }
  }

  // Revoke tokens
  async revokeTokens(accessToken: string): Promise<void> {
    try {
      await this.client.revokeToken(accessToken);
    } catch (error) {
      console.error('[Google OAuth] Token revocation failed:', error);
      throw new Error('Failed to revoke Google tokens');
    }
  }

  // Refresh access token
  async refreshAccessToken(refreshToken: string): Promise<{
    accessToken: string;
    expiresIn?: number | undefined;
  }> {
    try {
      this.client.setCredentials({ refresh_token: refreshToken });
      const { credentials } = await this.client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new Error('No access token received from refresh');
      }

      const result: {
        accessToken: string;
        expiresIn?: number | undefined;
      } = {
        accessToken: credentials.access_token,
      };

      if (credentials.expiry_date) {
        result.expiresIn = Math.floor(
          (credentials.expiry_date - Date.now()) / 1000
        );
      }

      return result;
    } catch (error) {
      console.error('[Google OAuth] Token refresh failed:', error);
      throw new Error('Failed to refresh Google access token');
    }
  }

  // Check if Google OAuth is configured
  static isConfigured(): boolean {
    return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
  }
}

// Export singleton instance
export const googleOAuthService = GoogleOAuthService.isConfigured()
  ? new GoogleOAuthService()
  : null;
