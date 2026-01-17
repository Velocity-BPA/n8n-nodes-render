import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { JobClient } from '../../transport/jobClient';

export const jobOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['job'] } },
		options: [
			{ name: 'Create Render Job', value: 'createJob', description: 'Create a new render job', action: 'Create a render job' },
			{ name: 'Get Job Info', value: 'getJobInfo', description: 'Get detailed job information', action: 'Get job info' },
			{ name: 'Get Job Status', value: 'getJobStatus', description: 'Get current job status', action: 'Get job status' },
			{ name: 'Get Job Progress', value: 'getJobProgress', description: 'Get job progress details', action: 'Get job progress' },
			{ name: 'Cancel Job', value: 'cancelJob', description: 'Cancel a running job', action: 'Cancel a job' },
			{ name: 'Get Job Results', value: 'getJobResults', description: 'Get completed job results', action: 'Get job results' },
			{ name: 'Get Job Cost', value: 'getJobCost', description: 'Get job cost breakdown', action: 'Get job cost' },
			{ name: 'List User Jobs', value: 'listUserJobs', description: 'List all jobs for user', action: 'List user jobs' },
			{ name: 'Get Queue Position', value: 'getQueuePosition', description: 'Get job queue position', action: 'Get queue position' },
			{ name: 'Retry Failed Job', value: 'retryJob', description: 'Retry a failed job', action: 'Retry a job' },
			{ name: 'Get Job Logs', value: 'getJobLogs', description: 'Get job execution logs', action: 'Get job logs' },
			{ name: 'Get Job Metrics', value: 'getJobMetrics', description: 'Get job performance metrics', action: 'Get job metrics' },
			{ name: 'Estimate Job Cost', value: 'estimateJobCost', description: 'Estimate cost before submission', action: 'Estimate job cost' },
			{ name: 'Get Job History', value: 'getJobHistory', description: 'Get historical jobs', action: 'Get job history' },
		],
		default: 'createJob',
	},
];

export const jobFields: INodeProperties[] = [
	// Job ID field for most operations
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['job'], operation: ['getJobInfo', 'getJobStatus', 'getJobProgress', 'cancelJob', 'getJobResults', 'getJobCost', 'getQueuePosition', 'retryJob', 'getJobLogs', 'getJobMetrics'] } },
		default: '',
		description: 'The unique identifier of the job',
	},
	// Create job fields
	{
		displayName: 'Scene URL',
		name: 'sceneUrl',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		default: '',
		description: 'URL of the scene file to render',
	},
	{
		displayName: 'Render Engine',
		name: 'renderEngine',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: 'OctaneRender', value: 'octane' },
			{ name: 'Cycles', value: 'cycles' },
			{ name: 'Redshift', value: 'redshift' },
			{ name: 'Arnold', value: 'arnold' },
			{ name: 'V-Ray', value: 'vray' },
		],
		default: 'octane',
		description: 'Render engine to use',
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: 'EXR', value: 'exr' },
			{ name: 'PNG', value: 'png' },
			{ name: 'JPEG', value: 'jpg' },
			{ name: 'TIFF', value: 'tiff' },
		],
		default: 'exr',
		description: 'Output file format',
	},
	{
		displayName: 'Resolution',
		name: 'resolution',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: '720p (1280×720)', value: '720p' },
			{ name: '1080p (1920×1080)', value: '1080p' },
			{ name: '2K (2560×1440)', value: '2k' },
			{ name: '4K (3840×2160)', value: '4k' },
			{ name: '8K (7680×4320)', value: '8k' },
		],
		default: '1080p',
		description: 'Output resolution',
	},
	{
		displayName: 'Quality Preset',
		name: 'qualityPreset',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Preview', value: 'preview' },
			{ name: 'Production', value: 'production' },
			{ name: 'High Quality', value: 'highQuality' },
			{ name: 'Ultra', value: 'ultra' },
		],
		default: 'production',
		description: 'Quality preset level',
	},
	{
		displayName: 'Frame Range',
		name: 'frameRange',
		type: 'string',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		default: '1-100',
		description: 'Frame range to render (e.g., "1-100" or "1,5,10-20")',
	},
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: 'Any Available', value: 'any' },
			{ name: 'NVIDIA RTX 4090', value: 'rtx4090' },
			{ name: 'NVIDIA RTX 3090', value: 'rtx3090' },
			{ name: 'NVIDIA A100', value: 'a100' },
			{ name: 'NVIDIA H100', value: 'h100' },
		],
		default: 'any',
		description: 'Preferred GPU type',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['createJob'] } },
		options: [
			{ name: 'Economy', value: 'economy' },
			{ name: 'Standard', value: 'standard' },
			{ name: 'Priority', value: 'priority' },
			{ name: 'Rush', value: 'rush' },
		],
		default: 'standard',
		description: 'Job priority level',
	},
	// List user jobs options
	{
		displayName: 'Status Filter',
		name: 'statusFilter',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['listUserJobs', 'getJobHistory'] } },
		options: [
			{ name: 'All', value: 'all' },
			{ name: 'Pending', value: 'pending' },
			{ name: 'Queued', value: 'queued' },
			{ name: 'Running', value: 'running' },
			{ name: 'Completed', value: 'completed' },
			{ name: 'Failed', value: 'failed' },
			{ name: 'Cancelled', value: 'cancelled' },
		],
		default: 'all',
		description: 'Filter by job status',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		typeOptions: { minValue: 1, maxValue: 100 },
		displayOptions: { show: { resource: ['job'], operation: ['listUserJobs', 'getJobHistory'] } },
		default: 20,
		description: 'Max number of results',
	},
	// Estimate cost fields
	{
		displayName: 'Estimated Frames',
		name: 'estimatedFrames',
		type: 'number',
		displayOptions: { show: { resource: ['job'], operation: ['estimateJobCost'] } },
		default: 100,
		description: 'Number of frames to estimate',
	},
	{
		displayName: 'Estimated Complexity',
		name: 'estimatedComplexity',
		type: 'options',
		displayOptions: { show: { resource: ['job'], operation: ['estimateJobCost'] } },
		options: [
			{ name: 'Low', value: 'low' },
			{ name: 'Medium', value: 'medium' },
			{ name: 'High', value: 'high' },
			{ name: 'Extreme', value: 'extreme' },
		],
		default: 'medium',
		description: 'Scene complexity estimate',
	},
	// Retry options
	{
		displayName: 'Retry Failed Frames Only',
		name: 'retryFailedOnly',
		type: 'boolean',
		displayOptions: { show: { resource: ['job'], operation: ['retryJob'] } },
		default: true,
		description: 'Whether to only retry failed frames',
	},
];

export async function executeJobOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});
	const jobClient = new JobClient(apiClient);

	switch (operation) {
		case 'createJob': {
			const sceneUrl = this.getNodeParameter('sceneUrl', i) as string;
			const renderEngine = this.getNodeParameter('renderEngine', i) as string;
			const outputFormat = this.getNodeParameter('outputFormat', i) as string;
			const resolution = this.getNodeParameter('resolution', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const frameRange = this.getNodeParameter('frameRange', i) as string;
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const priority = this.getNodeParameter('priority', i) as string;

			// Parse resolution string to dimensions
			const resolutionMap: Record<string, { width: number; height: number }> = {
				'720p': { width: 1280, height: 720 },
				'1080p': { width: 1920, height: 1080 },
				'2k': { width: 2560, height: 1440 },
				'4k': { width: 3840, height: 2160 },
				'8k': { width: 7680, height: 4320 },
			};

			// Parse frame range
			const [startFrame, endFrame] = frameRange.split('-').map(Number);

			const result = await apiClient.createJob({
				sceneUrl,
				engine: renderEngine,
				outputFormat,
				resolution: resolutionMap[resolution] || resolutionMap['1080p'],
				quality: qualityPreset,
				frames: { start: startFrame || 1, end: endFrame || 1 },
				gpuPreference: gpuType,
				priority: priority as 'low' | 'normal' | 'high' | 'priority',
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'getJobInfo': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJob(jobId);
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'getJobStatus': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJobStatus(jobId);
			return { success: result.success, status: result.data, error: result.error };
		}

		case 'getJobProgress': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await jobClient.getJobProgress(jobId);
			return { success: true, progress: result };
		}

		case 'cancelJob': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.cancelJob(jobId);
			return { success: result.success, cancelled: result.data, error: result.error };
		}

		case 'getJobResults': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJobResults(jobId);
			return { success: result.success, results: result.data, error: result.error };
		}

		case 'getJobCost': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJob(jobId);
			const data = result.data;
			return { 
				success: result.success, 
				cost: {
					jobId,
					estimatedCost: data?.cost?.estimated || 0,
					actualCost: data?.cost?.actual || 0,
					currency: data?.cost?.currency || 'RENDER',
				},
				error: result.error,
			};
		}

		case 'listUserJobs': {
			const statusFilter = this.getNodeParameter('statusFilter', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.listJobs({
				status: statusFilter !== 'all' ? statusFilter : undefined,
				limit,
			});
			return { success: result.success, jobs: result.data, error: result.error };
		}

		case 'getQueuePosition': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getQueuePosition(jobId);
			return { success: result.success, queue: result.data, error: result.error };
		}

		case 'retryJob': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const retryFailedOnly = this.getNodeParameter('retryFailedOnly', i) as boolean;
			const result = await apiClient.retryJob(jobId, { retryFailedFramesOnly: retryFailedOnly });
			return { success: result.success, retried: result.data, error: result.error };
		}

		case 'getJobLogs': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJobLogs(jobId);
			return { success: result.success, logs: result.data || [], error: result.error };
		}

		case 'getJobMetrics': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJobMetrics(jobId);
			return { success: result.success, metrics: result.data || {}, error: result.error };
		}

		case 'estimateJobCost': {
			const resolution = this.getNodeParameter('resolution', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const estimatedFrames = this.getNodeParameter('estimatedFrames', i) as number;
			
			// Parse resolution for estimate
			const resMap: Record<string, { width: number; height: number }> = {
				'720p': { width: 1280, height: 720 },
				'1080p': { width: 1920, height: 1080 },
				'2k': { width: 2560, height: 1440 },
				'4k': { width: 3840, height: 2160 },
				'8k': { width: 7680, height: 4320 },
			};
			
			const result = await apiClient.estimateJobCost({
				resolution: resMap[resolution] || resMap['1080p'],
				quality: qualityPreset,
				frames: { start: 1, end: estimatedFrames },
			});
			return { success: result.success, estimate: result.data, error: result.error };
		}

		case 'getJobHistory': {
			const statusFilter = this.getNodeParameter('statusFilter', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.listJobs({
				status: statusFilter !== 'all' ? statusFilter : undefined,
				limit,
			});
			return { success: result.success, history: result.data, error: result.error };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
