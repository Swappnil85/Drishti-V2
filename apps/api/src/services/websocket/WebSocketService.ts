/**
 * WebSocket Service for Real-time Data Updates
 * Handles live data streaming for financial calculations and updates
 */

import { FastifyInstance } from 'fastify';
import { jwtService } from '../../auth/jwt';

// WebSocket connection interface
interface WebSocketConnection {
  socket: any;
  send: (data: string) => void;
  close: (code?: number, reason?: string) => void;
  readyState: number;
}

interface WebSocketClient {
  id: string;
  userId: string;
  socket: WebSocketConnection;
  subscriptions: Set<string>;
  lastActivity: number;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

interface SubscriptionData {
  type:
    | 'calculation_update'
    | 'account_update'
    | 'goal_progress'
    | 'market_data';
  data: any;
}

class WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map(); // topic -> client IDs
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startHeartbeat();
  }

  private startHeartbeat() {
    // Send heartbeat every 30 seconds and clean up inactive connections
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const inactiveClients: string[] = [];

      for (const [clientId, client] of this.clients.entries()) {
        // Remove clients inactive for more than 5 minutes
        if (now - client.lastActivity > 5 * 60 * 1000) {
          inactiveClients.push(clientId);
        } else {
          // Send heartbeat
          this.sendToClient(clientId, {
            type: 'heartbeat',
            payload: { timestamp: now },
            timestamp: now,
          });
        }
      }

      // Clean up inactive clients
      inactiveClients.forEach(clientId => this.removeClient(clientId));

      if (inactiveClients.length > 0) {
        console.log(
          `🧹 Cleaned up ${inactiveClients.length} inactive WebSocket clients`
        );
      }
    }, 30000);
  }

  registerRoutes(fastify: FastifyInstance) {
    const self = this;
    fastify.register(async function (fastify) {
      fastify.get('/ws', { websocket: true }, (connection, request) => {
        self.handleConnection(connection, request);
      });
    });
  }

  private async handleConnection(
    connection: WebSocketConnection,
    request: any
  ) {
    const clientId = this.generateClientId();
    let client: WebSocketClient | null = null;

    try {
      // Authenticate the connection
      const token =
        request.query?.token ||
        request.headers?.authorization?.replace('Bearer ', '');
      if (!token) {
        connection.socket.close(1008, 'Authentication required');
        return;
      }

      const payload = jwtService.verifyAccessToken(token);
      if (!payload) {
        connection.socket.close(1008, 'Invalid token');
        return;
      }

      // Create client
      client = {
        id: clientId,
        userId: payload.userId,
        socket: connection,
        subscriptions: new Set(),
        lastActivity: Date.now(),
      };

      this.clients.set(clientId, client);

      console.log(
        `🔌 WebSocket client connected: ${clientId} (User: ${payload.userId})`
      );

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connected',
        payload: { clientId, userId: payload.userId },
        timestamp: Date.now(),
      });

      // Handle incoming messages
      connection.socket.on('message', (message: Buffer) => {
        this.handleMessage(clientId, message);
      });

      // Handle connection close
      connection.socket.on('close', () => {
        this.removeClient(clientId);
      });

      // Handle errors
      connection.socket.on('error', (error: Error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
        this.removeClient(clientId);
      });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      connection.socket.close(1011, 'Internal server error');
    }
  }

  private handleMessage(clientId: string, message: Buffer) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastActivity = Date.now();

    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'subscribe':
          this.handleSubscribe(clientId, data.payload);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(clientId, data.payload);
          break;
        case 'ping':
          this.sendToClient(clientId, {
            type: 'pong',
            payload: { timestamp: Date.now() },
            timestamp: Date.now(),
          });
          break;
        default:
          console.warn(
            `Unknown message type from client ${clientId}:`,
            data.type
          );
      }
    } catch (error) {
      console.error(`Error handling message from client ${clientId}:`, error);
    }
  }

  private handleSubscribe(clientId: string, payload: { topics: string[] }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    payload.topics.forEach(topic => {
      client.subscriptions.add(topic);

      if (!this.subscriptions.has(topic)) {
        this.subscriptions.set(topic, new Set());
      }
      this.subscriptions.get(topic)!.add(clientId);
    });

    this.sendToClient(clientId, {
      type: 'subscribed',
      payload: { topics: payload.topics },
      timestamp: Date.now(),
    });

    console.log(`📡 Client ${clientId} subscribed to topics:`, payload.topics);
  }

  private handleUnsubscribe(clientId: string, payload: { topics: string[] }) {
    const client = this.clients.get(clientId);
    if (!client) return;

    payload.topics.forEach(topic => {
      client.subscriptions.delete(topic);

      const topicSubscribers = this.subscriptions.get(topic);
      if (topicSubscribers) {
        topicSubscribers.delete(clientId);
        if (topicSubscribers.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    });

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      payload: { topics: payload.topics },
      timestamp: Date.now(),
    });
  }

  private removeClient(clientId: string) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    client.subscriptions.forEach(topic => {
      const topicSubscribers = this.subscriptions.get(topic);
      if (topicSubscribers) {
        topicSubscribers.delete(clientId);
        if (topicSubscribers.size === 0) {
          this.subscriptions.delete(topic);
        }
      }
    });

    this.clients.delete(clientId);
    console.log(`🔌 WebSocket client disconnected: ${clientId}`);
  }

  private sendToClient(clientId: string, message: WebSocketMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      if (client.socket.readyState === 1) {
        // WebSocket.OPEN
        client.socket.send(JSON.stringify(message));
      } else {
        this.removeClient(clientId);
      }
    } catch (error) {
      console.error(`Error sending message to client ${clientId}:`, error);
      this.removeClient(clientId);
    }
  }

  // Public methods for broadcasting updates
  broadcast(topic: string, data: SubscriptionData) {
    const subscribers = this.subscriptions.get(topic);
    if (!subscribers || subscribers.size === 0) return;

    const message: WebSocketMessage = {
      type: 'update',
      payload: { topic, ...data },
      timestamp: Date.now(),
    };

    subscribers.forEach(clientId => {
      this.sendToClient(clientId, message);
    });

    console.log(
      `📡 Broadcasted to ${subscribers.size} clients on topic: ${topic}`
    );
  }

  broadcastToUser(userId: string, data: SubscriptionData) {
    const userClients = Array.from(this.clients.values()).filter(
      client => client.userId === userId
    );

    const message: WebSocketMessage = {
      type: 'user_update',
      payload: data,
      timestamp: Date.now(),
    };

    userClients.forEach(client => {
      this.sendToClient(client.id, message);
    });
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getStats() {
    return {
      connectedClients: this.clients.size,
      activeSubscriptions: this.subscriptions.size,
      subscriptionDetails: Array.from(this.subscriptions.entries()).map(
        ([topic, clients]) => ({
          topic,
          subscribers: clients.size,
        })
      ),
    };
  }

  shutdown() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    // Close all connections
    this.clients.forEach(client => {
      client.socket.close(1001, 'Server shutting down');
    });

    this.clients.clear();
    this.subscriptions.clear();
  }
}

export const websocketService = new WebSocketService();
