/**
 * Burn-Mint Equilibrium (BME) Resource Actions
 * Operations for RENDER token economics
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { formatRender } from '../../utils/unitConverter';

// BME Operations
export const burnMintOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['burnMint'],
			},
		},
		options: [
			{
				name: 'Get BME Stats',
				value: 'getBmeStats',
				description: 'Get Burn-Mint Equilibrium statistics',
				action: 'Get BME stats',
			},
			{
				name: 'Get Burn Rate',
				value: 'getBurnRate',
				description: 'Get current token burn rate',
				action: 'Get burn rate',
			},
			{
				name: 'Get Mint Rate',
				value: 'getMintRate',
				description: 'Get current token mint rate',
				action: 'Get mint rate',
			},
			{
				name: 'Get Token Circulation',
				value: 'getTokenCirculation',
				description: 'Get token circulation metrics',
				action: 'Get token circulation',
			},
			{
				name: 'Get BME History',
				value: 'getBmeHistory',
				description: 'Get historical BME data',
				action: 'Get BME history',
			},
			{
				name: 'Calculate Equilibrium',
				value: 'calculateEquilibrium',
				description: 'Calculate equilibrium projections',
				action: 'Calculate equilibrium',
			},
			{
				name: 'Get Emission Schedule',
				value: 'getEmissionSchedule',
				description: 'Get token emission schedule',
				action: 'Get emission schedule',
			},
		],
		default: 'getBmeStats',
	},
];

// BME Fields
export const burnMintFields: INodeProperties[] = [
	// Time period for historical data
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		options: [
			{ name: 'Last 24 Hours', value: '24h' },
			{ name: 'Last 7 Days', value: '7d' },
			{ name: 'Last 30 Days', value: '30d' },
			{ name: 'Last 90 Days', value: '90d' },
			{ name: 'Last Year', value: '1y' },
			{ name: 'All Time', value: 'all' },
		],
		default: '30d',
		description: 'Time period for data',
		displayOptions: {
			show: {
				resource: ['burnMint'],
				operation: ['getBmeHistory', 'getBurnRate', 'getMintRate'],
			},
		},
	},
	// Projection period for equilibrium calculation
	{
		displayName: 'Projection Period',
		name: 'projectionPeriod',
		type: 'options',
		options: [
			{ name: '30 Days', value: '30d' },
			{ name: '90 Days', value: '90d' },
			{ name: '6 Months', value: '6m' },
			{ name: '1 Year', value: '1y' },
			{ name: '2 Years', value: '2y' },
		],
		default: '1y',
		description: 'Period for equilibrium projection',
		displayOptions: {
			show: {
				resource: ['burnMint'],
				operation: ['calculateEquilibrium'],
			},
		},
	},
	// Network growth assumption
	{
		displayName: 'Network Growth Rate',
		name: 'networkGrowthRate',
		type: 'options',
		options: [
			{ name: 'Conservative (5%)', value: 'conservative' },
			{ name: 'Moderate (15%)', value: 'moderate' },
			{ name: 'Aggressive (30%)', value: 'aggressive' },
			{ name: 'Custom', value: 'custom' },
		],
		default: 'moderate',
		description: 'Assumed network growth rate',
		displayOptions: {
			show: {
				resource: ['burnMint'],
				operation: ['calculateEquilibrium'],
			},
		},
	},
	// Custom growth rate
	{
		displayName: 'Custom Growth Rate (%)',
		name: 'customGrowthRate',
		type: 'number',
		default: 20,
		description: 'Custom annual growth rate percentage',
		displayOptions: {
			show: {
				resource: ['burnMint'],
				operation: ['calculateEquilibrium'],
				networkGrowthRate: ['custom'],
			},
		},
	},
	// Include detailed breakdown
	{
		displayName: 'Include Breakdown',
		name: 'includeBreakdown',
		type: 'boolean',
		default: false,
		description: 'Whether to include detailed breakdown',
		displayOptions: {
			show: {
				resource: ['burnMint'],
				operation: ['getBmeStats', 'getBurnRate', 'getMintRate'],
			},
		},
	},
];

// Execute BME Operations
export async function executeBurnMintOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
		apiEndpoint: credentials.apiEndpoint as string,
	});

	switch (operation) {
		case 'getBmeStats': {
			const includeBreakdown = this.getNodeParameter('includeBreakdown', itemIndex, false) as boolean;
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			const result: IDataObject = {
				totalBurned: stats.totalBurned,
				formattedBurned: formatRender(stats.totalBurned),
				totalMinted: stats.totalMinted,
				formattedMinted: formatRender(stats.totalMinted),
				netChange: stats.totalMinted - stats.totalBurned,
				formattedNetChange: formatRender(stats.totalMinted - stats.totalBurned),
				currentCirculation: stats.circulation,
				formattedCirculation: formatRender(stats.circulation),
				burnRate: stats.burnRate,
				mintRate: stats.mintRate,
				equilibriumRatio: stats.equilibrium,
				isDeflationary: stats.totalBurned > stats.totalMinted,
			};

			if (includeBreakdown) {
				result.details = {
					burnRate: stats.burnRate,
					mintRate: stats.mintRate,
					equilibrium: stats.equilibrium,
				};
			}

			return result;
		}

		case 'getBurnRate': {
			const timePeriod = this.getNodeParameter('timePeriod', itemIndex) as string;
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			// Calculate period-based burn rate from overall stats
			const periodMultiplier = timePeriod === '1h' ? 1/24 : timePeriod === '24h' ? 1 : timePeriod === '7d' ? 7 : 30;

			return {
				period: timePeriod,
				burnRate: stats.burnRate,
				estimatedBurned: stats.burnRate * periodMultiplier,
				formattedBurned: formatRender(stats.burnRate * periodMultiplier),
				totalBurned: stats.totalBurned,
				trend: stats.burnRate > stats.mintRate ? 'increasing' : 'decreasing',
			};
		}

		case 'getMintRate': {
			const timePeriod = this.getNodeParameter('timePeriod', itemIndex) as string;
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			const periodMultiplier = timePeriod === '1h' ? 1/24 : timePeriod === '24h' ? 1 : timePeriod === '7d' ? 7 : 30;

			return {
				period: timePeriod,
				mintRate: stats.mintRate,
				estimatedMinted: stats.mintRate * periodMultiplier,
				formattedMinted: formatRender(stats.mintRate * periodMultiplier),
				totalMinted: stats.totalMinted,
				trend: stats.mintRate > stats.burnRate ? 'increasing' : 'stable',
			};
		}

		case 'getTokenCirculation': {
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			return {
				totalSupply: stats.totalMinted,
				formattedSupply: formatRender(stats.totalMinted),
				circulatingSupply: stats.circulation,
				formattedCirculating: formatRender(stats.circulation),
				burnedTotal: stats.totalBurned,
				formattedBurned: formatRender(stats.totalBurned),
				percentCirculating: ((stats.circulation / stats.totalMinted) * 100).toFixed(2),
				percentBurned: ((stats.totalBurned / stats.totalMinted) * 100).toFixed(2),
			};
		}

		case 'getBmeHistory': {
			const timePeriod = this.getNodeParameter('timePeriod', itemIndex) as string;
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			return {
				period: timePeriod,
				summary: {
					totalBurned: stats.totalBurned,
					totalMinted: stats.totalMinted,
					netChange: stats.totalMinted - stats.totalBurned,
					currentCirculation: stats.circulation,
				},
				trends: {
					burnTrend: stats.burnRate > stats.mintRate ? 'deflationary' : 'inflationary',
					equilibriumStatus: stats.equilibrium,
				},
			};
		}

		case 'calculateEquilibrium': {
			const projectionPeriod = this.getNodeParameter('projectionPeriod', itemIndex) as string;
			const networkGrowthRate = this.getNodeParameter('networkGrowthRate', itemIndex) as string;
			const customGrowthRate = this.getNodeParameter('customGrowthRate', itemIndex, 20) as number;

			const growthRate = networkGrowthRate === 'custom'
				? customGrowthRate
				: networkGrowthRate === 'conservative' ? 5
				: networkGrowthRate === 'moderate' ? 15
				: 30;

			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			// Calculate projected values based on growth rate
			const periodMonths = projectionPeriod === '1m' ? 1 : projectionPeriod === '3m' ? 3 : projectionPeriod === '6m' ? 6 : 12;
			const projectedSupply = stats.circulation * (1 + (growthRate / 100) * (periodMonths / 12));

			return {
				projectionPeriod,
				assumedGrowthRate: growthRate,
				currentState: {
					supply: stats.circulation,
					burnRate: stats.burnRate,
					mintRate: stats.mintRate,
					equilibrium: stats.equilibrium,
				},
				projectedState: {
					supply: projectedSupply,
					formattedSupply: formatRender(projectedSupply),
				},
				equilibriumAnalysis: {
					currentRatio: stats.burnRate / stats.mintRate,
					isAtEquilibrium: Math.abs(stats.burnRate - stats.mintRate) < 0.1,
					trend: stats.burnRate > stats.mintRate ? 'deflationary' : 'inflationary',
				},
			};
		}

		case 'getEmissionSchedule': {
			const response = await apiClient.getBmeStats();
			const stats = response.data;

			if (!stats) {
				throw new Error('Failed to retrieve BME stats');
			}

			return {
				currentMintRate: stats.mintRate,
				formattedRate: formatRender(stats.mintRate),
				currentBurnRate: stats.burnRate,
				equilibrium: stats.equilibrium,
				totalMinted: stats.totalMinted,
				totalBurned: stats.totalBurned,
				circulatingSupply: stats.circulation,
				note: 'Render Network uses a Burn-Mint Equilibrium (BME) model rather than a fixed emission schedule',
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
