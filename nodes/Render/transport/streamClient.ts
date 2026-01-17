/**
 * Stream Client for Render Network
 * WebSocket client for real-time job updates and event streaming
 */

import WebSocket from 'ws';
import { WEBSOCKET_ENDPOINTS } from '../constants/networks';

export type StreamEventType = 
	| 'job:submitted'
	| 'job:started'
	| 'job:progress'
	| 'job:completed'
	| 'job:failed'
	| 'job:cancelled'
	| 'frame:completed'
	| 'frame:failed'
	| 'node:online'
	| 'node:offline'
	| 'node:job_assigned'
	| 'node:job_completed'
	| 'node:earnings'
	| 'wallet:received'
	| 'wallet:sent'
	| 'escrow:deposit'
	| 'escrow:withdraw'
	| 'staking:added'
	| 'staking:removed'
	| 'staking:rewards'
	| 'network:stats'
	| 'ai:started'
	| 'ai:completed'
	| 'ai:results';

export interface StreamEvent {
	type: StreamEventType;
	timestamp: string;
	data: unknown;
}

export interface JobEvent extends StreamEvent {
	data: {
		jobId: string;
		status?: string;
		progress?: number;
		frame?: number;
		error?: string;
		output?: string;
	};
}

export interface NodeEvent extends StreamEvent {
	data: {
		nodeId: string;
		status?: string;
		jobId?: string;
		earnings?: number;
	};
}

export interface WalletEvent extends StreamEvent {
	data: {
		address: string;
		amount: number;
		token: string;
		from?: string;
		to?: string;
		signature: string;
	};
}

export interface NetworkEvent extends StreamEvent {
	data: {
		totalNodes: number;
		activeJobs: number;
		networkCapacity: number;
	};
}

export type EventHandler = (event: StreamEvent) => void;

export interface StreamClientConfig {
	apiKey: string;
	endpoint?: string;
	reconnect?: boolean;
	reconnectInterval?: number;
	maxReconnectAttempts?: number;
}

export class StreamClient {
	private ws: WebSocket | null = null;
	private config: StreamClientConfig;
	private handlers: Map<StreamEventType, Set<EventHandler>> = new Map();
	private globalHandlers: Set<EventHandler> = new Set();
	private reconnectAttempts = 0;
	private isConnected = false;
	private shouldReconnect = true;
	private subscriptions: Set<string> = new Set();

	constructor(config: StreamClientConfig) {
		this.config = {
			reconnect: true,
			reconnectInterval: 5000,
			maxReconnectAttempts: 10,
			...config,
		};
	}

	/**
	 * Connect to the WebSocket stream
	 */
	async connect(streamType: 'jobs' | 'nodes' | 'network' = 'jobs'): Promise<void> {
		const endpoint = this.config.endpoint || WEBSOCKET_ENDPOINTS[streamType];
		
		return new Promise((resolve, reject) => {
			try {
				this.ws = new WebSocket(endpoint, {
					headers: {
						'Authorization': `Bearer ${this.config.apiKey}`,
					},
				});

				this.ws.on('open', () => {
					this.isConnected = true;
					this.reconnectAttempts = 0;
					
					// Resubscribe to previous subscriptions
					for (const sub of this.subscriptions) {
						this.send({ type: 'subscribe', channel: sub });
					}
					
					resolve();
				});

				this.ws.on('message', (data: WebSocket.RawData) => {
					try {
						const event = JSON.parse(data.toString()) as StreamEvent;
						this.handleEvent(event);
					} catch (error) {
						console.error('Failed to parse WebSocket message:', error);
					}
				});

				this.ws.on('close', () => {
					this.isConnected = false;
					this.handleDisconnect();
				});

				this.ws.on('error', (error) => {
					console.error('WebSocket error:', error);
					if (!this.isConnected) {
						reject(error);
					}
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	/**
	 * Disconnect from the WebSocket stream
	 */
	disconnect(): void {
		this.shouldReconnect = false;
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
		this.isConnected = false;
	}

	/**
	 * Subscribe to specific events
	 */
	subscribe(eventType: StreamEventType, handler: EventHandler): void {
		if (!this.handlers.has(eventType)) {
			this.handlers.set(eventType, new Set());
		}
		this.handlers.get(eventType)!.add(handler);
	}

	/**
	 * Subscribe to all events
	 */
	subscribeAll(handler: EventHandler): void {
		this.globalHandlers.add(handler);
	}

	/**
	 * Unsubscribe from specific events
	 */
	unsubscribe(eventType: StreamEventType, handler: EventHandler): void {
		const handlers = this.handlers.get(eventType);
		if (handlers) {
			handlers.delete(handler);
		}
	}

	/**
	 * Unsubscribe from all events
	 */
	unsubscribeAll(handler: EventHandler): void {
		this.globalHandlers.delete(handler);
	}

	/**
	 * Subscribe to a specific job's updates
	 */
	subscribeToJob(jobId: string): void {
		const channel = `job:${jobId}`;
		this.subscriptions.add(channel);
		if (this.isConnected) {
			this.send({ type: 'subscribe', channel });
		}
	}

	/**
	 * Unsubscribe from a specific job
	 */
	unsubscribeFromJob(jobId: string): void {
		const channel = `job:${jobId}`;
		this.subscriptions.delete(channel);
		if (this.isConnected) {
			this.send({ type: 'unsubscribe', channel });
		}
	}

	/**
	 * Subscribe to node updates
	 */
	subscribeToNode(nodeId: string): void {
		const channel = `node:${nodeId}`;
		this.subscriptions.add(channel);
		if (this.isConnected) {
			this.send({ type: 'subscribe', channel });
		}
	}

	/**
	 * Subscribe to wallet updates
	 */
	subscribeToWallet(address: string): void {
		const channel = `wallet:${address}`;
		this.subscriptions.add(channel);
		if (this.isConnected) {
			this.send({ type: 'subscribe', channel });
		}
	}

	/**
	 * Subscribe to network stats
	 */
	subscribeToNetworkStats(): void {
		const channel = 'network:stats';
		this.subscriptions.add(channel);
		if (this.isConnected) {
			this.send({ type: 'subscribe', channel });
		}
	}

	/**
	 * Check if connected
	 */
	isActive(): boolean {
		return this.isConnected;
	}

	/**
	 * Handle incoming event
	 */
	private handleEvent(event: StreamEvent): void {
		// Call type-specific handlers
		const handlers = this.handlers.get(event.type);
		if (handlers) {
			for (const handler of handlers) {
				try {
					handler(event);
				} catch (error) {
					console.error('Event handler error:', error);
				}
			}
		}

		// Call global handlers
		for (const handler of this.globalHandlers) {
			try {
				handler(event);
			} catch (error) {
				console.error('Global event handler error:', error);
			}
		}
	}

	/**
	 * Handle disconnection
	 */
	private handleDisconnect(): void {
		if (!this.shouldReconnect || !this.config.reconnect) {
			return;
		}

		if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 10)) {
			this.reconnectAttempts++;
			setTimeout(() => {
				console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
				this.connect().catch(error => {
					console.error('Reconnection failed:', error);
				});
			}, this.config.reconnectInterval);
		} else {
			console.error('Max reconnection attempts reached');
		}
	}

	/**
	 * Send a message through the WebSocket
	 */
	private send(data: unknown): void {
		if (this.ws && this.isConnected) {
			this.ws.send(JSON.stringify(data));
		}
	}
}

/**
 * Create a one-time event listener that resolves when the event occurs
 */
export function waitForEvent(
	client: StreamClient,
	eventType: StreamEventType,
	filter?: (event: StreamEvent) => boolean,
	timeout?: number
): Promise<StreamEvent> {
	return new Promise((resolve, reject) => {
		const timeoutId = timeout 
			? setTimeout(() => {
				client.unsubscribe(eventType, handler);
				reject(new Error(`Timeout waiting for event: ${eventType}`));
			}, timeout)
			: null;

		const handler: EventHandler = (event) => {
			if (!filter || filter(event)) {
				if (timeoutId) clearTimeout(timeoutId);
				client.unsubscribe(eventType, handler);
				resolve(event);
			}
		};

		client.subscribe(eventType, handler);
	});
}

export default StreamClient;
