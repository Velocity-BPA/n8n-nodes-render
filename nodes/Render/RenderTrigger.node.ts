/**
 * Render Network Trigger Node
 * Real-time event monitoring via WebSocket
 */

import type {
	ITriggerFunctions,
	INodeType,
	INodeTypeDescription,
	ITriggerResponse,
} from 'n8n-workflow';

import { StreamClient, StreamEventType, StreamEvent } from './transport/streamClient';

export class RenderTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Render Network Trigger',
		name: 'renderTrigger',
		icon: 'file:render.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["event"]}}',
		description: 'Trigger on Render Network events',
		defaults: {
			name: 'Render Trigger',
		},
		inputs: [],
		outputs: ['main'],
		credentials: [
			{
				name: 'renderApi',
				required: true,
			},
		],
		properties: [
			// Event Category
			{
				displayName: 'Event Category',
				name: 'eventCategory',
				type: 'options',
				options: [
					{
						name: 'Job Events',
						value: 'job',
						description: 'Events related to render jobs',
					},
					{
						name: 'Node Events',
						value: 'node',
						description: 'Events related to render nodes',
					},
					{
						name: 'Wallet Events',
						value: 'wallet',
						description: 'Events related to wallet transactions',
					},
					{
						name: 'Staking Events',
						value: 'staking',
						description: 'Events related to staking',
					},
					{
						name: 'Network Events',
						value: 'network',
						description: 'Network-wide events',
					},
					{
						name: 'AI Events',
						value: 'ai',
						description: 'AI compute events',
					},
				],
				default: 'job',
				description: 'Category of events to listen for',
			},
			// Job Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['job'],
					},
				},
				options: [
					{
						name: 'Job Submitted',
						value: 'job_submitted',
						description: 'When a new job is submitted',
					},
					{
						name: 'Job Started',
						value: 'job_started',
						description: 'When a job starts processing',
					},
					{
						name: 'Job Progress Update',
						value: 'job_progress',
						description: 'When job progress is updated',
					},
					{
						name: 'Job Completed',
						value: 'job_completed',
						description: 'When a job completes successfully',
					},
					{
						name: 'Job Failed',
						value: 'job_failed',
						description: 'When a job fails',
					},
					{
						name: 'Job Cancelled',
						value: 'job_cancelled',
						description: 'When a job is cancelled',
					},
					{
						name: 'Frame Completed',
						value: 'frame_completed',
						description: 'When an individual frame completes',
					},
					{
						name: 'Results Available',
						value: 'results_available',
						description: 'When job results are ready for download',
					},
				],
				default: 'job_completed',
				description: 'Specific event to trigger on',
			},
			// Node Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['node'],
					},
				},
				options: [
					{
						name: 'Node Online',
						value: 'node_online',
						description: 'When a node comes online',
					},
					{
						name: 'Node Offline',
						value: 'node_offline',
						description: 'When a node goes offline',
					},
					{
						name: 'Node Job Assigned',
						value: 'node_job_assigned',
						description: 'When a job is assigned to a node',
					},
					{
						name: 'Node Job Completed',
						value: 'node_job_completed',
						description: 'When a node completes a job',
					},
					{
						name: 'Node Earnings Received',
						value: 'node_earnings',
						description: 'When a node receives earnings',
					},
					{
						name: 'Node Performance Alert',
						value: 'node_performance_alert',
						description: 'When node performance drops',
					},
				],
				default: 'node_online',
				description: 'Specific event to trigger on',
			},
			// Wallet Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['wallet'],
					},
				},
				options: [
					{
						name: 'RENDER Received',
						value: 'wallet_received',
						description: 'When RENDER is received',
					},
					{
						name: 'RENDER Sent',
						value: 'wallet_sent',
						description: 'When RENDER is sent',
					},
					{
						name: 'Escrow Deposited',
						value: 'escrow_deposit',
						description: 'When funds are deposited to escrow',
					},
					{
						name: 'Escrow Withdrawn',
						value: 'escrow_withdraw',
						description: 'When funds are withdrawn from escrow',
					},
					{
						name: 'Earnings Claimed',
						value: 'earnings_claimed',
						description: 'When earnings are claimed',
					},
				],
				default: 'wallet_received',
				description: 'Specific event to trigger on',
			},
			// Staking Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['staking'],
					},
				},
				options: [
					{
						name: 'Stake Added',
						value: 'stake_added',
						description: 'When tokens are staked',
					},
					{
						name: 'Stake Removed',
						value: 'stake_removed',
						description: 'When tokens are unstaked',
					},
					{
						name: 'Rewards Available',
						value: 'rewards_available',
						description: 'When staking rewards are available',
					},
					{
						name: 'Rewards Claimed',
						value: 'rewards_claimed',
						description: 'When staking rewards are claimed',
					},
				],
				default: 'rewards_available',
				description: 'Specific event to trigger on',
			},
			// Network Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['network'],
					},
				},
				options: [
					{
						name: 'Price Changed',
						value: 'price_changed',
						description: 'When pricing changes',
					},
					{
						name: 'Capacity Changed',
						value: 'capacity_changed',
						description: 'When network capacity changes significantly',
					},
					{
						name: 'New Node Joined',
						value: 'new_node',
						description: 'When a new node joins the network',
					},
					{
						name: 'Network Stats Updated',
						value: 'network_stats',
						description: 'Periodic network statistics update',
					},
				],
				default: 'network_stats',
				description: 'Specific event to trigger on',
			},
			// AI Events
			{
				displayName: 'Event',
				name: 'event',
				type: 'options',
				displayOptions: {
					show: {
						eventCategory: ['ai'],
					},
				},
				options: [
					{
						name: 'AI Job Started',
						value: 'ai_started',
						description: 'When an AI job starts',
					},
					{
						name: 'AI Job Completed',
						value: 'ai_completed',
						description: 'When an AI job completes',
					},
					{
						name: 'Inference Results Ready',
						value: 'inference_results',
						description: 'When inference results are available',
					},
					{
						name: 'Model Updated',
						value: 'model_updated',
						description: 'When a model is updated',
					},
				],
				default: 'ai_completed',
				description: 'Specific event to trigger on',
			},
			// Filter by Job ID
			{
				displayName: 'Job ID Filter',
				name: 'jobIdFilter',
				type: 'string',
				default: '',
				placeholder: 'Leave empty for all jobs',
				description: 'Only trigger for specific job ID',
				displayOptions: {
					show: {
						eventCategory: ['job'],
					},
				},
			},
			// Filter by Node ID
			{
				displayName: 'Node ID Filter',
				name: 'nodeIdFilter',
				type: 'string',
				default: '',
				placeholder: 'Leave empty for all nodes',
				description: 'Only trigger for specific node ID',
				displayOptions: {
					show: {
						eventCategory: ['node'],
					},
				},
			},
			// Filter by Wallet Address
			{
				displayName: 'Wallet Address Filter',
				name: 'walletFilter',
				type: 'string',
				default: '',
				placeholder: 'Leave empty for your wallet',
				description: 'Only trigger for specific wallet address',
				displayOptions: {
					show: {
						eventCategory: ['wallet', 'staking'],
					},
				},
			},
			// Minimum Amount Filter
			{
				displayName: 'Minimum Amount',
				name: 'minAmount',
				type: 'number',
				default: 0,
				description: 'Minimum RENDER amount to trigger (0 for any)',
				displayOptions: {
					show: {
						eventCategory: ['wallet', 'staking'],
					},
				},
			},
		],
	};

	async trigger(this: ITriggerFunctions): Promise<ITriggerResponse> {
		const credentials = await this.getCredentials('renderApi');
		const eventCategory = this.getNodeParameter('eventCategory') as string;
		const event = this.getNodeParameter('event') as string;

		// Create stream client with config object
		const streamClient = new StreamClient({
			apiKey: credentials.apiKey as string,
			endpoint: credentials.apiEndpoint as string,
			reconnect: true,
			reconnectInterval: 5000,
			maxReconnectAttempts: 10,
		});

		// Get filters
		const jobIdFilter = eventCategory === 'job'
			? this.getNodeParameter('jobIdFilter', '') as string
			: '';
		const nodeIdFilter = eventCategory === 'node'
			? this.getNodeParameter('nodeIdFilter', '') as string
			: '';
		const walletFilter = ['wallet', 'staking'].includes(eventCategory)
			? this.getNodeParameter('walletFilter', '') as string
			: '';
		const minAmount = ['wallet', 'staking'].includes(eventCategory)
			? this.getNodeParameter('minAmount', 0) as number
			: 0;

		// Map event names to StreamEventType (using colon format)
		const eventTypeMap: Record<string, StreamEventType> = {
			// Job events
			'job_submitted': 'job:submitted',
			'job_started': 'job:started',
			'job_progress': 'job:progress',
			'job_completed': 'job:completed',
			'job_failed': 'job:failed',
			'job_cancelled': 'job:cancelled',
			'frame_completed': 'frame:completed',
			'results_available': 'job:completed',
			// Node events
			'node_online': 'node:online',
			'node_offline': 'node:offline',
			'node_job_assigned': 'node:job_assigned',
			'node_job_completed': 'node:job_completed',
			'node_earnings': 'node:earnings',
			'node_performance_alert': 'node:offline',
			// Wallet events
			'wallet_received': 'wallet:received',
			'wallet_sent': 'wallet:sent',
			'escrow_deposit': 'escrow:deposit',
			'escrow_withdraw': 'escrow:withdraw',
			'earnings_claimed': 'wallet:received',
			// Staking events
			'stake_added': 'staking:added',
			'stake_removed': 'staking:removed',
			'rewards_available': 'staking:rewards',
			'rewards_claimed': 'staking:rewards',
			// Network events
			'price_changed': 'network:stats',
			'capacity_changed': 'network:stats',
			'new_node': 'node:online',
			'network_stats': 'network:stats',
			// AI events
			'ai_started': 'ai:started',
			'ai_completed': 'ai:completed',
			'inference_results': 'ai:results',
			'model_updated': 'ai:completed',
		};

		const streamEventType = eventTypeMap[event] || 'job:completed';

		// Determine stream type based on category
		const streamTypeMap: Record<string, 'jobs' | 'nodes' | 'network'> = {
			'job': 'jobs',
			'node': 'nodes',
			'wallet': 'jobs',
			'staking': 'jobs',
			'network': 'network',
			'ai': 'jobs',
		};
		const streamType = streamTypeMap[eventCategory] || 'jobs';

		// Event handler with proper typing
		const handleEvent = (streamEvent: StreamEvent) => {
			// Type assertion for event data
			const eventData = streamEvent.data as Record<string, unknown> | undefined;
			
			// Apply filters
			if (jobIdFilter && eventData?.jobId !== jobIdFilter) {
				return;
			}
			if (nodeIdFilter && eventData?.nodeId !== nodeIdFilter) {
				return;
			}
			if (walletFilter && eventData?.wallet !== walletFilter) {
				return;
			}
			if (minAmount > 0 && ((eventData?.amount as number) || 0) < minAmount) {
				return;
			}

			// Emit event
			this.emit([
				this.helpers.returnJsonArray([
					{
						event: streamEvent.type,
						timestamp: streamEvent.timestamp,
						data: eventData || {},
					},
				]),
			]);
		};

		// Connect and subscribe
		await streamClient.connect(streamType);
		streamClient.subscribe(streamEventType, handleEvent);

		// Subscribe to specific channels if filters are set
		if (jobIdFilter) {
			streamClient.subscribeToJob(jobIdFilter);
		}
		if (nodeIdFilter) {
			streamClient.subscribeToNode(nodeIdFilter);
		}
		if (walletFilter) {
			streamClient.subscribeToWallet(walletFilter);
		}

		// Cleanup function
		const closeFunction = async () => {
			streamClient.unsubscribe(streamEventType, handleEvent);
			streamClient.disconnect();
		};

		return {
			closeFunction,
		};
	}
}
