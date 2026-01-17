/**
 * GPU Resource Actions
 * Operations for GPU management, availability, and pricing
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { GPU_TYPES } from '../../constants/gpuTypes';

export const gpuOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['gpu'] } },
		options: [
			{ name: 'Get Available GPUs', value: 'getAvailableGpus', description: 'Get list of available GPUs', action: 'Get available GPUs' },
			{ name: 'Get GPU Types', value: 'getGpuTypes', description: 'Get supported GPU types', action: 'Get GPU types' },
			{ name: 'Get GPU Pricing', value: 'getGpuPricing', description: 'Get GPU pricing information', action: 'Get GPU pricing' },
			{ name: 'Get GPU Availability', value: 'getGpuAvailability', description: 'Check availability of specific GPU', action: 'Get GPU availability' },
			{ name: 'Reserve GPU', value: 'reserveGpu', description: 'Reserve GPU for job', action: 'Reserve GPU' },
			{ name: 'Get GPU Performance', value: 'getGpuPerformance', description: 'Get GPU performance benchmarks', action: 'Get GPU performance' },
			{ name: 'Get GPU Queue', value: 'getGpuQueue', description: 'Get GPU job queue status', action: 'Get GPU queue' },
			{ name: 'Get Supported GPUs', value: 'getSupportedGpus', description: 'Get all supported GPU models', action: 'Get supported GPUs' },
			{ name: 'Compare GPU Options', value: 'compareGpuOptions', description: 'Compare multiple GPU options', action: 'Compare GPU options' },
		],
		default: 'getAvailableGpus',
	},
];

export const gpuFields: INodeProperties[] = [
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['gpu'], operation: ['getGpuPricing', 'getGpuAvailability', 'reserveGpu', 'getGpuPerformance', 'getGpuQueue'] } },
		options: [
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'RTX 4080', value: 'rtx4080' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'RTX 3080', value: 'rtx3080' },
			{ name: 'RTX A6000', value: 'rtxa6000' },
			{ name: 'A100', value: 'a100' },
			{ name: 'H100', value: 'h100' },
		],
		default: 'rtx4090',
		description: 'Type of GPU',
	},
	{
		displayName: 'Tier',
		name: 'tier',
		type: 'options',
		displayOptions: { show: { resource: ['gpu'], operation: ['getAvailableGpus'] } },
		options: [
			{ name: 'All Tiers', value: 'all' },
			{ name: 'Tier 1 (Consumer)', value: '1' },
			{ name: 'Tier 2 (Professional)', value: '2' },
			{ name: 'Tier 3 (Enterprise)', value: '3' },
		],
		default: 'all',
		description: 'GPU performance tier filter',
	},
	{
		displayName: 'Minimum VRAM (GB)',
		name: 'minVram',
		type: 'number',
		displayOptions: { show: { resource: ['gpu'], operation: ['getAvailableGpus'] } },
		default: 0,
		description: 'Minimum VRAM requirement in GB',
	},
	{
		displayName: 'Duration (Hours)',
		name: 'duration',
		type: 'number',
		displayOptions: { show: { resource: ['gpu'], operation: ['reserveGpu'] } },
		default: 1,
		description: 'Reservation duration in hours',
	},
	{
		displayName: 'Count',
		name: 'count',
		type: 'number',
		displayOptions: { show: { resource: ['gpu'], operation: ['reserveGpu'] } },
		default: 1,
		description: 'Number of GPUs to reserve',
	},
	{
		displayName: 'GPU Types to Compare',
		name: 'gpuTypesToCompare',
		type: 'string',
		displayOptions: { show: { resource: ['gpu'], operation: ['compareGpuOptions'] } },
		default: 'rtx4090,rtx3090,a100',
		description: 'Comma-separated list of GPU types to compare',
	},
];

export async function executeGpuOperation(
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
		case 'getAvailableGpus': {
			const tier = this.getNodeParameter('tier', i) as string;
			const minVram = this.getNodeParameter('minVram', i) as number;
			const params: { tier?: number; minVram?: number } = {};
			if (tier !== 'all') params.tier = parseInt(tier, 10);
			if (minVram > 0) params.minVram = minVram;
			
			const result = await apiClient.getAvailableGpus(params);
			const gpus = result.data || [];
			return {
				success: result.success,
				total: gpus.length,
				gpus: gpus,
				error: result.error,
			};
		}

		case 'getGpuTypes': {
			const gpuTypes = Object.values(GPU_TYPES);
			return {
				success: true,
				types: gpuTypes,
				total: gpuTypes.length,
			};
		}

		case 'getGpuPricing': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getGpuPricing(gpuType);
			return {
				success: result.success,
				gpuType,
				pricing: result.data,
				error: result.error,
			};
		}

		case 'getGpuAvailability': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getGpuAvailability(gpuType);
			const data = result.data;
			return {
				success: result.success,
				gpuType,
				available: data?.available || 0,
				total: data?.total || 0,
				inUse: data?.inUse || 0,
				queued: data?.queued || 0,
				error: result.error,
			};
		}

		case 'reserveGpu': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const duration = this.getNodeParameter('duration', i) as number;
			const count = this.getNodeParameter('count', i) as number;

			const result = await apiClient.reserveGpu({
				gpuType,
				count,
				duration,
			});
			const data = result.data;
			return {
				success: result.success,
				reservationId: data?.reservationId,
				expiresAt: data?.expiresAt,
				cost: data?.cost,
				error: result.error,
			};
		}

		case 'getGpuPerformance': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getGpuPerformance(gpuType);
			const data = result.data;
			return {
				success: result.success,
				gpuType,
				benchmarks: {
					octaneBench: data?.octaneBench || 0,
					blenderBench: data?.blenderBench || 0,
					aiInference: data?.aiInference || 0,
				},
				powerEfficiency: data?.powerEfficiency || 0,
				error: result.error,
			};
		}

		case 'getGpuQueue': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getGpuQueue(gpuType);
			const data = result.data;
			return {
				success: result.success,
				gpuType,
				queueLength: data?.queueLength || 0,
				estimatedWait: data?.estimatedWait || 0,
				jobsProcessing: data?.jobsProcessing || 0,
				error: result.error,
			};
		}

		case 'getSupportedGpus': {
			const supported = Object.entries(GPU_TYPES)
				.filter(([, value]) => value.supported)
				.map(([key, value]) => ({
					id: key,
					name: value.name,
					vram: value.vram,
					tier: value.tier,
				}));
			return {
				success: true,
				supportedGpus: supported,
				total: supported.length,
			};
		}

		case 'compareGpuOptions': {
			const gpuTypesToCompare = this.getNodeParameter('gpuTypesToCompare', i) as string;
			const gpuList = gpuTypesToCompare.split(',').map(g => g.trim());
			
			const comparisons = [];
			for (const gpuType of gpuList) {
				const perfResult = await apiClient.getGpuPerformance(gpuType);
				const pricingResult = await apiClient.getGpuPricing(gpuType);
				const gpuInfo = GPU_TYPES[gpuType as keyof typeof GPU_TYPES];
				
				comparisons.push({
					gpuType,
					name: gpuInfo?.name || gpuType,
					vram: gpuInfo?.vram || 0,
					tier: gpuInfo?.tier || 0,
					performance: perfResult.data,
					pricing: pricingResult.data,
				});
			}
			
			return {
				success: true,
				comparisons,
				recommendation: comparisons.length > 0 ? comparisons[0].gpuType : null,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
