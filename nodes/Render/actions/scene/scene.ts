/**
 * Scene Resource Actions
 * Operations for 3D scene management
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { RENDER_ENGINES } from '../../constants/formats';

export const sceneOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['scene'] } },
		options: [
			{ name: 'Upload Scene', value: 'uploadScene', description: 'Upload a 3D scene file', action: 'Upload scene' },
			{ name: 'Get Scene Info', value: 'getSceneInfo', description: 'Get scene information', action: 'Get scene info' },
			{ name: 'Validate Scene', value: 'validateScene', description: 'Validate scene file', action: 'Validate scene' },
			{ name: 'Get Scene Assets', value: 'getSceneAssets', description: 'Get scene assets list', action: 'Get scene assets' },
			{ name: 'Update Scene', value: 'updateScene', description: 'Update scene metadata', action: 'Update scene' },
			{ name: 'Delete Scene', value: 'deleteScene', description: 'Delete a scene', action: 'Delete scene' },
			{ name: 'Get Scene Requirements', value: 'getSceneRequirements', description: 'Get render requirements', action: 'Get scene requirements' },
			{ name: 'Estimate Scene Cost', value: 'estimateSceneCost', description: 'Estimate render cost', action: 'Estimate scene cost' },
			{ name: 'Get Supported Plugins', value: 'getSupportedPlugins', description: 'Get supported plugins', action: 'Get supported plugins' },
			{ name: 'Get Scene History', value: 'getSceneHistory', description: 'Get scene change history', action: 'Get scene history' },
		],
		default: 'getSceneInfo',
	},
];

export const sceneFields: INodeProperties[] = [
	{
		displayName: 'Scene ID',
		name: 'sceneId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['scene'], operation: ['getSceneInfo', 'validateScene', 'getSceneAssets', 'updateScene', 'deleteScene', 'getSceneRequirements', 'estimateSceneCost', 'getSceneHistory'] } },
		default: '',
		description: 'Scene identifier',
	},
	{
		displayName: 'Scene File',
		name: 'sceneFile',
		type: 'string',
		displayOptions: { show: { resource: ['scene'], operation: ['uploadScene'] } },
		default: '',
		description: 'Scene file URL or base64 data',
	},
	{
		displayName: 'Scene Name',
		name: 'sceneName',
		type: 'string',
		displayOptions: { show: { resource: ['scene'], operation: ['uploadScene', 'updateScene'] } },
		default: '',
		description: 'Scene name',
	},
	{
		displayName: 'Render Engine',
		name: 'renderEngine',
		type: 'options',
		displayOptions: { show: { resource: ['scene'], operation: ['uploadScene', 'estimateSceneCost'] } },
		options: [
			{ name: 'OctaneRender', value: 'octane' },
			{ name: 'Cycles', value: 'cycles' },
			{ name: 'Redshift', value: 'redshift' },
			{ name: 'Arnold', value: 'arnold' },
		],
		default: 'octane',
		description: 'Render engine',
	},
	{
		displayName: 'Quality',
		name: 'quality',
		type: 'options',
		displayOptions: { show: { resource: ['scene'], operation: ['estimateSceneCost'] } },
		options: [
			{ name: 'Draft', value: 'draft' },
			{ name: 'Preview', value: 'preview' },
			{ name: 'Production', value: 'production' },
			{ name: 'Final', value: 'final' },
		],
		default: 'production',
		description: 'Render quality',
	},
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['scene'], operation: ['estimateSceneCost'] } },
		options: [
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'RTX 3090', value: 'rtx3090' },
			{ name: 'A100', value: 'a100' },
		],
		default: 'rtx4090',
		description: 'GPU type for estimate',
	},
];

export async function executeSceneOperation(
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
		case 'uploadScene': {
			const sceneFile = this.getNodeParameter('sceneFile', i) as string;
			const sceneName = this.getNodeParameter('sceneName', i) as string;
			const renderEngine = this.getNodeParameter('renderEngine', i) as string;
			
			// Handle file upload (simplified - assumes URL or base64)
			const fileBuffer = Buffer.from(sceneFile, 'base64');
			const result = await apiClient.uploadScene(fileBuffer, sceneName || 'scene.orbx', {
				renderEngine,
			});
			const data = result.data;
			return {
				success: result.success,
				sceneId: data?.sceneId,
				uploadUrl: data?.uploadUrl,
				error: result.error,
			};
		}

		case 'getSceneInfo': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.getSceneInfo(sceneId);
			return { success: result.success, scene: result.data, error: result.error };
		}

		case 'validateScene': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.validateScene(sceneId);
			const data = result.data;
			return {
				success: result.success,
				sceneId,
				valid: data?.valid || false,
				errors: data?.errors || [],
				warnings: data?.warnings || [],
				error: result.error,
			};
		}

		case 'getSceneAssets': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.getSceneAssets(sceneId);
			return { success: result.success, assets: result.data || [], error: result.error };
		}

		case 'updateScene': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const sceneName = this.getNodeParameter('sceneName', i) as string;
			const result = await apiClient.updateScene(sceneId, { name: sceneName });
			return { success: result.success, updated: result.data, error: result.error };
		}

		case 'deleteScene': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.deleteScene(sceneId);
			return { success: result.success, deleted: result.data, error: result.error };
		}

		case 'getSceneRequirements': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.getSceneRequirements(sceneId);
			return { success: result.success, requirements: result.data, error: result.error };
		}

		case 'estimateSceneCost': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const quality = this.getNodeParameter('quality', i) as string;
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const result = await apiClient.estimateSceneCost(sceneId, { quality, gpuType });
			return { success: result.success, estimate: result.data, error: result.error };
		}

		case 'getSupportedPlugins': {
			const engines = Object.entries(RENDER_ENGINES)
				.filter(([, value]) => value.supported)
				.map(([key, value]) => ({
					id: key,
					name: value.name,
					version: value.version,
					gpuRequired: value.gpuRequired,
				}));
			return {
				success: true,
				plugins: engines,
				total: engines.length,
			};
		}

		case 'getSceneHistory': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.getSceneHistory(sceneId);
			return { success: result.success, history: result.data || [], error: result.error };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
