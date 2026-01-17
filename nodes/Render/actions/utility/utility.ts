/**
 * Utility Resource Actions
 * General utility operations for Render Network
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';
import { RENDER_RESOLUTIONS, OUTPUT_FORMATS, RENDER_ENGINES } from '../../constants';
import { renderToOb, obToRender, solToLamports, lamportsToSol } from '../../utils';
import * as crypto from 'crypto';

export const utilityOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['utility'] } },
		options: [
			{ name: 'Convert Units', value: 'convertUnits', description: 'Convert between RENDER/OB/SOL units', action: 'Convert units' },
			{ name: 'Sign Message', value: 'signMessage', description: 'Sign a message with wallet', action: 'Sign message' },
			{ name: 'Verify Signature', value: 'verifySignature', description: 'Verify a signed message', action: 'Verify signature' },
			{ name: 'Get Network Status', value: 'getNetworkStatus', description: 'Get Render Network status', action: 'Get network status' },
			{ name: 'Get API Status', value: 'getApiStatus', description: 'Get API health status', action: 'Get API status' },
			{ name: 'Validate Job Config', value: 'validateJobConfig', description: 'Validate job configuration', action: 'Validate job config' },
			{ name: 'Parse Scene File', value: 'parseSceneFile', description: 'Parse and analyze scene file', action: 'Parse scene file' },
			{ name: 'Calculate Hash', value: 'calculateHash', description: 'Calculate file or data hash', action: 'Calculate hash' },
			{ name: 'Get Supported Features', value: 'getSupportedFeatures', description: 'Get supported features list', action: 'Get supported features' },
			{ name: 'Get Version Info', value: 'getVersionInfo', description: 'Get version information', action: 'Get version info' },
		],
		default: 'convertUnits',
	},
];

export const utilityFields: INodeProperties[] = [
	{
		displayName: 'Conversion Type',
		name: 'conversionType',
		type: 'options',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
		options: [
			{ name: 'RENDER to OB', value: 'renderToOb' },
			{ name: 'OB to RENDER', value: 'obToRender' },
			{ name: 'SOL to Lamports', value: 'solToLamports' },
			{ name: 'Lamports to SOL', value: 'lamportsToSol' },
		],
		default: 'renderToOb',
		description: 'Type of unit conversion',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		displayOptions: { show: { resource: ['utility'], operation: ['convertUnits'] } },
		default: 1,
		description: 'Amount to convert',
	},
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['signMessage'] } },
		default: '',
		description: 'Wallet address for signing',
	},
	{
		displayName: 'Message',
		name: 'message',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['signMessage', 'verifySignature'] } },
		default: '',
		description: 'Message to sign or verify',
	},
	{
		displayName: 'Signature',
		name: 'signature',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['verifySignature'] } },
		default: '',
		description: 'Signature to verify',
	},
	{
		displayName: 'Public Key',
		name: 'publicKey',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['verifySignature'] } },
		default: '',
		description: 'Public key of the signer',
	},
	{
		displayName: 'Job Configuration',
		name: 'jobConfig',
		type: 'json',
		displayOptions: { show: { resource: ['utility'], operation: ['validateJobConfig'] } },
		default: '{}',
		description: 'Job configuration JSON to validate',
	},
	{
		displayName: 'Scene ID',
		name: 'sceneId',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['parseSceneFile'] } },
		default: '',
		description: 'Scene ID to parse',
	},
	{
		displayName: 'Data',
		name: 'data',
		type: 'string',
		displayOptions: { show: { resource: ['utility'], operation: ['calculateHash'] } },
		default: '',
		description: 'Data to hash',
	},
	{
		displayName: 'Hash Algorithm',
		name: 'hashAlgorithm',
		type: 'options',
		displayOptions: { show: { resource: ['utility'], operation: ['calculateHash'] } },
		options: [
			{ name: 'SHA256', value: 'sha256' },
			{ name: 'SHA512', value: 'sha512' },
			{ name: 'MD5', value: 'md5' },
		],
		default: 'sha256',
		description: 'Hash algorithm to use',
	},
];

// Helper to convert objects to arrays
function objectToArray<T>(obj: Record<string, T>): Array<T & { id: string }> {
	return Object.entries(obj).map(([id, value]) => ({ ...value, id }));
}

export async function executeUtilityOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});

	switch (operation) {
		case 'convertUnits': {
			const conversionType = this.getNodeParameter('conversionType', i) as string;
			const amount = this.getNodeParameter('amount', i) as number;
			
			let result: number;
			let fromUnit: string;
			let toUnit: string;
			
			switch (conversionType) {
				case 'renderToOb':
					result = renderToOb(amount);
					fromUnit = 'RENDER';
					toUnit = 'OB';
					break;
				case 'obToRender':
					result = obToRender(amount);
					fromUnit = 'OB';
					toUnit = 'RENDER';
					break;
				case 'solToLamports':
					result = solToLamports(amount);
					fromUnit = 'SOL';
					toUnit = 'Lamports';
					break;
				case 'lamportsToSol':
					result = lamportsToSol(amount);
					fromUnit = 'Lamports';
					toUnit = 'SOL';
					break;
				default:
					throw new Error(`Unknown conversion type: ${conversionType}`);
			}
			
			return {
				success: true,
				input: amount,
				output: result,
				fromUnit,
				toUnit,
				conversionType,
			};
		}

		case 'signMessage': {
			const message = this.getNodeParameter('message', i) as string;
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.signMessage(message, walletAddress);
			const data = result.data;
			return {
				success: result.success,
				message,
				walletAddress,
				signature: data?.signature || '',
				publicKey: data?.publicKey || '',
				error: result.error,
			};
		}

		case 'verifySignature': {
			const message = this.getNodeParameter('message', i) as string;
			const signature = this.getNodeParameter('signature', i) as string;
			const publicKey = this.getNodeParameter('publicKey', i) as string;
			const result = await apiClient.verifySignature(message, signature, publicKey);
			const data = result.data;
			return {
				success: result.success,
				message,
				signature,
				publicKey,
				isValid: data?.valid || false,
				error: result.error,
			};
		}

		case 'getNetworkStatus': {
			const result = await apiClient.getNetworkStatus();
			const data = result.data;
			return {
				success: result.success,
				status: data?.status || 'unknown',
				latency: data?.latency || 0,
				lastBlock: data?.lastBlock || 0,
				error: result.error,
			};
		}

		case 'getApiStatus': {
			const result = await apiClient.getApiStatus();
			const data = result.data;
			return {
				success: result.success,
				apiStatus: data?.status || 'unknown',
				version: data?.version || '',
				error: result.error,
			};
		}

		case 'validateJobConfig': {
			const jobConfigStr = this.getNodeParameter('jobConfig', i) as string;
			let jobConfig: Record<string, unknown>;
			try {
				jobConfig = JSON.parse(jobConfigStr) as Record<string, unknown>;
			} catch {
				return {
					success: false,
					valid: false,
					errors: ['Invalid JSON format'],
				};
			}
			
			const result = await apiClient.validateJobConfig(jobConfig as IDataObject);
			const data = result.data;
			return {
				success: result.success,
				valid: data?.valid || false,
				errors: data?.errors || [],
				warnings: data?.warnings || [],
				error: result.error,
			};
		}

		case 'parseSceneFile': {
			const sceneId = this.getNodeParameter('sceneId', i) as string;
			const result = await apiClient.parseSceneFile(sceneId);
			const data = result.data;
			return {
				success: result.success,
				sceneId,
				format: data?.format || '',
				objects: data?.objects || 0,
				materials: data?.materials || 0,
				textures: data?.textures || 0,
				animations: data?.animations || 0,
				estimatedRenderTime: data?.estimatedRenderTime || 0,
				error: result.error,
			};
		}

		case 'calculateHash': {
			const data = this.getNodeParameter('data', i) as string;
			const hashAlgorithm = this.getNodeParameter('hashAlgorithm', i) as string;
			
			const hash = crypto.createHash(hashAlgorithm).update(data).digest('hex');
			
			return {
				success: true,
				data: data.substring(0, 50) + (data.length > 50 ? '...' : ''),
				algorithm: hashAlgorithm,
				hash,
				length: hash.length,
			};
		}

		case 'getSupportedFeatures': {
			const resolutionsArray = objectToArray(RENDER_RESOLUTIONS);
			const formatsArray = objectToArray(OUTPUT_FORMATS);
			const enginesArray = objectToArray(RENDER_ENGINES);
			
			return {
				success: true,
				resolutions: resolutionsArray.map(r => ({ id: r.id, name: r.name, width: r.width, height: r.height })),
				outputFormats: formatsArray.map(f => ({ id: f.id, name: f.name, extension: f.extension })),
				renderEngines: enginesArray.map(e => ({ id: e.id, name: e.name, version: e.version })),
				supportedSceneFormats: ['.blend', '.c4d', '.max', '.ma', '.mb', '.obj', '.fbx'],
				supportedGpuTypes: ['rtx3080', 'rtx3090', 'rtx4080', 'rtx4090', 'a100', 'h100'],
			};
		}

		case 'getVersionInfo': {
			const result = await apiClient.getApiStatus();
			const data = result.data;
			const enginesArray = objectToArray(RENDER_ENGINES);
			
			const engineVersions: Record<string, string> = {};
			enginesArray.forEach(e => {
				engineVersions[e.id] = e.version;
			});
			
			return {
				success: result.success,
				nodeVersion: '1.0.0',
				apiVersion: data?.version || 'unknown',
				network: 'solana-mainnet',
				tokenStandard: 'SPL',
				renderEngineVersions: engineVersions,
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
