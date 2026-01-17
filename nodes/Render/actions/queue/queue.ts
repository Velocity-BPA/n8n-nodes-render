/**
 * Queue Resource Actions
 * Operations for job queue management
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const queueOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['queue'] } },
		options: [
			{ name: 'Get Queue Status', value: 'getQueueStatus', description: 'Get overall queue status', action: 'Get queue status' },
			{ name: 'Get Queue Position', value: 'getQueuePosition', description: 'Get job position in queue', action: 'Get queue position' },
			{ name: 'Get Estimated Wait', value: 'getEstimatedWait', description: 'Get estimated wait time', action: 'Get estimated wait' },
			{ name: 'Get Queue Statistics', value: 'getQueueStatistics', description: 'Get queue statistics', action: 'Get queue statistics' },
			{ name: 'Prioritize Job', value: 'prioritizeJob', description: 'Prioritize a job in queue', action: 'Prioritize job' },
			{ name: 'Get Priority Pricing', value: 'getPriorityPricing', description: 'Get priority upgrade pricing', action: 'Get priority pricing' },
			{ name: 'Get Queue History', value: 'getQueueHistory', description: 'Get historical queue data', action: 'Get queue history' },
		],
		default: 'getQueueStatus',
	},
];

export const queueFields: INodeProperties[] = [
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['queue'], operation: ['getQueuePosition', 'prioritizeJob'] } },
		default: '',
		description: 'The job ID to check or prioritize',
	},
	{
		displayName: 'Priority Level',
		name: 'priorityLevel',
		type: 'options',
		displayOptions: { show: { resource: ['queue'], operation: ['prioritizeJob'] } },
		options: [
			{ name: 'Standard', value: 'standard' },
			{ name: 'High', value: 'high' },
			{ name: 'Urgent', value: 'urgent' },
			{ name: 'Immediate', value: 'immediate' },
		],
		default: 'high',
		description: 'Priority level for the job',
	},
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['queue'], operation: ['getEstimatedWait'] } },
		options: [
			{ name: 'Any GPU', value: 'any' },
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'A100', value: 'a100' },
		],
		default: 'any',
		description: 'GPU type for wait estimate',
	},
	{
		displayName: 'Time Period',
		name: 'timePeriod',
		type: 'options',
		displayOptions: { show: { resource: ['queue'], operation: ['getQueueStatistics', 'getQueueHistory'] } },
		options: [
			{ name: '1 Hour', value: '1h' },
			{ name: '24 Hours', value: '24h' },
			{ name: '7 Days', value: '7d' },
			{ name: '30 Days', value: '30d' },
		],
		default: '24h',
		description: 'Time period for statistics',
	},
];

export async function executeQueueOperation(
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
		case 'getQueueStatus': {
			const result = await apiClient.getQueueStatus();
			const data = result.data;
			return {
				success: result.success,
				queueLength: data?.length || 0,
				estimatedWait: data?.estimatedWait || 0,
				priorityQueues: data?.priorityQueues || {},
				error: result.error,
			};
		}

		case 'getQueuePosition': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getQueuePosition(jobId);
			const data = result.data;
			return {
				success: result.success,
				jobId,
				position: data?.position || 0,
				estimatedStart: data?.estimatedStart || '',
				error: result.error,
			};
		}

		case 'getEstimatedWait': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.getEstimatedWait({
				gpuType: gpuType !== 'any' ? gpuType : undefined,
			});
			const data = result.data;
			return {
				success: result.success,
				gpuType,
				estimatedMinutes: data?.estimatedMinutes || 0,
				confidence: data?.confidence || 0,
				queueLength: data?.queueLength || 0,
				error: result.error,
			};
		}

		case 'getQueueStatistics': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getQueueStatistics({ period: timePeriod });
			const data = result.data;
			return {
				success: result.success,
				period: timePeriod,
				averageWait: data?.averageWait || 0,
				peakWait: data?.peakWait || 0,
				throughput: data?.throughput || 0,
				byPriority: data?.byPriority || {},
				error: result.error,
			};
		}

		case 'prioritizeJob': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const priorityLevel = this.getNodeParameter('priorityLevel', i) as string;
			const result = await apiClient.prioritizeJob(jobId, priorityLevel);
			const data = result.data;
			return {
				success: result.success,
				jobId,
				newPriority: priorityLevel,
				newPosition: data?.newPosition || 0,
				additionalCost: data?.additionalCost || 0,
				estimatedStart: data?.estimatedStart || '',
				error: result.error,
			};
		}

		case 'getPriorityPricing': {
			const result = await apiClient.getPriorityPricing();
			return {
				success: result.success,
				pricing: result.data || {},
				error: result.error,
			};
		}

		case 'getQueueHistory': {
			const timePeriod = this.getNodeParameter('timePeriod', i) as string;
			const result = await apiClient.getQueueHistory({ period: timePeriod });
			return {
				success: result.success,
				period: timePeriod,
				history: result.data || [],
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
