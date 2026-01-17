/**
 * AI Compute Resource Actions
 * Operations for AI inference and training on Render Network
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const aiComputeOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['aiCompute'] } },
		options: [
			{ name: 'Submit Inference Job', value: 'submitInference', description: 'Submit AI inference job', action: 'Submit inference job' },
			{ name: 'Submit Training Job', value: 'submitTraining', description: 'Submit AI training job', action: 'Submit training job' },
			{ name: 'Get AI Job Status', value: 'getAiJobStatus', description: 'Get AI job status', action: 'Get AI job status' },
			{ name: 'Get Inference Results', value: 'getInferenceResults', description: 'Get inference results', action: 'Get inference results' },
			{ name: 'Get Model Info', value: 'getModelInfo', description: 'Get AI model information', action: 'Get model info' },
			{ name: 'List Available Models', value: 'listModels', description: 'List available AI models', action: 'List models' },
			{ name: 'Configure GPU Requirements', value: 'configureGpu', description: 'Configure GPU for AI job', action: 'Configure GPU' },
			{ name: 'Get AI Job Metrics', value: 'getAiJobMetrics', description: 'Get AI job metrics', action: 'Get AI job metrics' },
			{ name: 'Get Token Usage', value: 'getTokenUsage', description: 'Get token usage for job', action: 'Get token usage' },
			{ name: 'Estimate AI Cost', value: 'estimateAiCost', description: 'Estimate AI job cost', action: 'Estimate AI cost' },
			{ name: 'Get Supported Frameworks', value: 'getSupportedFrameworks', description: 'Get supported AI frameworks', action: 'Get supported frameworks' },
		],
		default: 'submitInference',
	},
];

export const aiComputeFields: INodeProperties[] = [
	{
		displayName: 'Job ID',
		name: 'jobId',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['aiCompute'], operation: ['getAiJobStatus', 'getInferenceResults', 'getAiJobMetrics', 'getTokenUsage'] } },
		default: '',
		description: 'AI job ID',
	},
	{
		displayName: 'Model ID',
		name: 'modelId',
		type: 'string',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference', 'submitTraining', 'getModelInfo'] } },
		default: '',
		description: 'AI model identifier',
	},
	{
		displayName: 'Input Data',
		name: 'inputData',
		type: 'json',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference'] } },
		default: '{}',
		description: 'Input data for inference (JSON)',
	},
	{
		displayName: 'Framework',
		name: 'framework',
		type: 'options',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference', 'submitTraining'] } },
		options: [
			{ name: 'PyTorch', value: 'pytorch' },
			{ name: 'TensorFlow', value: 'tensorflow' },
			{ name: 'JAX', value: 'jax' },
			{ name: 'ONNX', value: 'onnx' },
			{ name: 'Hugging Face', value: 'huggingface' },
		],
		default: 'pytorch',
		description: 'AI framework',
	},
	{
		displayName: 'GPU Type',
		name: 'gpuType',
		type: 'options',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference', 'submitTraining', 'configureGpu', 'estimateAiCost'] } },
		options: [
			{ name: 'RTX 4090', value: 'rtx4090' },
			{ name: 'A100', value: 'a100' },
			{ name: 'H100', value: 'h100' },
		],
		default: 'a100',
		description: 'GPU type for AI compute',
	},
	{
		displayName: 'Max Tokens',
		name: 'maxTokens',
		type: 'number',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference', 'estimateAiCost'] } },
		default: 1000,
		description: 'Maximum tokens for generation',
	},
	{
		displayName: 'Priority',
		name: 'priority',
		type: 'options',
		displayOptions: { show: { resource: ['aiCompute'], operation: ['submitInference', 'submitTraining'] } },
		options: [
			{ name: 'Low', value: 'low' },
			{ name: 'Normal', value: 'normal' },
			{ name: 'High', value: 'high' },
		],
		default: 'normal',
		description: 'Job priority',
	},
];

export async function executeAiComputeOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
		apiEndpoint: credentials.apiEndpoint as string,
	});

	switch (operation) {
		case 'submitInference': {
			const modelId = this.getNodeParameter('modelId', i) as string;
			const inputData = this.getNodeParameter('inputData', i) as string;
			const framework = this.getNodeParameter('framework', i) as string;
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const maxTokens = this.getNodeParameter('maxTokens', i) as number;
			const priority = this.getNodeParameter('priority', i) as string;

			const result = await apiClient.submitAIJob({
				modelId,
				framework,
				input: JSON.parse(inputData),
				gpuRequirements: { preferredGpu: gpuType },
				maxTokens,
				priority,
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'submitTraining': {
			const modelId = this.getNodeParameter('modelId', i) as string;
			const framework = this.getNodeParameter('framework', i) as string;
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const priority = this.getNodeParameter('priority', i) as string;

			const result = await apiClient.submitAIJob({
				modelId,
				framework,
				gpuRequirements: { preferredGpu: gpuType },
				priority,
				metadata: { type: 'training' },
			});
			return { success: result.success, job: result.data, error: result.error };
		}

		case 'getAiJobStatus': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getAIJobStatus(jobId);
			const data = result.data;
			return {
				success: result.success,
				jobId,
				status: data?.status || 'unknown',
				progress: data?.progress || 0,
				tokenUsage: data?.tokenUsage,
				error: result.error,
			};
		}

		case 'getInferenceResults': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getAIJobResults(jobId);
			const data = result.data;
			return {
				success: result.success,
				jobId,
				output: data?.output || null,
				tokenUsage: data?.tokenUsage || {},
				latency: data?.latency || 0,
				error: result.error,
			};
		}

		case 'getModelInfo': {
			const modelId = this.getNodeParameter('modelId', i) as string;
			const result = await apiClient.getModelInfo(modelId);
			return { success: result.success, model: result.data, error: result.error };
		}

		case 'listModels': {
			const result = await apiClient.listModels();
			return { success: result.success, models: result.data || [], error: result.error };
		}

		case 'configureGpu': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			return {
				success: true,
				configuration: {
					gpuType,
					recommended: gpuType === 'a100' || gpuType === 'h100',
					estimatedPerformance: gpuType === 'h100' ? 'excellent' : gpuType === 'a100' ? 'very good' : 'good',
				},
			};
		}

		case 'getAiJobMetrics': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getJobMetrics(jobId);
			return { success: result.success, metrics: result.data, error: result.error };
		}

		case 'getTokenUsage': {
			const jobId = this.getNodeParameter('jobId', i) as string;
			const result = await apiClient.getAIJobStatus(jobId);
			const data = result.data;
			return {
				success: result.success,
				jobId,
				tokenUsage: {
					input: data?.tokenUsage?.input || 0,
					output: data?.tokenUsage?.output || 0,
					total: data?.tokenUsage?.total || 0,
				},
				error: result.error,
			};
		}

		case 'estimateAiCost': {
			const gpuType = this.getNodeParameter('gpuType', i) as string;
			const maxTokens = this.getNodeParameter('maxTokens', i) as number;
			const pricingResult = await apiClient.getGpuPricing(gpuType);
			const pricing = pricingResult.data || {};
			const pricePerHour = (pricing as Record<string, number>)[gpuType] || 1.0;
			const estimatedHours = maxTokens / 10000; // Rough estimate
			return {
				success: true,
				estimate: {
					gpuType,
					maxTokens,
					estimatedHours,
					estimatedCost: estimatedHours * pricePerHour,
					pricePerHour,
				},
			};
		}

		case 'getSupportedFrameworks': {
			return {
				success: true,
				frameworks: [
					{ id: 'pytorch', name: 'PyTorch', version: '2.1+', supported: true },
					{ id: 'tensorflow', name: 'TensorFlow', version: '2.14+', supported: true },
					{ id: 'jax', name: 'JAX', version: '0.4+', supported: true },
					{ id: 'onnx', name: 'ONNX Runtime', version: '1.16+', supported: true },
					{ id: 'huggingface', name: 'Hugging Face Transformers', version: '4.35+', supported: true },
				],
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
