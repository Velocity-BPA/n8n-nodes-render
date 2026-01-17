/**
 * Job Client for Render Network
 * Specialized client for managing render and AI compute jobs
 */

import { RenderApiClient, JobCreateParams, AIJobParams, JobInfo } from './renderApi';

export interface RenderJobConfig {
	sceneId: string;
	engine?: 'octane' | 'cycles' | 'redshift' | 'arnold';
	quality?: 'draft' | 'preview' | 'production' | 'highQuality' | 'ultra';
	outputFormat?: string;
	resolution?: {
		width: number;
		height: number;
	};
	frames?: {
		start: number;
		end: number;
		step?: number;
	};
	samples?: number;
	maxBounces?: number;
	denoising?: boolean;
	priority?: 'low' | 'normal' | 'high' | 'priority';
	gpuPreference?: string;
	maxCost?: number;
	timeout?: number;
	callback?: string;
}

export interface AnimationJobConfig extends RenderJobConfig {
	fps?: number;
	motionBlur?: boolean;
	motionBlurSamples?: number;
	outputVideo?: boolean;
	videoCodec?: 'h264' | 'h265' | 'prores';
}

export interface AIInferenceConfig {
	modelId: string;
	input: unknown;
	maxTokens?: number;
	temperature?: number;
	topP?: number;
	topK?: number;
	stopSequences?: string[];
	stream?: boolean;
	gpuRequirements?: {
		minVram?: number;
		preferredGpu?: string;
		count?: number;
	};
	timeout?: number;
	priority?: string;
}

export interface AITrainingConfig {
	modelId: string;
	datasetId: string;
	epochs?: number;
	batchSize?: number;
	learningRate?: number;
	optimizer?: string;
	gpuRequirements?: {
		minVram?: number;
		preferredGpu?: string;
		count?: number;
	};
	checkpointInterval?: number;
	validationSplit?: number;
}

export interface JobProgress {
	jobId: string;
	status: string;
	progress: number;
	currentFrame?: number;
	totalFrames?: number;
	estimatedTimeRemaining?: number;
	currentNode?: string;
}

export interface FrameInfo {
	frameNumber: number;
	status: 'pending' | 'rendering' | 'completed' | 'failed';
	renderTime?: number;
	outputUrl?: string;
	error?: string;
}

export class JobClient {
	private apiClient: RenderApiClient;

	constructor(apiClient: RenderApiClient) {
		this.apiClient = apiClient;
	}

	// ============ Render Jobs ============

	/**
	 * Submit a 3D render job
	 */
	async submitRenderJob(config: RenderJobConfig): Promise<{
		success: boolean;
		job?: JobInfo;
		error?: string;
	}> {
		const params: JobCreateParams = {
			sceneId: config.sceneId,
			engine: config.engine || 'octane',
			quality: config.quality || 'production',
			outputFormat: config.outputFormat || 'exr',
			resolution: config.resolution,
			frames: config.frames,
			priority: config.priority || 'normal',
			gpuPreference: config.gpuPreference,
			maxCost: config.maxCost,
			metadata: {
				samples: config.samples,
				maxBounces: config.maxBounces,
				denoising: config.denoising,
				timeout: config.timeout,
				callback: config.callback,
			},
		};

		const result = await this.apiClient.createJob(params);
		return {
			success: result.success,
			job: result.data,
			error: result.error,
		};
	}

	/**
	 * Submit an animation render job
	 */
	async submitAnimationJob(config: AnimationJobConfig): Promise<{
		success: boolean;
		job?: JobInfo;
		error?: string;
	}> {
		const params: JobCreateParams = {
			sceneId: config.sceneId,
			engine: config.engine || 'octane',
			quality: config.quality || 'production',
			outputFormat: config.outputFormat || 'exr',
			resolution: config.resolution,
			frames: config.frames,
			priority: config.priority || 'normal',
			gpuPreference: config.gpuPreference,
			maxCost: config.maxCost,
			metadata: {
				type: 'animation',
				fps: config.fps || 24,
				motionBlur: config.motionBlur,
				motionBlurSamples: config.motionBlurSamples,
				outputVideo: config.outputVideo,
				videoCodec: config.videoCodec,
				samples: config.samples,
				maxBounces: config.maxBounces,
				denoising: config.denoising,
			},
		};

		const result = await this.apiClient.createJob(params);
		return {
			success: result.success,
			job: result.data,
			error: result.error,
		};
	}

	/**
	 * Get job progress with detailed frame information
	 */
	async getJobProgress(jobId: string): Promise<{
		success: boolean;
		progress?: JobProgress;
		error?: string;
	}> {
		const result = await this.apiClient.getJob(jobId);
		
		if (!result.success || !result.data) {
			return { success: false, error: result.error };
		}

		const job = result.data;
		const progress: JobProgress = {
			jobId: job.id,
			status: job.status,
			progress: job.progress,
			currentFrame: job.frames?.completed,
			totalFrames: job.frames?.total,
			currentNode: job.nodeId,
		};

		// Calculate estimated time if job is in progress
		if (job.status === 'rendering' && job.startedAt && job.frames) {
			const elapsed = Date.now() - new Date(job.startedAt).getTime();
			const framesCompleted = job.frames.completed || 1;
			const framesRemaining = job.frames.total - framesCompleted;
			const timePerFrame = elapsed / framesCompleted;
			progress.estimatedTimeRemaining = Math.round((framesRemaining * timePerFrame) / 1000);
		}

		return { success: true, progress };
	}

	/**
	 * Get frame-by-frame status
	 */
	async getFrameStatuses(jobId: string, frameNumbers?: string[]): Promise<{
		success: boolean;
		frames?: FrameInfo[];
		error?: string;
	}> {
		// This would call a specific endpoint for frame details
		const result = await this.apiClient.getJob(jobId);
		
		if (!result.success || !result.data) {
			return { success: false, error: result.error };
		}

		// Generate frame info based on job progress
		const job = result.data;
		const frames: FrameInfo[] = [];
		
		// Parse requested frame numbers if provided
		const requestedFrames = frameNumbers 
			? new Set(frameNumbers.map(f => parseInt(f, 10)))
			: null;
		
		if (job.frames) {
			for (let i = 0; i < job.frames.total; i++) {
				const frameNum = i + 1;
				
				// Skip if specific frames were requested and this isn't one of them
				if (requestedFrames && !requestedFrames.has(frameNum)) {
					continue;
				}
				
				let status: FrameInfo['status'] = 'pending';
				if (i < (job.frames.completed || 0)) {
					status = 'completed';
				} else if (i < (job.frames.completed || 0) + 1 && job.status === 'rendering') {
					status = 'rendering';
				}
				
				frames.push({
					frameNumber: frameNum,
					status,
				});
			}
		}

		return { success: true, frames };
	}

	/**
	 * Estimate job cost before submission
	 */
	async estimateCost(config: RenderJobConfig): Promise<{
		success: boolean;
		estimate?: {
			estimated: number;
			min: number;
			max: number;
			currency: string;
			breakdown?: {
				gpuCost: number;
				priorityCost: number;
				storageCost: number;
			};
		};
		error?: string;
	}> {
		const params: JobCreateParams = {
			sceneId: config.sceneId,
			engine: config.engine,
			quality: config.quality,
			outputFormat: config.outputFormat,
			resolution: config.resolution,
			frames: config.frames,
			priority: config.priority,
			gpuPreference: config.gpuPreference,
		};

		const result = await this.apiClient.estimateJobCost(params);
		return {
			success: result.success,
			estimate: result.data,
			error: result.error,
		};
	}

	/**
	 * Retry a failed job
	 */
	async retryJob(jobId: string, options?: {
		retryFailedFramesOnly?: boolean;
		newPriority?: string;
	}): Promise<{
		success: boolean;
		newJobId?: string;
		error?: string;
	}> {
		// Get original job
		const original = await this.apiClient.getJob(jobId);
		if (!original.success || !original.data) {
			return { success: false, error: original.error || 'Original job not found' };
		}

		// Create new job with same parameters
		// Note: In real implementation, this would call a specific retry endpoint
		const result = await this.apiClient.createJob({
			metadata: {
				retryOf: jobId,
				retryFailedFramesOnly: options?.retryFailedFramesOnly,
			},
			priority: (options?.newPriority as JobCreateParams['priority']) || 'normal',
		});

		return {
			success: result.success,
			newJobId: result.data?.id,
			error: result.error,
		};
	}

	// ============ AI Jobs ============

	/**
	 * Submit AI inference job
	 */
	async submitInferenceJob(config: AIInferenceConfig): Promise<{
		success: boolean;
		job?: JobInfo;
		error?: string;
	}> {
		const params: AIJobParams = {
			modelId: config.modelId,
			input: config.input,
			maxTokens: config.maxTokens,
			temperature: config.temperature,
			gpuRequirements: config.gpuRequirements,
			timeout: config.timeout,
			priority: config.priority,
			metadata: {
				topP: config.topP,
				topK: config.topK,
				stopSequences: config.stopSequences,
				stream: config.stream,
			},
		};

		const result = await this.apiClient.submitAIJob(params);
		return {
			success: result.success,
			job: result.data,
			error: result.error,
		};
	}

	/**
	 * Submit AI training job
	 */
	async submitTrainingJob(config: AITrainingConfig): Promise<{
		success: boolean;
		job?: JobInfo;
		error?: string;
	}> {
		const params: AIJobParams = {
			modelId: config.modelId,
			framework: 'pytorch', // Default
			gpuRequirements: config.gpuRequirements,
			metadata: {
				type: 'training',
				datasetId: config.datasetId,
				epochs: config.epochs,
				batchSize: config.batchSize,
				learningRate: config.learningRate,
				optimizer: config.optimizer,
				checkpointInterval: config.checkpointInterval,
				validationSplit: config.validationSplit,
			},
		};

		const result = await this.apiClient.submitAIJob(params);
		return {
			success: result.success,
			job: result.data,
			error: result.error,
		};
	}

	/**
	 * Get AI inference results
	 */
	async getInferenceResults(jobId: string): Promise<{
		success: boolean;
		results?: {
			output: unknown;
			tokenUsage?: { input: number; output: number };
			latency: number;
		};
		error?: string;
	}> {
		const result = await this.apiClient.getAIJobResults(jobId);
		return {
			success: result.success,
			results: result.data,
			error: result.error,
		};
	}

	// ============ Job Management ============

	/**
	 * Cancel a running job
	 */
	async cancelJob(jobId: string): Promise<{
		success: boolean;
		refund?: number;
		error?: string;
	}> {
		const result = await this.apiClient.cancelJob(jobId);
		return {
			success: result.success,
			error: result.error,
		};
	}

	/**
	 * Get job history for the user
	 */
	async getJobHistory(options?: {
		status?: string;
		type?: 'render' | 'ai';
		limit?: number;
		offset?: number;
	}): Promise<{
		success: boolean;
		jobs?: JobInfo[];
		total?: number;
		error?: string;
	}> {
		const result = await this.apiClient.listJobs({
			status: options?.status,
			limit: options?.limit || 20,
			offset: options?.offset || 0,
		});

		return {
			success: result.success,
			jobs: result.data?.jobs,
			total: result.data?.total,
			error: result.error,
		};
	}

	/**
	 * Wait for job completion with polling
	 */
	async waitForCompletion(
		jobId: string,
		options?: {
			pollInterval?: number;
			timeout?: number;
			onProgress?: (progress: JobProgress) => void;
		}
	): Promise<{
		success: boolean;
		job?: JobInfo;
		error?: string;
	}> {
		const pollInterval = options?.pollInterval || 5000;
		const timeout = options?.timeout || 3600000; // 1 hour default
		const startTime = Date.now();

		while (Date.now() - startTime < timeout) {
			const result = await this.apiClient.getJob(jobId);
			
			if (!result.success) {
				return { success: false, error: result.error };
			}

			const job = result.data!;
			
			if (options?.onProgress) {
				options.onProgress({
					jobId: job.id,
					status: job.status,
					progress: job.progress,
					currentFrame: job.frames?.completed,
					totalFrames: job.frames?.total,
					currentNode: job.nodeId,
				});
			}

			if (job.status === 'completed') {
				return { success: true, job };
			}

			if (job.status === 'failed' || job.status === 'cancelled') {
				return { success: false, job, error: `Job ${job.status}` };
			}

			// Wait before next poll
			await new Promise(resolve => setTimeout(resolve, pollInterval));
		}

		return { success: false, error: 'Job timeout exceeded' };
	}
}

export default JobClient;
