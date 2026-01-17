/**
 * Node Resource Actions
 * Operations for Render Network node management
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const nodeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['node'] } },
		options: [
			{ name: 'Get Node Info', value: 'getNodeInfo', description: 'Get node information', action: 'Get node info' },
			{ name: 'Get Node Status', value: 'getNodeStatus', description: 'Get node status', action: 'Get node status' },
			{ name: 'Get Node Capacity', value: 'getNodeCapacity', description: 'Get node capacity', action: 'Get node capacity' },
			{ name: 'Get Node Jobs', value: 'getNodeJobs', description: 'Get jobs on node', action: 'Get node jobs' },
			{ name: 'Get Node Earnings', value: 'getNodeEarnings', description: 'Get node earnings', action: 'Get node earnings' },
			{ name: 'List Active Nodes', value: 'listActiveNodes', description: 'List active nodes', action: 'List active nodes' },
			{ name: 'Get Node Tiers', value: 'getNodeTiers', description: 'Get node tier info', action: 'Get node tiers' },
			{ name: 'Register Node', value: 'registerNode', description: 'Register new node', action: 'Register node' },
			{ name: 'Update Node Config', value: 'updateNodeConfig', description: 'Update node config', action: 'Update node config' },
			{ name: 'Deactivate Node', value: 'deactivateNode', description: 'Deactivate node', action: 'Deactivate node' },
		],
		default: 'getNodeInfo',
	},
];

export const nodeFields: INodeProperties[] = [
	{
		displayName: 'Node ID',
		name: 'nodeId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['node'], operation: ['getNodeInfo', 'getNodeStatus', 'getNodeCapacity', 'getNodeJobs', 'getNodeEarnings', 'updateNodeConfig', 'deactivateNode'] } },
		default: '',
		description: 'Node identifier',
	},
	{
		displayName: 'Node Name',
		name: 'nodeName',
		type: 'string',
		displayOptions: { show: { resource: ['node'], operation: ['registerNode'] } },
		default: '',
		description: 'Node display name',
	},
	{
		displayName: 'Node Endpoint',
		name: 'nodeEndpoint',
		type: 'string',
		displayOptions: { show: { resource: ['node'], operation: ['registerNode'] } },
		default: '',
		description: 'Node network endpoint',
	},
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['node'], operation: ['registerNode', 'listActiveNodes'] } },
		options: [
			{ name: 'Any', value: 'any' },
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'A100', value: 'a100' },
		],
		default: 'any',
		description: 'GPU type',
	},
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		displayOptions: { show: { resource: ['node'], operation: ['registerNode'] } },
		default: '',
		description: 'Wallet address for earnings',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['node'], operation: ['listActiveNodes', 'getNodeJobs'] } },
		default: 50,
		description: 'Maximum results',
	},
];

export async function executeNodeOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
		apiEndpoint: credentials.apiEndpoint as string,
	});

	switch (operation) {
		case 'getNodeInfo': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.getNodeInfo(nodeId);
			return { success: result.success, node: result.data, error: result.error };
		}

		case 'getNodeStatus': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.getNodeInfo(nodeId);
			const data = result.data;
			return {
				success: result.success,
				nodeId,
				status: data?.status || 'unknown',
				error: result.error,
			};
		}

		case 'getNodeCapacity': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.getNodeInfo(nodeId);
			const data = result.data;
			return {
				success: result.success,
				nodeId,
				capacity: data?.capacity,
				error: result.error,
			};
		}

		case 'getNodeJobs': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.listJobs({ limit });
			const jobs = result.data?.jobs || [];
			const nodeJobs = jobs.filter(j => j.nodeId === nodeId);
			return {
				success: result.success,
				nodeId,
				jobs: nodeJobs,
				total: nodeJobs.length,
				error: result.error,
			};
		}

		case 'getNodeEarnings': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.getNodeInfo(nodeId);
			const data = result.data;
			return {
				success: result.success,
				nodeId,
				earnings: data?.earnings,
				error: result.error,
			};
		}

		case 'listActiveNodes': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.listNodes({
				gpuType: gpuType !== 'any' ? gpuType : undefined,
				status: 'active',
				limit,
			});
			return { success: result.success, nodes: result.data?.nodes || [], total: result.data?.total || 0, error: result.error };
		}

		case 'getNodeTiers': {
			return {
				success: true,
				tiers: [
					{ tier: 1, name: 'Consumer', minVram: 8, maxVram: 16, requirements: 'RTX 3080 or equivalent' },
					{ tier: 2, name: 'Professional', minVram: 16, maxVram: 48, requirements: 'RTX 4090 or A6000' },
					{ tier: 3, name: 'Enterprise', minVram: 48, maxVram: 80, requirements: 'A100 or H100' },
				],
			};
		}

		case 'registerNode': {
			const nodeName = this.getNodeParameter('nodeName', i) as string;
			const nodeEndpoint = this.getNodeParameter('nodeEndpoint', i) as string;
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.registerNode({
				name: nodeName,
				endpoint: nodeEndpoint,
				gpuType,
				walletAddress,
			});
			return { success: result.success, node: result.data, error: result.error };
		}

		case 'updateNodeConfig': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.updateNodeConfig(nodeId, {});
			return { success: result.success, updated: result.data, error: result.error };
		}

		case 'deactivateNode': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.deactivateNode(nodeId);
			return { success: result.success, deactivated: result.data, error: result.error };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
