/**
 * Network Stats Resource Actions
 * Operations for monitoring Render Network statistics
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const networkStatsOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['networkStats'] } },
		options: [
			{ name: 'Get Network Overview', value: 'getNetworkOverview', description: 'Get overall network statistics', action: 'Get network overview' },
			{ name: 'Get Total Nodes', value: 'getTotalNodes', description: 'Get total node count', action: 'Get total nodes' },
			{ name: 'Get Active Jobs', value: 'getActiveJobs', description: 'Get active job statistics', action: 'Get active jobs' },
			{ name: 'Get Network Capacity', value: 'getNetworkCapacity', description: 'Get network capacity info', action: 'Get network capacity' },
			{ name: 'Get GPU Distribution', value: 'getGpuDistribution', description: 'Get GPU type distribution', action: 'Get GPU distribution' },
			{ name: 'Get Job Statistics', value: 'getJobStatistics', description: 'Get job completion statistics', action: 'Get job statistics' },
			{ name: 'Get Earnings Distribution', value: 'getEarningsDistribution', description: 'Get earnings distribution', action: 'Get earnings distribution' },
			{ name: 'Get Token Metrics', value: 'getTokenMetrics', description: 'Get RENDER token metrics', action: 'Get token metrics' },
			{ name: 'Get Burn Statistics', value: 'getBurnStatistics', description: 'Get token burn statistics', action: 'Get burn statistics' },
			{ name: 'Get Historical Stats', value: 'getHistoricalStats', description: 'Get historical statistics', action: 'Get historical stats' },
		],
		default: 'getNetworkOverview',
	},
];

export const networkStatsFields: INodeProperties[] = [
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		displayOptions: { show: { resource: ['networkStats'], operation: ['getJobStatistics', 'getEarningsDistribution', 'getBurnStatistics', 'getHistoricalStats'] } },
		options: [
			{ name: '1 Hour', value: '1h' },
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
			{ name: '90 Days', value: '90d' },
			{ name: 'All Time', value: 'all' },
		],
		default: '24h',
		description: 'Time period for statistics',
	},
	{
		displayName: 'Metric',
		name: 'metric',
		type: 'options',
		displayOptions: { show: { resource: ['networkStats'], operation: ['getHistoricalStats'] } },
		options: [
			{ name: 'Total Jobs', value: 'totalJobs' },
			{ name: 'Active Nodes', value: 'activeNodes' },
			{ name: 'GPU Hours', value: 'gpuHours' },
			{ name: 'Earnings', value: 'earnings' },
			{ name: 'Token Burn', value: 'tokenBurn' },
		],
		default: 'totalJobs',
		description: 'Metric to retrieve',
	},
	{
		displayName: 'Granularity',
		name: 'granularity',
		type: 'options',
		displayOptions: { show: { resource: ['networkStats'], operation: ['getHistoricalStats'] } },
		options: [
			{ name: 'Hourly', value: 'hourly' },
			{ name: 'Daily', value: 'daily' },
			{ name: 'Weekly', value: 'weekly' },
			{ name: 'Monthly', value: 'monthly' },
		],
		default: 'daily',
		description: 'Data granularity',
	},
];

export async function executeNetworkStatsOperation(
	this: IExecuteFunctions,
	operation: string,
	i: number
): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
		apiEndpoint: credentials.apiEndpoint as string,
	});

	switch (operation) {
		case 'getNetworkOverview': {
			const result = await apiClient.getNetworkOverview();
			const data = result.data;
			return {
				success: result.success,
				overview: {
					totalNodes: data?.totalNodes || 0,
					activeNodes: data?.activeNodes || 0,
					totalJobs: data?.totalJobs || 0,
					activeJobs: data?.activeJobs || 0,
					networkCapacity: data?.networkCapacity || 0,
					utilizationPercent: data?.utilizationPercent || 0,
				},
				error: result.error,
			};
		}

		case 'getTotalNodes': {
			const result = await apiClient.getNodeStats();
			const data = result.data;
			return {
				success: result.success,
				totalNodes: data?.total || 0,
				activeNodes: data?.active || 0,
				offlineNodes: data?.offline || 0,
				byTier: data?.byTier || {},
				error: result.error,
			};
		}

		case 'getActiveJobs': {
			const result = await apiClient.getActiveJobStats();
			const data = result.data;
			return {
				success: result.success,
				rendering: data?.rendering || 0,
				aiCompute: data?.aiCompute || 0,
				queued: data?.queued || 0,
				processing: data?.processing || 0,
				byEngine: data?.byEngine || {},
				error: result.error,
			};
		}

		case 'getNetworkCapacity': {
			const result = await apiClient.getNetworkCapacity();
			const data = result.data;
			return {
				success: result.success,
				totalGpuHours: data?.totalGpuHours || 0,
				availableGpuHours: data?.availableGpuHours || 0,
				utilizationPercent: data?.utilizationPercent || 0,
				byGpuType: data?.byGpuType || {},
				error: result.error,
			};
		}

		case 'getGpuDistribution': {
			const result = await apiClient.getGpuDistribution();
			const data = result.data || {};
			return {
				success: result.success,
				distribution: data,
				total: Object.values(data).reduce((sum: number, val) => sum + (val as number), 0),
				error: result.error,
			};
		}

		case 'getJobStatistics': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getJobStatistics({ period: timePeriod });
			const data = result.data;
			return {
				success: result.success,
				period: timePeriod,
				total: data?.total || 0,
				completed: data?.completed || 0,
				failed: data?.failed || 0,
				cancelled: data?.cancelled || 0,
				averageDuration: data?.averageDuration || 0,
				successRate: data?.successRate || 0,
				error: result.error,
			};
		}

		case 'getEarningsDistribution': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getEarningsDistribution({ period: timePeriod });
			const data = result.data;
			return {
				success: result.success,
				period: timePeriod,
				totalEarnings: data?.totalEarnings || 0,
				byTier: data?.byTier || {},
				byGpuType: data?.byGpuType || {},
				topEarners: data?.topEarners || [],
				error: result.error,
			};
		}

		case 'getTokenMetrics': {
			const result = await apiClient.getTokenMetrics();
			const data = result.data;
			return {
				success: result.success,
				price: data?.price || 0,
				marketCap: data?.marketCap || 0,
				volume24h: data?.volume24h || 0,
				circulatingSupply: data?.circulatingSupply || 0,
				totalSupply: data?.totalSupply || 0,
				stakingRatio: data?.stakingRatio || 0,
				error: result.error,
			};
		}

		case 'getBurnStatistics': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getBurnStatistics({ period: timePeriod });
			const data = result.data;
			return {
				success: result.success,
				period: timePeriod,
				totalBurned: data?.totalBurned || 0,
				burnedPeriod: data?.burnedPeriod || 0,
				burnRate: data?.burnRate || 0,
				largestBurns: data?.largestBurns || [],
				error: result.error,
			};
		}

		case 'getHistoricalStats': {
			const metric = this.getNodeParameter('metric', i) as string;
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const granularity = this.getNodeParameter('granularity', i) as string;
			const result = await apiClient.getHistoricalStats({
				metric,
				period: timePeriod,
				granularity,
			});
			return {
				success: result.success,
				metric,
				period: timePeriod,
				granularity,
				dataPoints: result.data || [],
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
