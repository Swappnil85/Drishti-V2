import { FastifyInstance } from 'fastify';
import {
  authService,
  RegisterData,
  LoginData,
  SessionContext,
} from '../auth/service';
import { googleOAuthService } from '../auth/providers/google';
import { appleOAuthService } from '../auth/providers/apple';
import { jwtService } from '../auth/jwt';

// Request interfaces
interface RegisterRequest {
  Body: {
    email: string;
    name: string;
    password?: string;
  };
}

interface LoginRequest {
  Body: {
    email: string;
    password: string;
  };
}

interface GoogleCallbackRequest {
  Querystring: {
    code: string;
    state?: string;
  };
}

interface AppleCallbackRequest {
  Body: {
    code: string;
    user?: string;
    state?: string;
  };
}

interface RefreshTokenRequest {
  Body: {
    refreshToken: string;
  };
}

interface VerifyEmailRequest {
  Querystring: {
    token: string;
  };
}

// Helper function to extract session context from request
function getSessionContext(request: any): SessionContext {
  return {
    ipAddress: request.ip,
    userAgent: request.headers['user-agent'],
    deviceInfo: request.headers['x-device-info'], // Custom header for device info
  };
}

// Authentication routes
export async function authRoutes(fastify: FastifyInstance) {
  // Register with email/password
  fastify.post<RegisterRequest>('/register', async (request, reply) => {
    const { email, name, password } = request.body;

    if (!email || !name || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Email, name, and password are required',
      });
    }

    const registerData: RegisterData = {
      email: email.toLowerCase().trim(),
      name: name.trim(),
      password,
      provider: 'email',
    };

    const sessionContext = getSessionContext(request);
    const result = await authService.register(registerData, sessionContext);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return reply.code(201).send({
      success: true,
      message: result.requiresEmailVerification
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        email_verified: result.user!.email_verified,
      },
      tokens: result.tokens,
    });
  });

  // Login with email/password
  fastify.post<LoginRequest>('/login', async (request, reply) => {
    const { email, password } = request.body;

    if (!email || !password) {
      return reply.code(400).send({
        success: false,
        error: 'Email and password are required',
      });
    }

    const loginData: LoginData = {
      email: email.toLowerCase().trim(),
      password,
      provider: 'email',
    };

    const sessionContext = getSessionContext(request);
    const result = await authService.login(loginData, sessionContext);

    if (!result.success) {
      const statusCode = result.requiresEmailVerification ? 403 : 401;
      return reply.code(statusCode).send(result);
    }

    return reply.send({
      success: true,
      message: 'Login successful',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        email_verified: result.user!.email_verified,
        last_login_at: result.user!.last_login_at,
      },
      tokens: result.tokens,
    });
  });

  // Google OAuth - Get authorization URL
  fastify.get('/google', async (_request, reply) => {
    if (!googleOAuthService) {
      return reply.code(503).send({
        success: false,
        error: 'Google OAuth is not configured',
      });
    }

    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = googleOAuthService.getAuthorizationUrl(state);

      return reply.send({
        success: true,
        authUrl,
        state,
      });
    } catch (error) {
      console.error('[Auth Routes] Google OAuth URL generation failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate Google OAuth URL',
      });
    }
  });

  // Google OAuth - Handle callback
  fastify.get<GoogleCallbackRequest>(
    '/google/callback',
    async (request, reply) => {
      if (!googleOAuthService) {
        return reply.code(503).send({
          success: false,
          error: 'Google OAuth is not configured',
        });
      }

      const { code } = request.query;

      if (!code) {
        return reply.code(400).send({
          success: false,
          error: 'Authorization code is required',
        });
      }

      try {
        // Exchange code for tokens
        const tokens = await googleOAuthService.exchangeCodeForTokens(code);

        // Get user profile
        const profile = await googleOAuthService.getUserProfile(
          tokens.accessToken
        );

        // Check if user exists
        const existingUser = await authService.getUserByEmail(profile.email);

        if (existingUser) {
          // Login existing user
          const loginResult = await authService.login({
            email: profile.email,
            provider: 'google',
            providerId: profile.id,
          });

          if (!loginResult.success) {
            return reply.code(401).send(loginResult);
          }

          return reply.send({
            success: true,
            message: 'Google login successful',
            user: {
              id: loginResult.user!.id,
              email: loginResult.user!.email,
              name: loginResult.user!.name,
              email_verified: loginResult.user!.email_verified,
            },
            tokens: loginResult.tokens,
          });
        } else {
          // Register new user
          const registerData: RegisterData = {
            email: profile.email,
            name: profile.name,
            provider: 'google',
            providerId: profile.id,
          };

          if (profile.picture) {
            registerData.avatarUrl = profile.picture;
          }

          const registerResult = await authService.register(registerData);

          if (!registerResult.success) {
            return reply.code(400).send(registerResult);
          }

          return reply.send({
            success: true,
            message: 'Google registration successful',
            user: {
              id: registerResult.user!.id,
              email: registerResult.user!.email,
              name: registerResult.user!.name,
              email_verified: registerResult.user!.email_verified,
            },
            tokens: registerResult.tokens,
          });
        }
      } catch (error) {
        console.error('[Auth Routes] Google OAuth callback failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'Google OAuth authentication failed',
        });
      }
    }
  );

  // Apple OAuth - Get authorization URL
  fastify.get('/apple', async (_request, reply) => {
    if (!appleOAuthService) {
      return reply.code(503).send({
        success: false,
        error: 'Apple OAuth is not configured',
      });
    }

    try {
      const state = Math.random().toString(36).substring(2, 15);
      const authUrl = appleOAuthService.getAuthorizationUrl(state);

      return reply.send({
        success: true,
        authUrl,
        state,
      });
    } catch (error) {
      console.error('[Auth Routes] Apple OAuth URL generation failed:', error);
      return reply.code(500).send({
        success: false,
        error: 'Failed to generate Apple OAuth URL',
      });
    }
  });

  // Apple OAuth - Handle callback
  fastify.post<AppleCallbackRequest>(
    '/apple/callback',
    async (request, reply) => {
      if (!appleOAuthService) {
        return reply.code(503).send({
          success: false,
          error: 'Apple OAuth is not configured',
        });
      }

      const { code, user } = request.body;

      if (!code) {
        return reply.code(400).send({
          success: false,
          error: 'Authorization code is required',
        });
      }

      try {
        // Verify authorization code and get user info
        const profile = await appleOAuthService.verifyAuthorizationCode(
          code,
          user
        );

        // Check if user exists
        const existingUser = await authService.getUserByEmail(profile.email);

        if (existingUser) {
          // Login existing user
          const loginResult = await authService.login({
            email: profile.email,
            provider: 'apple',
            providerId: profile.id,
          });

          if (!loginResult.success) {
            return reply.code(401).send(loginResult);
          }

          return reply.send({
            success: true,
            message: 'Apple login successful',
            user: {
              id: loginResult.user!.id,
              email: loginResult.user!.email,
              name: loginResult.user!.name,
              email_verified: loginResult.user!.email_verified,
            },
            tokens: loginResult.tokens,
          });
        } else {
          // Register new user
          const registerResult = await authService.register({
            email: profile.email,
            name: profile.name || 'Apple User',
            provider: 'apple',
            providerId: profile.id,
          });

          if (!registerResult.success) {
            return reply.code(400).send(registerResult);
          }

          return reply.send({
            success: true,
            message: 'Apple registration successful',
            user: {
              id: registerResult.user!.id,
              email: registerResult.user!.email,
              name: registerResult.user!.name,
              email_verified: registerResult.user!.email_verified,
            },
            tokens: registerResult.tokens,
          });
        }
      } catch (error) {
        console.error('[Auth Routes] Apple OAuth callback failed:', error);
        return reply.code(500).send({
          success: false,
          error: 'Apple OAuth authentication failed',
        });
      }
    }
  );

  // Verify email
  fastify.get<VerifyEmailRequest>('/verify-email', async (request, reply) => {
    const { token } = request.query;

    if (!token) {
      return reply.code(400).send({
        success: false,
        error: 'Verification token is required',
      });
    }

    const result = await authService.verifyEmail(token);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return reply.send({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: result.user!.id,
        email: result.user!.email,
        name: result.user!.name,
        email_verified: result.user!.email_verified,
      },
      tokens: result.tokens,
    });
  });

  // Refresh tokens
  fastify.post<RefreshTokenRequest>('/refresh', async (request, reply) => {
    const { refreshToken } = request.body;

    if (!refreshToken) {
      return reply.code(400).send({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const sessionContext = getSessionContext(request);
    const result = await authService.refreshTokens(
      refreshToken,
      sessionContext
    );

    if (!result.success) {
      return reply.code(401).send(result);
    }

    return reply.send({
      success: true,
      message: 'Tokens refreshed successfully',
      tokens: result.tokens,
    });
  });

  // Get current user (protected route)
  fastify.get(
    '/me',
    {
      preHandler: async (request, reply) => {
        try {
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({
              success: false,
              error: 'Authorization header is required',
            });
          }

          const token = authHeader.substring(7);
          const payload = jwtService.verifyAccessToken(token);

          // Add user info to request
          (request as any).user = payload;
        } catch (error) {
          return reply.code(401).send({
            success: false,
            error: 'Invalid or expired token',
          });
        }
      },
    },
    async (request, reply) => {
      const userPayload = (request as any).user;
      const user = await authService.getUserById(userPayload.userId);

      if (!user) {
        return reply.code(404).send({
          success: false,
          error: 'User not found',
        });
      }

      return reply.send({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar_url: user.avatar_url,
          email_verified: user.email_verified,
          last_login_at: user.last_login_at,
          preferences: user.preferences,
        },
      });
    }
  );

  // Logout (revoke current session)
  fastify.post<RefreshTokenRequest>('/logout', async (request, reply) => {
    const { refreshToken } = request.body;

    if (!refreshToken) {
      return reply.code(400).send({
        success: false,
        error: 'Refresh token is required',
      });
    }

    const result = await authService.logout(refreshToken);

    if (!result.success) {
      return reply.code(400).send(result);
    }

    return reply.send({
      success: true,
      message: 'Logged out successfully',
    });
  });

  // Logout from all devices
  fastify.post(
    '/logout-all',
    {
      preHandler: async (request, reply) => {
        try {
          const authHeader = request.headers.authorization;
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return reply.code(401).send({
              success: false,
              error: 'Authorization header is required',
            });
          }

          const token = authHeader.substring(7);
          const payload = jwtService.verifyAccessToken(token);

          // Add user info to request
          (request as any).user = payload;
        } catch (error) {
          return reply.code(401).send({
            success: false,
            error: 'Invalid or expired token',
          });
        }
      },
    },
    async (request, reply) => {
      const userPayload = (request as any).user;
      const result = await authService.logoutAllDevices(userPayload.userId);

      if (!result.success) {
        return reply.code(400).send(result);
      }

      return reply.send({
        success: true,
        message: 'Logged out from all devices successfully',
      });
    }
  );
}
