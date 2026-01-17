/**
 * Node Operator Resource Actions
 * Operations for Render Network node operators
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const nodeOperatorOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['nodeOperator'] } },
		options: [
			{ name: 'Get Operator Info', value: 'getOperatorInfo', description: 'Get node operator information', action: 'Get operator info' },
			{ name: 'Get Operator Nodes', value: 'getOperatorNodes', description: 'Get nodes operated by operator', action: 'Get operator nodes' },
			{ name: 'Get Operator Earnings', value: 'getOperatorEarnings', description: 'Get operator earnings', action: 'Get operator earnings' },
			{ name: 'Get Operator Stats', value: 'getOperatorStats', description: 'Get operator statistics', action: 'Get operator stats' },
			{ name: 'Get Payout History', value: 'getPayoutHistory', description: 'Get payout history', action: 'Get payout history' },
			{ name: 'Configure Payout Address', value: 'configurePayoutAddress', description: 'Set payout address', action: 'Configure payout address' },
			{ name: 'Get Operator Tier', value: 'getOperatorTier', description: 'Get operator tier level', action: 'Get operator tier' },
			{ name: 'Get Performance Metrics', value: 'getPerformanceMetrics', description: 'Get performance metrics', action: 'Get performance metrics' },
			{ name: 'Get Job History', value: 'getJobHistory', description: 'Get operator job history', action: 'Get job history' },
			{ name: 'Update Operator Profile', value: 'updateOperatorProfile', description: 'Update operator profile', action: 'Update operator profile' },
		],
		default: 'getOperatorInfo',
	},
];

export const nodeOperatorFields: INodeProperties[] = [
	{
		displayName: 'Operator ID',
		name: 'operatorId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['getOperatorInfo', 'getOperatorNodes', 'getOperatorEarnings', 'getOperatorStats', 'getPayoutHistory', 'getOperatorTier', 'getPerformanceMetrics', 'getJobHistory'] } },
		default: '',
		description: 'Node operator ID',
	},
	{
		displayName: 'Payout Address',
		name: 'payoutAddress',
		type: 'string',
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['configurePayoutAddress'] } },
		default: '',
		description: 'Solana wallet address for payouts',
	},
	{
		displayName: 'Profile Name',
		name: 'profileName',
		type: 'string',
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['updateOperatorProfile'] } },
		default: '',
		description: 'Operator profile name',
	},
	{
		displayName: 'Profile Description',
		name: 'profileDescription',
		type: 'string',
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['updateOperatorProfile'] } },
		default: '',
		description: 'Operator profile description',
	},
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['getOperatorEarnings', 'getPayoutHistory', 'getJobHistory'] } },
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Week', value: 'week' },
			{ name: 'Month', value: 'month' },
			{ name: 'Year', value: 'year' },
			{ name: 'All Time', value: 'all' },
		],
		default: 'month',
		description: 'Time period for data',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['nodeOperator'], operation: ['getPayoutHistory', 'getJobHistory'] } },
		default: 50,
		description: 'Maximum number of results to return',
	},
];

export async function executeNodeOperatorOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});

	switch (operation) {
		case 'getOperatorInfo': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const result = await apiClient.getOperatorInfo(operatorId);
			const data = result.data;
			return {
				success: result.success,
				operatorId: data?.id || operatorId,
				name: data?.name || '',
				tier: data?.tier || '',
				status: data?.status || '',
				nodeCount: data?.nodeCount || 0,
				totalEarnings: data?.totalEarnings || 0,
				joinedAt: data?.joinedAt || '',
				error: result.error,
			};
		}

		case 'getOperatorNodes': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const result = await apiClient.getOperatorNodes(operatorId);
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				nodes: data || [],
				nodeCount: Array.isArray(data) ? data.length : 0,
				error: result.error,
			};
		}

		case 'getOperatorEarnings': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getOperatorEarnings(operatorId, timePeriod);
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				period: timePeriod,
				totalEarnings: data?.totalEarnings || 0,
				pendingPayout: data?.pendingPayout || 0,
				paidOut: data?.paidOut || 0,
				earningsHistory: data?.history || [],
				error: result.error,
			};
		}

		case 'getOperatorStats': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const result = await apiClient.getOperatorStats(operatorId);
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				totalJobs: data?.totalJobs || 0,
				completedJobs: data?.completedJobs || 0,
				failedJobs: data?.failedJobs || 0,
				averageJobTime: data?.averageJobTime || 0,
				uptime: data?.uptime || 0,
				reputation: data?.reputation || 0,
				error: result.error,
			};
		}

		case 'getPayoutHistory': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.getPayoutHistory(operatorId, { period: timePeriod, limit });
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				payouts: data?.payouts || [],
				totalPaidOut: data?.totalPaidOut || 0,
				error: result.error,
			};
		}

		case 'configurePayoutAddress': {
			const payoutAddress = this.getNodeParameter('payoutAddress', i) as string;
			const result = await apiClient.configurePayoutAddress(payoutAddress);
			const data = result.data;
			return {
				success: result.success,
				payoutAddress,
				configured: data?.configured || false,
				error: result.error,
			};
		}

		case 'getOperatorTier': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const result = await apiClient.getOperatorTier(operatorId);
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				currentTier: data?.tier || '',
				tierBenefits: data?.benefits || [],
				nextTier: data?.nextTier || '',
				progressToNext: data?.progressToNext || 0,
				error: result.error,
			};
		}

		case 'getPerformanceMetrics': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const result = await apiClient.getOperatorPerformanceMetrics(operatorId);
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				uptime: data?.uptime || 0,
				jobSuccessRate: data?.jobSuccessRate || 0,
				averageRenderTime: data?.averageRenderTime || 0,
				gpuUtilization: data?.gpuUtilization || 0,
				networkScore: data?.networkScore || 0,
				error: result.error,
			};
		}

		case 'getJobHistory': {
			const operatorId = this.getNodeParameter('operatorId', i) as string;
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.getOperatorJobHistory(operatorId, { period: timePeriod, limit });
			const data = result.data;
			return {
				success: result.success,
				operatorId,
				jobs: data?.jobs || [],
				totalJobs: data?.totalJobs || 0,
				error: result.error,
			};
		}

		case 'updateOperatorProfile': {
			const profileName = this.getNodeParameter('profileName', i) as string;
			const profileDescription = this.getNodeParameter('profileDescription', i) as string;
			const result = await apiClient.updateOperatorProfile({
				name: profileName || undefined,
				description: profileDescription || undefined,
			});
			const data = result.data;
			return {
				success: result.success,
				updated: data?.updated || false,
				profile: data?.profile || {},
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
