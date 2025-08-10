/**
 * API Documentation Service
 * Comprehensive OpenAPI 3.0 documentation with interactive testing and SDK generation
 */

import { FastifyInstance } from 'fastify';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

interface APIEndpoint {
  path: string;
  method: string;
  summary: string;
  description: string;
  tags: string[];
  parameters?: any[];
  requestBody?: any;
  responses: any;
  security?: any[];
  examples?: any;
}

interface APIDocumentation {
  openapi: string;
  info: any;
  servers: any[];
  paths: any;
  components: any;
  tags: any[];
}

class APIDocumentationService {
  private documentation: APIDocumentation;
  private endpoints: Map<string, APIEndpoint> = new Map();
  private schemas: Map<string, any> = new Map();
  private examples: Map<string, any> = new Map();

  constructor() {
    this.documentation = this.initializeDocumentation();
    this.setupSchemas();
    this.setupExamples();
  }

  /**
   * Initialize base documentation structure
   */
  private initializeDocumentation(): APIDocumentation {
    return {
      openapi: '3.0.3',
      info: {
        title: 'Drishti FIRE Planning API',
        description: `
# Drishti API Documentation

Welcome to the Drishti FIRE Planning API! This comprehensive API provides all the tools you need to build financial independence and retirement planning applications.

## Features

- **Authentication & Security**: JWT-based auth with MFA support
- **Financial Management**: Accounts, goals, and scenario planning
- **Advanced Calculations**: FIRE projections, market analysis, debt optimization
- **Real-time Updates**: WebSocket support for live data
- **Batch Operations**: Efficient bulk data processing
- **GraphQL**: Flexible data fetching for mobile apps

## Getting Started

1. Register for an API key
2. Authenticate using JWT tokens
3. Start making requests to manage financial data
4. Use WebSocket for real-time updates

## Rate Limits

- **Free Tier**: 100 requests/minute
- **Premium Tier**: 1000 requests/minute
- **Enterprise**: Custom limits

## Support

- Email: api-support@drishti.com
- Documentation: https://docs.drishti.com
- Status Page: https://status.drishti.com
        `,
        version: '2.1.0',
        contact: {
          name: 'Drishti API Support',
          email: 'api-support@drishti.com',
          url: 'https://drishti.com/support',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
        termsOfService: 'https://drishti.com/terms',
      },
      servers: [
        {
          url: 'https://api.drishti.com/v2',
          description: 'Production server',
        },
        {
          url: 'https://staging-api.drishti.com/v2',
          description: 'Staging server',
        },
        {
          url: 'http://localhost:3000/v2',
          description: 'Development server',
        },
      ],
      paths: {},
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT token obtained from /auth/login endpoint',
          },
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            description: 'API key for server-to-server authentication',
          },
        },
        schemas: {},
        examples: {},
        responses: {
          UnauthorizedError: {
            description: 'Authentication information is missing or invalid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Unauthorized' },
                    message: {
                      type: 'string',
                      example: 'Invalid or expired token',
                    },
                  },
                },
              },
            },
          },
          ValidationError: {
            description: 'Request validation failed',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Validation Error' },
                    details: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          field: { type: 'string' },
                          message: { type: 'string' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          RateLimitError: {
            description: 'Rate limit exceeded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    error: { type: 'string', example: 'Too Many Requests' },
                    message: { type: 'string', example: 'Rate limit exceeded' },
                    retryAfter: { type: 'integer', example: 60 },
                  },
                },
              },
            },
          },
        },
      },
      tags: [
        {
          name: 'Authentication',
          description: 'User authentication and session management',
          externalDocs: {
            description: 'Authentication Guide',
            url: 'https://docs.drishti.com/auth',
          },
        },
        {
          name: 'Financial Accounts',
          description: 'Manage financial accounts and balances',
        },
        {
          name: 'Financial Goals',
          description: 'FIRE goals and progress tracking',
        },
        {
          name: 'Calculations',
          description: 'Financial calculations and projections',
        },
        {
          name: 'Scenarios',
          description: 'Financial scenario planning and analysis',
        },
        {
          name: 'Batch Operations',
          description: 'Bulk data operations for efficiency',
        },
        {
          name: 'Monitoring',
          description: 'System health and monitoring endpoints',
        },
        {
          name: 'WebSocket',
          description: 'Real-time data streaming',
        },
      ],
    };
  }

  /**
   * Setup common schemas
   */
  private setupSchemas(): void {
    const schemas = {
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          name: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'email', 'name'],
      },
      FinancialAccount: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string', maxLength: 100 },
          type: {
            type: 'string',
            enum: ['checking', 'savings', 'investment', 'retirement', 'debt'],
          },
          balance: { type: 'number', format: 'double' },
          interestRate: {
            type: 'number',
            format: 'double',
            minimum: 0,
            maximum: 100,
          },
          taxTreatment: {
            type: 'string',
            enum: ['taxable', 'traditional', 'roth', 'hsa'],
          },
          institution: { type: 'string', maxLength: 100 },
          isActive: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: ['id', 'userId', 'name', 'type', 'balance'],
      },
      FinancialGoal: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          name: { type: 'string', maxLength: 100 },
          type: {
            type: 'string',
            enum: [
              'fire',
              'retirement',
              'emergency_fund',
              'house',
              'education',
            ],
          },
          targetAmount: { type: 'number', format: 'double', minimum: 0 },
          targetDate: { type: 'string', format: 'date' },
          currentAmount: { type: 'number', format: 'double', minimum: 0 },
          monthlyContribution: { type: 'number', format: 'double', minimum: 0 },
          priority: { type: 'integer', minimum: 1, maximum: 10 },
          isActive: { type: 'boolean', default: true },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
        required: [
          'id',
          'userId',
          'name',
          'type',
          'targetAmount',
          'targetDate',
        ],
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
          message: { type: 'string' },
          details: { type: 'object' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['error', 'message'],
      },
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          message: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
        required: ['success'],
      },
    };

    Object.entries(schemas).forEach(([name, schema]) => {
      this.schemas.set(name, schema);
      this.documentation.components.schemas[name] = schema;
    });
  }

  /**
   * Setup common examples
   */
  private setupExamples(): void {
    const examples = {
      UserExample: {
        summary: 'Example user',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          email: 'john.doe@example.com',
          name: 'John Doe',
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
      AccountExample: {
        summary: 'Example financial account',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174001',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'Primary Checking',
          type: 'checking',
          balance: 5000.0,
          interestRate: 0.5,
          taxTreatment: 'taxable',
          institution: 'Chase Bank',
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
      GoalExample: {
        summary: 'Example FIRE goal',
        value: {
          id: '123e4567-e89b-12d3-a456-426614174002',
          userId: '123e4567-e89b-12d3-a456-426614174000',
          name: 'FIRE by 50',
          type: 'fire',
          targetAmount: 1000000.0,
          targetDate: '2035-01-01',
          currentAmount: 150000.0,
          monthlyContribution: 3000.0,
          priority: 1,
          isActive: true,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      },
    };

    Object.entries(examples).forEach(([name, example]) => {
      this.examples.set(name, example);
      this.documentation.components.examples[name] = example;
    });
  }

  /**
   * Add endpoint documentation
   */
  addEndpoint(endpoint: APIEndpoint): void {
    const key = `${endpoint.method.toUpperCase()}:${endpoint.path}`;
    this.endpoints.set(key, endpoint);

    if (!this.documentation.paths[endpoint.path]) {
      this.documentation.paths[endpoint.path] = {};
    }

    this.documentation.paths[endpoint.path][endpoint.method.toLowerCase()] = {
      summary: endpoint.summary,
      description: endpoint.description,
      tags: endpoint.tags,
      parameters: endpoint.parameters,
      requestBody: endpoint.requestBody,
      responses: endpoint.responses,
      security: endpoint.security,
      examples: endpoint.examples,
    };
  }

  /**
   * Generate complete documentation
   */
  generateDocumentation(): APIDocumentation {
    return this.documentation;
  }

  /**
   * Export documentation to file
   */
  exportToFile(outputPath: string): void {
    const docsDir = join(outputPath, 'docs');
    if (!existsSync(docsDir)) {
      mkdirSync(docsDir, { recursive: true });
    }

    // Export OpenAPI JSON
    const jsonPath = join(docsDir, 'openapi.json');
    writeFileSync(jsonPath, JSON.stringify(this.documentation, null, 2));

    // Export OpenAPI YAML
    const yamlPath = join(docsDir, 'openapi.yaml');
    writeFileSync(yamlPath, this.toYAML(this.documentation));

    // Export Markdown documentation
    const mdPath = join(docsDir, 'api-reference.md');
    writeFileSync(mdPath, this.generateMarkdown());

    console.log(`📚 API documentation exported to ${docsDir}`);
  }

  /**
   * Generate SDK templates
   */
  generateSDKTemplates(outputPath: string): void {
    const sdkDir = join(outputPath, 'sdk-templates');
    if (!existsSync(sdkDir)) {
      mkdirSync(sdkDir, { recursive: true });
    }

    // TypeScript SDK template
    const tsTemplate = this.generateTypeScriptSDK();
    writeFileSync(join(sdkDir, 'typescript-sdk.ts'), tsTemplate);

    // Python SDK template
    const pyTemplate = this.generatePythonSDK();
    writeFileSync(join(sdkDir, 'python-sdk.py'), pyTemplate);

    console.log(`🛠️ SDK templates generated in ${sdkDir}`);
  }

  /**
   * Convert to YAML (simplified)
   */
  private toYAML(obj: any, indent: number = 0): string {
    const spaces = '  '.repeat(indent);
    let yaml = '';

    for (const [key, value] of Object.entries(obj)) {
      if (
        typeof value === 'object' &&
        value !== null &&
        !Array.isArray(value)
      ) {
        yaml += `${spaces}${key}:\n${this.toYAML(value, indent + 1)}`;
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          if (typeof item === 'object') {
            yaml += `${spaces}  -\n${this.toYAML(item, indent + 2)}`;
          } else {
            yaml += `${spaces}  - ${item}\n`;
          }
        });
      } else {
        yaml += `${spaces}${key}: ${JSON.stringify(value)}\n`;
      }
    }

    return yaml;
  }

  /**
   * Generate Markdown documentation
   */
  private generateMarkdown(): string {
    let md = `# ${this.documentation.info.title}\n\n`;
    md += `${this.documentation.info.description}\n\n`;
    md += `**Version:** ${this.documentation.info.version}\n\n`;

    // Add endpoints by tag
    this.documentation.tags.forEach(tag => {
      md += `## ${tag.name}\n\n`;
      md += `${tag.description}\n\n`;

      // Find endpoints for this tag
      Object.entries(this.documentation.paths).forEach(([path, methods]) => {
        Object.entries(methods as any).forEach(
          ([method, spec]: [string, any]) => {
            if (spec.tags && spec.tags.includes(tag.name)) {
              md += `### ${method.toUpperCase()} ${path}\n\n`;
              md += `${spec.description}\n\n`;

              if (spec.parameters) {
                md += `**Parameters:**\n\n`;
                spec.parameters.forEach((param: any) => {
                  md += `- \`${param.name}\` (${param.in}): ${param.description}\n`;
                });
                md += '\n';
              }
            }
          }
        );
      });
    });

    return md;
  }

  /**
   * Generate TypeScript SDK template
   */
  private generateTypeScriptSDK(): string {
    return `
// Drishti API TypeScript SDK
// Generated from OpenAPI specification

export interface DrishtiAPIConfig {
  baseURL: string;
  apiKey?: string;
  timeout?: number;
}

export class DrishtiAPI {
  private config: DrishtiAPIConfig;
  private token?: string;

  constructor(config: DrishtiAPIConfig) {
    this.config = config;
  }

  async authenticate(email: string, password: string): Promise<void> {
    const response = await fetch(\`\${this.config.baseURL}/auth/login\`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    
    const data = await response.json();
    this.token = data.tokens.accessToken;
  }

  async getAccounts(): Promise<any[]> {
    return this.request('GET', '/financial/accounts');
  }

  async createAccount(account: any): Promise<any> {
    return this.request('POST', '/financial/accounts', account);
  }

  private async request(method: string, path: string, body?: any): Promise<any> {
    const response = await fetch(\`\${this.config.baseURL}\${path}\`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': \`Bearer \${this.token}\`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }
}
    `.trim();
  }

  /**
   * Generate Python SDK template
   */
  private generatePythonSDK(): string {
    return `
# Drishti API Python SDK
# Generated from OpenAPI specification

import requests
from typing import Dict, List, Optional

class DrishtiAPI:
    def __init__(self, base_url: str, api_key: Optional[str] = None):
        self.base_url = base_url
        self.api_key = api_key
        self.token = None
        self.session = requests.Session()

    def authenticate(self, email: str, password: str) -> None:
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={"email": email, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["tokens"]["accessToken"]
        self.session.headers.update({"Authorization": f"Bearer {self.token}"})

    def get_accounts(self) -> List[Dict]:
        response = self.session.get(f"{self.base_url}/financial/accounts")
        response.raise_for_status()
        return response.json()

    def create_account(self, account: Dict) -> Dict:
        response = self.session.post(
            f"{self.base_url}/financial/accounts",
            json=account
        )
        response.raise_for_status()
        return response.json()
    `.trim();
  }

  /**
   * Get documentation statistics
   */
  getStats() {
    return {
      endpoints: this.endpoints.size,
      schemas: this.schemas.size,
      examples: this.examples.size,
      tags: this.documentation.tags.length,
      version: this.documentation.info.version,
    };
  }
}

export const apiDocumentationService = new APIDocumentationService();
