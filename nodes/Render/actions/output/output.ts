/**
 * Output Resource Actions
 * Operations for managing render outputs
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { OUTPUT_FORMATS } from '../../constants/formats';

export const outputOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['output'] } },
		options: [
			{ name: 'Get Output Info', value: 'getOutputInfo', description: 'Get output file information', action: 'Get output info' },
			{ name: 'Download Output', value: 'downloadOutput', description: 'Download output file', action: 'Download output' },
			{ name: 'Get Output URL', value: 'getOutputUrl', description: 'Get output download URL', action: 'Get output URL' },
			{ name: 'Get Output Formats', value: 'getOutputFormats', description: 'Get supported output formats', action: 'Get output formats' },
			{ name: 'Convert Output', value: 'convertOutput', description: 'Convert output format', action: 'Convert output' },
			{ name: 'Get Thumbnail', value: 'getThumbnail', description: 'Get output thumbnail', action: 'Get thumbnail' },
			{ name: 'Get Preview', value: 'getPreview', description: 'Get output preview', action: 'Get preview' },
			{ name: 'Stream Output', value: 'streamOutput', description: 'Get streaming URL', action: 'Stream output' },
			{ name: 'Get Storage Info', value: 'getStorageInfo', description: 'Get storage usage info', action: 'Get storage info' },
			{ name: 'Delete Output', value: 'deleteOutput', description: 'Delete output file', action: 'Delete output' },
		],
		default: 'getOutputInfo',
	},
];

export const outputFields: INodeProperties[] = [
	{
		displayName: 'Output ID',
		name: 'outputId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['output'], operation: ['getOutputInfo', 'downloadOutput', 'getOutputUrl', 'convertOutput', 'getThumbnail', 'getPreview', 'streamOutput', 'deleteOutput'] } },
		default: '',
		description: 'Output file identifier',
	},
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		displayOptions: { show: { resource: ['output'], operation: ['getOutputInfo'] } },
		default: '',
		description: 'Job ID (alternative to Output ID)',
	},
	{
		displayName: 'Target Format',
		name: 'targetFormat',
		type: 'options',
		displayOptions: { show: { resource: ['output'], operation: ['convertOutput'] } },
		options: [
			{ name: 'EXR', value: 'exr' },
			{ name: 'PNG', value: 'png' },
			{ name: 'JPEG', value: 'jpg' },
			{ name: 'TIFF', value: 'tiff' },
			{ name: 'MP4', value: 'mp4' },
			{ name: 'MOV', value: 'mov' },
			{ name: 'WebM', value: 'webm' },
		],
		default: 'png',
		description: 'Target format for conversion',
	},
	{
		displayName: 'URL Expiry (Hours)',
		name: 'urlExpiry',
		type: 'number',
		displayOptions: { show: { resource: ['output'], operation: ['getOutputUrl', 'downloadOutput'] } },
		default: 24,
		description: 'URL expiration time in hours',
	},
	{
		displayName: 'Thumbnail Width',
		name: 'thumbnailWidth',
		type: 'number',
		displayOptions: { show: { resource: ['output'], operation: ['getThumbnail'] } },
		default: 256,
		description: 'Thumbnail width in pixels',
	},
	{
		displayName: 'Thumbnail Height',
		name: 'thumbnailHeight',
		type: 'number',
		displayOptions: { show: { resource: ['output'], operation: ['getThumbnail'] } },
		default: 256,
		description: 'Thumbnail height in pixels',
	},
];

export async function executeOutputOperation(
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
		case 'getOutputInfo': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const jobId = this.getNodeParameter('jobId', i, '') as string;
			
			if (outputId) {
				const result = await apiClient.getOutputInfo(outputId);
				return { success: result.success, output: result.data, error: result.error };
			} else if (jobId) {
				const result = await apiClient.getJobOutputInfo(jobId);
				return { success: result.success, outputs: result.data || [], error: result.error };
			}
			throw new Error('Either Output ID or Job ID is required');
		}

		case 'downloadOutput': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const result = await apiClient.downloadOutput(outputId);
			const data = result.data;
			return {
				success: result.success,
				outputId,
				url: data?.url,
				expiresAt: data?.expiresAt,
				error: result.error,
			};
		}

		case 'getOutputUrl': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const urlExpiry = this.getNodeParameter('urlExpiry', i) as number;
			const result = await apiClient.getOutputUrl(outputId, { expiry: urlExpiry * 3600 });
			const data = result.data;
			return {
				success: result.success,
				outputId,
				url: data?.url,
				expiresAt: data?.expiresAt,
				error: result.error,
			};
		}

		case 'getOutputFormats': {
			const imageFormats = Object.entries(OUTPUT_FORMATS)
				.filter(([, value]) => value.type === 'image')
				.map(([key, value]) => ({ id: key, ...value }));
			const videoFormats = Object.entries(OUTPUT_FORMATS)
				.filter(([, value]) => value.type === 'video')
				.map(([key, value]) => ({ id: key, ...value }));
			return {
				success: true,
				imageFormats,
				videoFormats,
				totalFormats: Object.keys(OUTPUT_FORMATS).length,
			};
		}

		case 'convertOutput': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const targetFormat = this.getNodeParameter('targetFormat', i) as string;
			const result = await apiClient.convertOutput(outputId, targetFormat);
			return { success: result.success, conversion: result.data, error: result.error };
		}

		case 'getThumbnail': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const width = this.getNodeParameter('thumbnailWidth', i) as number;
			const height = this.getNodeParameter('thumbnailHeight', i) as number;
			const result = await apiClient.getThumbnail(outputId, { width, height });
			return { success: result.success, thumbnail: result.data, error: result.error };
		}

		case 'getPreview': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const result = await apiClient.getPreview(outputId);
			return { success: result.success, preview: result.data, error: result.error };
		}

		case 'streamOutput': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const result = await apiClient.getStreamUrl(outputId);
			return { success: result.success, stream: result.data, error: result.error };
		}

		case 'getStorageInfo': {
			const result = await apiClient.getStorageInfo();
			return { success: result.success, storage: result.data, error: result.error };
		}

		case 'deleteOutput': {
			const outputId = this.getNodeParameter('outputId', i) as string;
			const result = await apiClient.deleteOutput(outputId);
			return { success: result.success, deleted: result.data, error: result.error };
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
