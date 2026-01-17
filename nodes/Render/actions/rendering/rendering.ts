import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { JobClient } from '../../transport/jobClient';

export const renderingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['rendering'] } },
		options: [
			{ name: 'Submit 3D Render Job', value: 'submit3DRender', description: 'Submit a 3D rendering job', action: 'Submit 3d render job' },
			{ name: 'Submit Animation Job', value: 'submitAnimation', description: 'Submit an animation job', action: 'Submit animation job' },
			{ name: 'Submit Scene Job', value: 'submitScene', description: 'Submit a scene-based job', action: 'Submit scene job' },
			{ name: 'Get Render Progress', value: 'getRenderProgress', description: 'Get rendering progress', action: 'Get render progress' },
			{ name: 'Get Frame Status', value: 'getFrameStatus', description: 'Get status of frames', action: 'Get frame status' },
			{ name: 'Download Rendered Frames', value: 'downloadFrames', description: 'Download rendered frames', action: 'Download rendered frames' },
			{ name: 'Get Render Statistics', value: 'getRenderStats', description: 'Get rendering statistics', action: 'Get render statistics' },
			{ name: 'Set Render Quality', value: 'setRenderQuality', description: 'Configure render quality', action: 'Set render quality' },
			{ name: 'Set Output Format', value: 'setOutputFormat', description: 'Configure output format', action: 'Set output format' },
			{ name: 'Get Supported Formats', value: 'getSupportedFormats', description: 'Get supported file formats', action: 'Get supported formats' },
			{ name: 'Validate Scene File', value: 'validateScene', description: 'Validate scene file', action: 'Validate scene file' },
		],
		default: 'submit3DRender',
	},
];

export const renderingFields: INodeProperties[] = [
	// Job ID for progress/status operations
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['rendering'], operation: ['getRenderProgress', 'getFrameStatus', 'downloadFrames', 'getRenderStats', 'setRenderQuality', 'setOutputFormat'] } },
		default: '',
		description: 'The render job ID',
	},
	// 3D Render fields
	{
		displayName: 'Scene File URL',
		name: 'sceneFileUrl',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitScene', 'validateScene'] } },
		default: '',
		description: 'URL of the scene file',
	},
	{
		displayName: 'Render Engine',
		name: 'renderEngine',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'] } },
		options: [
			{ name: 'OctaneRender', value: 'octane' },
			{ name: 'Blender Cycles', value: 'cycles' },
			{ name: 'Redshift', value: 'redshift' },
			{ name: 'Arnold', value: 'arnold' },
			{ name: 'V-Ray', value: 'vray' },
			{ name: 'Corona', value: 'corona' },
		],
		default: 'octane',
		description: 'Rendering engine to use',
	},
	{
		displayName: 'Output Format',
		name: 'outputFormat',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'] } },
		options: [
			{ name: 'OpenEXR (.exr)', value: 'exr' },
			{ name: 'PNG (.png)', value: 'png' },
			{ name: 'JPEG (.jpg)', value: 'jpg' },
			{ name: 'TIFF (.tiff)', value: 'tiff' },
		],
		default: 'exr',
		description: 'Output image format',
	},
	{
		displayName: 'Resolution Preset',
		name: 'resolutionPreset',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'] } },
		options: [
			{ name: 'HD (1280×720)', value: '720p' },
			{ name: 'Full HD (1920×1080)', value: '1080p' },
			{ name: '2K (2560×1440)', value: '2k' },
			{ name: '4K UHD (3840×2160)', value: '4k' },
			{ name: '8K (7680×4320)', value: '8k' },
			{ name: 'Custom', value: 'custom' },
		],
		default: '1080p',
		description: 'Output resolution preset',
	},
	{
		displayName: 'Custom Width',
		name: 'customWidth',
		type: 'number',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'], resolutionPreset: ['custom'] } },
		default: 1920,
		description: 'Custom width in pixels',
	},
	{
		displayName: 'Custom Height',
		name: 'customHeight',
		type: 'number',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'], resolutionPreset: ['custom'] } },
		default: 1080,
		description: 'Custom height in pixels',
	},
	{
		displayName: 'Quality Preset',
		name: 'qualityPreset',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene', 'setRenderQuality'] } },
		options: [
			{ name: 'Draft (Fast)', value: 'draft' },
			{ name: 'Preview', value: 'preview' },
			{ name: 'Production', value: 'production' },
			{ name: 'High Quality', value: 'highQuality' },
			{ name: 'Ultra (Maximum)', value: 'ultra' },
		],
		default: 'production',
		description: 'Rendering quality level',
	},
	{
		displayName: 'Samples',
		name: 'samples',
		type: 'number',
		typeOptions: { minValue: 16, maxValue: 65536 },
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation'] } },
		default: 512,
		description: 'Number of render samples',
	},
	// Animation-specific fields
	{
		displayName: 'Start Frame',
		name: 'startFrame',
		type: 'number',
		displayOptions: { show: { resource: ['rendering'], operation: ['submitAnimation'] } },
		default: 1,
		description: 'Animation start frame',
	},
	{
		displayName: 'End Frame',
		name: 'endFrame',
		type: 'number',
		displayOptions: { show: { resource: ['rendering'], operation: ['submitAnimation'] } },
		default: 250,
		description: 'Animation end frame',
	},
	{
		displayName: 'Frame Rate',
		name: 'frameRate',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submitAnimation'] } },
		options: [
			{ name: '24 FPS (Film)', value: 24 },
			{ name: '25 FPS (PAL)', value: 25 },
			{ name: '30 FPS (NTSC)', value: 30 },
			{ name: '60 FPS', value: 60 },
			{ name: '120 FPS', value: 120 },
		],
		default: 24,
		description: 'Animation frame rate',
	},
	{
		displayName: 'Enable Motion Blur',
		name: 'motionBlur',
		type: 'boolean',
		displayOptions: { show: { resource: ['rendering'], operation: ['submitAnimation'] } },
		default: true,
		description: 'Whether to enable motion blur',
	},
	// GPU selection
	{
		displayName: 'GPU Preference',
		name: 'gpuPreference',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'] } },
		options: [
			{ name: 'Any Available', value: 'any' },
			{ name: 'RTX 4090 (Best)', value: 'rtx4090' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'RTX 3080', value: 'rtx3080' },
			{ name: 'A100 (Data Center)', value: 'a100' },
			{ name: 'H100 (Latest)', value: 'h100' },
		],
		default: 'any',
		description: 'Preferred GPU type',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['submit3DRender', 'submitAnimation', 'submitScene'] } },
		options: [
			{ name: 'Economy (Cheapest)', value: 'economy' },
			{ name: 'Standard', value: 'standard' },
			{ name: 'Priority (Faster)', value: 'priority' },
			{ name: 'Rush (Fastest)', value: 'rush' },
		],
		default: 'standard',
		description: 'Job priority level',
	},
	// Frame download options
	{
		displayName: 'Frame Numbers',
		name: 'frameNumbers',
		type: 'string',
		displayOptions: { show: { resource: ['rendering'], operation: ['downloadFrames', 'getFrameStatus'] } },
		default: '',
		placeholder: '1,2,5-10',
		description: 'Frame numbers to download (comma-separated or ranges)',
	},
	// Set output format fields
	{
		displayName: 'New Output Format',
		name: 'newOutputFormat',
		type: 'options',
		displayOptions: { show: { resource: ['rendering'], operation: ['setOutputFormat'] } },
		options: [
			{ name: 'OpenEXR', value: 'exr' },
			{ name: 'PNG', value: 'png' },
			{ name: 'JPEG', value: 'jpg' },
			{ name: 'TIFF', value: 'tiff' },
		],
		default: 'exr',
		description: 'New output format to set',
	},
];

export async function executeRenderingOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});
	const jobClient = new JobClient(apiClient);

	// Resolution preset mapping
	const resolutionMap: Record<string, { width: number; height: number }> = {
		'720p': { width: 1280, height: 720 },
		'1080p': { width: 1920, height: 1080 },
		'2k': { width: 2560, height: 1440 },
		'4k': { width: 3840, height: 2160 },
		'8k': { width: 7680, height: 4320 },
	};

	switch (operation) {
		case 'submit3DRender': {
			const sceneFileUrl = this.getNodeParameter('sceneFileUrl', i) as string;
			const renderEngine = this.getNodeParameter('renderEngine', i) as string;
			const outputFormat = this.getNodeParameter('outputFormat', i) as string;
			const resolutionPreset = this.getNodeParameter('resolutionPreset', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const gpuPreference = this.getNodeParameter('gpuPreference', i) as string;
			const priority = this.getNodeParameter('priority', i) as string;

			const result = await apiClient.createJob({
				sceneUrl: sceneFileUrl,
				engine: renderEngine,
				outputFormat,
				resolution: resolutionMap[resolutionPreset] || resolutionMap['1080p'],
				quality: qualityPreset,
				gpuPreference,
				priority: priority as 'low' | 'normal' | 'high' | 'priority',
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'submitAnimation': {
			const sceneFileUrl = this.getNodeParameter('sceneFileUrl', i) as string;
			const renderEngine = this.getNodeParameter('renderEngine', i) as string;
			const outputFormat = this.getNodeParameter('outputFormat', i) as string;
			const resolutionPreset = this.getNodeParameter('resolutionPreset', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const startFrame = this.getNodeParameter('startFrame', i) as number;
			const endFrame = this.getNodeParameter('endFrame', i) as number;
			const gpuPreference = this.getNodeParameter('gpuPreference', i) as string;
			const priority = this.getNodeParameter('priority', i) as string;

			const result = await apiClient.createJob({
				sceneUrl: sceneFileUrl,
				engine: renderEngine,
				outputFormat,
				resolution: resolutionMap[resolutionPreset] || resolutionMap['1080p'],
				quality: qualityPreset,
				frames: { start: startFrame, end: endFrame },
				gpuPreference,
				priority: priority as 'low' | 'normal' | 'high' | 'priority',
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'submitScene': {
			const sceneFileUrl = this.getNodeParameter('sceneFileUrl', i) as string;
			const renderEngine = this.getNodeParameter('renderEngine', i) as string;
			const outputFormat = this.getNodeParameter('outputFormat', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const gpuPreference = this.getNodeParameter('gpuPreference', i) as string;
			const priority = this.getNodeParameter('priority', i) as string;

			const result = await apiClient.createJob({
				sceneUrl: sceneFileUrl,
				engine: renderEngine,
				outputFormat,
				quality: qualityPreset,
				gpuPreference,
				priority: priority as 'low' | 'normal' | 'high' | 'priority',
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'getRenderProgress': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await jobClient.getJobProgress(jobId);
			return { 
				success: result.success, 
				progress: result.progress || {},
				error: result.error,
			};
		}

		case 'getFrameStatus': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const frameNumbers = this.getNodeParameter('frameNumbers', i) as string;
			const frames = frameNumbers ? frameNumbers.split(',').map(f => f.trim()) : undefined;
			const result = await jobClient.getFrameStatuses(jobId, frames);
			return { 
				success: result.success, 
				frames: result.frames || [],
				error: result.error,
			};
		}

		case 'downloadFrames': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const frameNumbers = this.getNodeParameter('frameNumbers', i) as string;
			const resultsResponse = await apiClient.getJobResults(jobId);
			const outputs = resultsResponse.data?.outputs || [];
			const frames = frameNumbers ? frameNumbers.split(',').map(f => f.trim()) : [];
			const filteredResults = frames.length > 0
				? outputs.filter((r: { url: string; format: string; size: number }) => frames.some(f => r.url.includes(f)))
				: outputs;
			return { success: true, downloads: filteredResults };
		}

		case 'getRenderStats': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const jobResponse = await apiClient.getJob(jobId);
			const progressResult = await apiClient.getJobProgress(jobId);
			const jobData = jobResponse.data;
			const progressData = progressResult.data;
			return { 
				success: true, 
				statistics: {
					totalFrames: progressData?.totalFrames || 0,
					completedFrames: progressData?.currentFrame || 0,
					progress: progressData?.progress || 0,
					failedFrames: 0,
					averageRenderTime: jobData?.frames?.completed || 0,
					totalRenderTime: 0,
					gpuHoursUsed: 0,
				}
			};
		}

		case 'setRenderQuality': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const qualityPreset = this.getNodeParameter('qualityPreset', i) as string;
			const result = await apiClient.updateJobSettings(jobId, { qualityPreset });
			return { success: result.success, updated: result.data, error: result.error };
		}

		case 'setOutputFormat': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const newOutputFormat = this.getNodeParameter('newOutputFormat', i) as string;
			const result = await apiClient.updateJobSettings(jobId, { outputFormat: newOutputFormat });
			return { success: result.success, updated: result.data, error: result.error };
		}

		case 'getSupportedFormats': {
			return {
				success: true,
				sceneFormats: ['orbx', 'ocs', 'blend', 'c4d', 'ma', 'mb', 'max', 'hip', 'usd', 'usda', 'usdc', 'usdz', 'fbx', 'obj', 'gltf', 'glb'],
				outputFormats: ['exr', 'png', 'jpg', 'jpeg', 'tiff', 'tif'],
				renderEngines: ['octane', 'cycles', 'redshift', 'arnold', 'vray', 'corona'],
			};
		}

		case 'validateScene': {
			const sceneFileUrl = this.getNodeParameter('sceneFileUrl', i) as string;
			const result = await apiClient.validateScene(sceneFileUrl);
			return { success: true, validation: result };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
