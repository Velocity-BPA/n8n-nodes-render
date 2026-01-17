/**
 * Pricing Resource Actions
 * Operations for Render Network pricing information
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { GPU_TYPES, GPU_TIERS } from '../../constants';

export const pricingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['pricing'] } },
		options: [
			{ name: 'Get Current Pricing', value: 'getCurrentPricing', description: 'Get current network pricing', action: 'Get current pricing' },
			{ name: 'Get GPU Pricing', value: 'getGpuPricing', description: 'Get GPU-specific pricing', action: 'Get GPU pricing' },
			{ name: 'Get Render Pricing', value: 'getRenderPricing', description: 'Get 3D render pricing', action: 'Get render pricing' },
			{ name: 'Get AI Pricing', value: 'getAiPricing', description: 'Get AI compute pricing', action: 'Get AI pricing' },
			{ name: 'Get Price History', value: 'getPriceHistory', description: 'Get historical pricing', action: 'Get price history' },
			{ name: 'Calculate Job Cost', value: 'calculateJobCost', description: 'Calculate estimated job cost', action: 'Calculate job cost' },
			{ name: 'Get Discount Tiers', value: 'getDiscountTiers', description: 'Get volume discount tiers', action: 'Get discount tiers' },
			{ name: 'Get Volume Pricing', value: 'getVolumePricing', description: 'Get volume pricing details', action: 'Get volume pricing' },
			{ name: 'Get Token Burn Rate', value: 'getTokenBurnRate', description: 'Get RENDER token burn rate', action: 'Get token burn rate' },
			{ name: 'Get Network Utilization', value: 'getNetworkUtilization', description: 'Get network utilization metrics', action: 'Get network utilization' },
		],
		default: 'getCurrentPricing',
	},
];

export const pricingFields: INodeProperties[] = [
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['pricing'], operation: ['getGpuPricing', 'calculateJobCost'] } },
		options: [
			{ name: 'RTX 3080', value: 'rtx3080' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'RTX 4080', value: 'rtx4080' },
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'A100', value: 'a100' },
			{ name: 'H100', value: 'h100' },
		],
		default: 'rtx4090',
		description: 'GPU type for pricing',
	},
	{
		displayName: 'Job Type',
		name: 'jobType',
		type: 'options',
		displayOptions: { show: { resource: ['pricing'], operation: ['calculateJobCost'] } },
		options: [
			{ name: 'Render', value: 'render' },
			{ name: 'AI Inference', value: 'ai_inference' },
			{ name: 'AI Training', value: 'ai_training' },
		],
		default: 'render',
		description: 'Type of job',
	},
	{
		displayName: 'Estimated Hours',
		name: 'estimatedHours',
		type: 'number',
		displayOptions: { show: { resource: ['pricing'], operation: ['calculateJobCost'] } },
		default: 1,
		description: 'Estimated GPU hours for job',
	},
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		displayOptions: { show: { resource: ['pricing'], operation: ['getPriceHistory'] } },
		options: [
			{ name: 'Day', value: 'day' },
			{ name: 'Week', value: 'week' },
			{ name: 'Month', value: 'month' },
			{ name: 'Year', value: 'year' },
		],
		default: 'month',
		description: 'Time period for price history',
	},
	{
		displayName: 'Volume (GPU Hours)',
		name: 'volumeHours',
		type: 'number',
		displayOptions: { show: { resource: ['pricing'], operation: ['getVolumePricing'] } },
		default: 100,
		description: 'Volume in GPU hours for discount calculation',
	},
];

// Helper to convert GPU_TYPES object to array
function getGpuTypesArray(): Array<{ id: string; name: string; vram: number; tier: number; priceMultiplier: number }> {
	return Object.entries(GPU_TYPES).map(([id, gpu]) => ({
		id,
		name: gpu.name,
		vram: gpu.vram,
		tier: gpu.tier,
		priceMultiplier: gpu.priceMultiplier,
	}));
}

// Helper to convert GPU_TIERS object to array
function getGpuTiersArray(): Array<{ id: number; name: string; minOb: number; multiplier: number }> {
	return Object.entries(GPU_TIERS).map(([id, tier]) => ({
		id: parseInt(id),
		name: tier.name,
		minOb: tier.minRenderScore,
		multiplier: 1,
	}));
}

export async function executePricingOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});

	const gpuTypesArray = getGpuTypesArray();
	const gpuTiersArray = getGpuTiersArray();

	switch (operation) {
		case 'getCurrentPricing': {
			const result = await apiClient.getCurrentPricing();
			const data = result.data;
			return {
				success: result.success,
				basePrice: data?.basePrice || 0,
				gpuPrices: data?.gpuPrices || {},
				qualityMultipliers: data?.qualityMultipliers || {},
				priorityMultipliers: data?.priorityMultipliers || {},
				volumeDiscounts: data?.volumeDiscounts || [],
				currency: 'RENDER',
				error: result.error,
			};
		}

		case 'getGpuPricing': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getGpuPricing(gpuType);
			const data = result.data;
			
			// Fallback to static GPU_TYPES data if API doesn't return
			const gpuInfo = gpuTypesArray.find(g => g.id === gpuType);
			return {
				success: result.success,
				gpuType,
				pricePerHour: data?.[gpuType] || gpuInfo?.priceMultiplier || 0,
				tier: gpuInfo?.tier || 0,
				vram: gpuInfo?.vram || 0,
				error: result.error,
			};
		}

		case 'getRenderPricing': {
			const result = await apiClient.getRenderPricing();
			const data = result.data;
			return {
				success: result.success,
				basePricePerHour: data?.basePricePerHour || 0,
				qualityMultiplier: data?.qualityMultiplier || 1,
				engineMultiplier: data?.engineMultiplier || 1,
				estimatedCostPerFrame: data?.estimatedCostPerFrame || 0,
				error: result.error,
			};
		}

		case 'getAiPricing': {
			const result = await apiClient.getAiPricing();
			const data = result.data;
			return {
				success: result.success,
				pricePerToken: data?.pricePerToken || 0,
				pricePerGpuHour: data?.pricePerGpuHour || 0,
				modelMultiplier: data?.modelMultiplier || 1,
				error: result.error,
			};
		}

		case 'getPriceHistory': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getPriceHistory({ period: timePeriod });
			const data = result.data || [];
			return {
				success: result.success,
				period: timePeriod,
				history: data,
				dataPoints: Array.isArray(data) ? data.length : 0,
				error: result.error,
			};
		}

		case 'calculateJobCost': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const jobType = this.getNodeParameter('jobType', i) as string;
			const estimatedHours = this.getNodeParameter('estimatedHours', i) as number;
			
			const result = await apiClient.calculateJobCost({
				gpuPreference: gpuType,
			});
			const data = result.data;
			
			// Calculate locally if API doesn't return
			const gpuInfo = gpuTypesArray.find(g => g.id === gpuType);
			const baseRate = gpuInfo?.priceMultiplier || 0.5;
			const calculatedCost = baseRate * estimatedHours;
			
			return {
				success: result.success,
				gpuType,
				jobType,
				estimatedHours,
				estimatedCost: data?.estimatedCost || calculatedCost,
				currency: 'RENDER',
				breakdown: data?.breakdown || {
					gpu: calculatedCost,
					storage: 0,
					priority: 0,
				},
				error: result.error,
			};
		}

		case 'getDiscountTiers': {
			const result = await apiClient.getDiscountTiers();
			const data = result.data || [];
			return {
				success: result.success,
				tiers: Array.isArray(data) ? data : gpuTiersArray.map(tier => ({
					tier: tier.id,
					name: tier.name,
					threshold: tier.minOb,
					discount: (1 - tier.multiplier) * 100,
				})),
				error: result.error,
			};
		}

		case 'getVolumePricing': {
			const volumeHours = this.getNodeParameter('volumeHours', i) as number;
			const result = await apiClient.getVolumePricing();
			const data = result.data || [];
			
			// Find applicable tier
			const applicableTier = gpuTiersArray
				.filter(tier => volumeHours >= tier.minOb)
				.sort((a, b) => b.minOb - a.minOb)[0];
			
			return {
				success: result.success,
				volumeHours,
				applicableTier: applicableTier?.name || 'Standard',
				discountPercentage: applicableTier ? (1 - applicableTier.multiplier) * 100 : 0,
				volumeTiers: data,
				error: result.error,
			};
		}

		case 'getTokenBurnRate': {
			const result = await apiClient.getBurnRate();
			const data = result.data;
			return {
				success: result.success,
				rate: data?.rate || 0,
				dailyAverage: data?.dailyAverage || 0,
				trend: data?.trend || 'stable',
				history: data?.history || [],
				error: result.error,
			};
		}

		case 'getNetworkUtilization': {
			const result = await apiClient.getNetworkOverview();
			const data = result.data;
			return {
				success: result.success,
				utilizationPercent: data?.utilizationPercent || 0,
				gpuHoursToday: data?.gpuHoursToday || 0,
				activeNodes: data?.activeNodes || 0,
				totalNodes: data?.totalNodes || 0,
				activeJobs: data?.activeJobs || 0,
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
