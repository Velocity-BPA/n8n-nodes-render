/**
 * Render API Client
 * Handles all REST API interactions with Render Network
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import FormData from 'form-data';
import { RENDER_API_ENDPOINTS } from '../constants/networks';

export interface RenderApiConfig {
	apiEndpoint?: string;
	apiKey: string;
	creatorAccountId: string;
	timeout?: number;
}

export interface JobCreateParams {
	sceneId?: string;
	sceneUrl?: string;
	engine?: string;
	quality?: string;
	outputFormat?: string;
	resolution?: { width: number; height: number };
	frames?: { start: number; end: number };
	priority?: 'low' | 'normal' | 'high' | 'priority';
	gpuPreference?: string;
	maxCost?: number;
	metadata?: Record<string, unknown>;
}

export interface AIJobParams {
	modelId?: string;
	modelUrl?: string;
	framework?: string;
	input?: unknown;
	inputUrl?: string;
	gpuRequirements?: {
		minVram?: number;
		preferredGpu?: string;
		count?: number;
	};
	maxTokens?: number;
	temperature?: number;
	timeout?: number;
	priority?: string;
	metadata?: Record<string, unknown>;
}

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	errorCode?: string;
}

export interface JobInfo {
	id: string;
	status: string;
	progress: number;
	createdAt: string;
	startedAt?: string;
	completedAt?: string;
	frames?: {
		total: number;
		completed: number;
		failed: number;
	};
	cost?: {
		estimated: number;
		actual: number;
		currency: string;
	};
	nodeId?: string;
	outputs?: string[];
}

export interface NodeInfo {
	id: string;
	name: string;
	status: string;
	tier: number;
	gpu: {
		type: string;
		vram: number;
		count: number;
	};
	capacity: {
		total: number;
		available: number;
	};
	earnings: {
		total: number;
		pending: number;
	};
	performance: {
		uptime: number;
		reliability: number;
		speed: number;
	};
}

export interface NetworkStats {
	totalNodes: number;
	activeNodes: number;
	totalJobs: number;
	activeJobs: number;
	totalGpuHours: number;
	networkCapacity: number;
	averageQueueTime: number;
}

export interface PricingInfo {
	basePrice: number;
	gpuPrices: Record<string, number>;
	qualityMultipliers: Record<string, number>;
	priorityMultipliers: Record<string, number>;
	volumeDiscounts: Array<{ threshold: number; discount: number }>;
}

export class RenderApiClient {
	private client: AxiosInstance;

	constructor(config: RenderApiConfig) {
		const baseURL = config.apiEndpoint || RENDER_API_ENDPOINTS.production;
		
		this.client = axios.create({
			baseURL,
			timeout: (config.timeout || 30) * 1000,
			headers: {
				'Authorization': `Bearer ${config.apiKey}`,
				'X-Creator-ID': config.creatorAccountId,
				'Content-Type': 'application/json',
			},
		});

		// Add response interceptor for error handling
		this.client.interceptors.response.use(
			response => response,
			(error: AxiosError) => {
				if (error.response) {
					const errorData = error.response.data as Record<string, unknown>;
					throw new Error(
						(errorData?.message as string) || 
						(errorData?.error as string) || 
						`API Error: ${error.response.status}`
					);
				}
				throw error;
			}
		);
	}

	// ============ Job Operations ============

	/**
	 * Create a new render job
	 */
	async createJob(params: JobCreateParams): Promise<ApiResponse<JobInfo>> {
		try {
			const response = await this.client.post('/jobs', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job information
	 */
	async getJob(jobId: string): Promise<ApiResponse<JobInfo>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job status
	 */
	async getJobStatus(jobId: string): Promise<ApiResponse<{ status: string; progress: number }>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/status`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Cancel a job
	 */
	async cancelJob(jobId: string): Promise<ApiResponse<{ cancelled: boolean }>> {
		try {
			const response = await this.client.post(`/jobs/${jobId}/cancel`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * List user jobs
	 */
	async listJobs(params?: {
		status?: string;
		limit?: number;
		offset?: number;
	}): Promise<ApiResponse<{ jobs: JobInfo[]; total: number }>> {
		try {
			const response = await this.client.get('/jobs', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job results/outputs
	 */
	async getJobResults(jobId: string): Promise<ApiResponse<{ outputs: Array<{ url: string; format: string; size: number }> }>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/results`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Estimate job cost
	 */
	async estimateJobCost(params: JobCreateParams): Promise<ApiResponse<{ 
		estimated: number; 
		min: number; 
		max: number; 
		currency: string 
	}>> {
		try {
			const response = await this.client.post('/jobs/estimate', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ AI Compute Operations ============

	/**
	 * Submit AI inference job
	 */
	async submitAIJob(params: AIJobParams): Promise<ApiResponse<JobInfo>> {
		try {
			const response = await this.client.post('/ai/jobs', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get AI job results
	 */
	async getAIJobResults(jobId: string): Promise<ApiResponse<{ 
		output: unknown; 
		tokenUsage?: { input: number; output: number };
		latency: number;
	}>> {
		try {
			const response = await this.client.get(`/ai/jobs/${jobId}/results`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * List available AI models
	 */
	async listAIModels(): Promise<ApiResponse<Array<{
		id: string;
		name: string;
		framework: string;
		type: string;
		size: number;
	}>>> {
		try {
			const response = await this.client.get('/ai/models');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Scene Operations ============

	/**
	 * Upload a scene file
	 */
	async uploadScene(
		fileBuffer: Buffer,
		fileName: string,
		metadata?: Record<string, unknown>
	): Promise<ApiResponse<{ sceneId: string; uploadUrl?: string }>> {
		try {
			const formData = new FormData();
			formData.append('file', fileBuffer, fileName);
			if (metadata) {
				formData.append('metadata', JSON.stringify(metadata));
			}

			const response = await this.client.post('/scenes/upload', formData, {
				headers: formData.getHeaders(),
			});
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get scene information
	 */
	async getScene(sceneId: string): Promise<ApiResponse<{
		id: string;
		name: string;
		format: string;
		size: number;
		assets: string[];
		requirements: { minVram: number; estimatedTime: number };
	}>> {
		try {
			const response = await this.client.get(`/scenes/${sceneId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Validate a scene
	 */
	async validateScene(sceneId: string): Promise<ApiResponse<{
		valid: boolean;
		errors: string[];
		warnings: string[];
	}>> {
		try {
			const response = await this.client.post(`/scenes/${sceneId}/validate`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Node Operations ============

	/**
	 * Get node information
	 */
	async getNode(nodeId: string): Promise<ApiResponse<NodeInfo>> {
		try {
			const response = await this.client.get(`/nodes/${nodeId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * List active nodes
	 */
	async listNodes(params?: {
		tier?: number;
		gpuType?: string;
		status?: string;
		limit?: number;
	}): Promise<ApiResponse<{ nodes: NodeInfo[]; total: number }>> {
		try {
			const response = await this.client.get('/nodes', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Pricing Operations ============

	/**
	 * Get current pricing
	 */
	async getPricing(): Promise<ApiResponse<PricingInfo>> {
		try {
			const response = await this.client.get('/pricing');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get GPU-specific pricing
	 */
	async getGpuPricing(gpuType?: string): Promise<ApiResponse<Record<string, number>>> {
		try {
			const url = gpuType ? `/pricing/gpu/${gpuType}` : '/pricing/gpu';
			const response = await this.client.get(url);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Network Stats ============

	/**
	 * Get network overview
	 */
	async getNetworkStats(): Promise<ApiResponse<NetworkStats>> {
		try {
			const response = await this.client.get('/network/stats');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get GPU distribution
	 */
	async getGpuDistribution(): Promise<ApiResponse<Record<string, number>>> {
		try {
			const response = await this.client.get('/network/gpu-distribution');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Queue Operations ============

	/**
	 * Get queue status
	 */
	async getQueueStatus(): Promise<ApiResponse<{
		length: number;
		estimatedWait: number;
		priorityQueues: Record<string, number>;
	}>> {
		try {
			const response = await this.client.get('/queue/status');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job queue position
	 */
	async getQueuePosition(jobId: string): Promise<ApiResponse<{
		position: number;
		estimatedStart: string;
	}>> {
		try {
			const response = await this.client.get(`/queue/position/${jobId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Escrow Operations ============

	/**
	 * Get escrow balance
	 */
	async getEscrowBalance(): Promise<ApiResponse<{
		total: number;
		available: number;
		locked: number;
		currency: string;
	}>> {
		try {
			const response = await this.client.get('/escrow/balance');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get escrow history
	 */
	async getEscrowHistory(params?: {
		limit?: number;
		offset?: number;
	}): Promise<ApiResponse<Array<{
		type: string;
		amount: number;
		timestamp: string;
		jobId?: string;
	}>>> {
		try {
			const response = await this.client.get('/escrow/history', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ BME Operations ============

	/**
	 * Get BME (Burn-Mint Equilibrium) stats
	 */
	async getBmeStats(): Promise<ApiResponse<{
		burnRate: number;
		mintRate: number;
		equilibrium: number;
		circulation: number;
		totalBurned: number;
		totalMinted: number;
	}>> {
		try {
			const response = await this.client.get('/bme/stats');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Utility ============

	/**
	 * Get API status
	 */
	async getStatus(): Promise<ApiResponse<{ status: string; version: string }>> {
		try {
			const response = await this.client.get('/status');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Node Operations ============

	/**
	 * Get node info (alias for getNode)
	 */
	async getNodeInfo(nodeId: string): Promise<ApiResponse<NodeInfo>> {
		return this.getNode(nodeId);
	}

	/**
	 * Get node stats
	 */
	async getNodeStats(): Promise<ApiResponse<{ total: number; active: number; offline: number; byTier: Record<string, number> }>> {
		try {
			const response = await this.client.get('/network/nodes/stats');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Register a new node
	 */
	async registerNode(params: { name: string; endpoint: string; gpuType: string; walletAddress: string }): Promise<ApiResponse<NodeInfo>> {
		try {
			const response = await this.client.post('/nodes/register', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Update node configuration
	 */
	async updateNodeConfig(nodeId: string, config: Record<string, unknown>): Promise<ApiResponse<NodeInfo>> {
		try {
			const response = await this.client.patch(`/nodes/${nodeId}/config`, config);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Deactivate a node
	 */
	async deactivateNode(nodeId: string): Promise<ApiResponse<{ success: boolean }>> {
		try {
			const response = await this.client.post(`/nodes/${nodeId}/deactivate`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended GPU Operations ============

	/**
	 * Get available GPUs
	 */
	async getAvailableGpus(params?: { tier?: number; minVram?: number }): Promise<ApiResponse<Array<{ type: string; count: number; available: number; vram: number }>>> {
		try {
			const response = await this.client.get('/gpu/available', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get GPU availability
	 */
	async getGpuAvailability(gpuType: string): Promise<ApiResponse<{ type: string; total: number; available: number; inUse: number; queued: number }>> {
		try {
			const response = await this.client.get(`/gpu/${gpuType}/availability`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Reserve GPU
	 */
	async reserveGpu(params: { gpuType: string; count: number; duration: number }): Promise<ApiResponse<{ reservationId: string; expiresAt: string; cost: number }>> {
		try {
			const response = await this.client.post('/gpu/reserve', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get GPU performance metrics
	 */
	async getGpuPerformance(gpuType: string): Promise<ApiResponse<{ type: string; octaneBench: number; blenderBench: number; aiInference: number; powerEfficiency: number }>> {
		try {
			const response = await this.client.get(`/gpu/${gpuType}/performance`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get GPU queue
	 */
	async getGpuQueue(gpuType: string): Promise<ApiResponse<{ type: string; queueLength: number; estimatedWait: number; jobsProcessing: number }>> {
		try {
			const response = await this.client.get(`/gpu/${gpuType}/queue`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Network Stats ============

	/**
	 * Get network overview
	 */
	async getNetworkOverview(): Promise<ApiResponse<NetworkStats & { 
		utilizationPercent: number;
		gpuHoursToday: number;
		renderJobsToday: number;
		aiJobsToday: number;
	}>> {
		try {
			const response = await this.client.get('/network/overview');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get active job stats
	 */
	async getActiveJobStats(): Promise<ApiResponse<{ 
		rendering: number;
		aiCompute: number;
		queued: number;
		processing: number;
		byEngine: Record<string, number>;
	}>> {
		try {
			const response = await this.client.get('/network/jobs/active');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get network capacity
	 */
	async getNetworkCapacity(): Promise<ApiResponse<{ 
		totalGpuHours: number;
		availableGpuHours: number;
		utilizationPercent: number;
		byGpuType: Record<string, { total: number; available: number }>;
	}>> {
		try {
			const response = await this.client.get('/network/capacity');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job statistics
	 */
	async getJobStatistics(params?: { period?: string }): Promise<ApiResponse<{ 
		total: number;
		completed: number;
		failed: number;
		cancelled: number;
		averageDuration: number;
		successRate: number;
	}>> {
		try {
			const response = await this.client.get('/network/jobs/statistics', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get earnings distribution
	 */
	async getEarningsDistribution(params?: { period?: string }): Promise<ApiResponse<{ 
		totalEarnings: number;
		byTier: Record<string, number>;
		byGpuType: Record<string, number>;
		topEarners: Array<{ nodeId: string; earnings: number }>;
	}>> {
		try {
			const response = await this.client.get('/network/earnings/distribution', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get token metrics
	 */
	async getTokenMetrics(): Promise<ApiResponse<{ 
		price: number;
		marketCap: number;
		volume24h: number;
		circulatingSupply: number;
		totalSupply: number;
		stakingRatio: number;
	}>> {
		try {
			const response = await this.client.get('/token/metrics');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get burn statistics
	 */
	async getBurnStatistics(params?: { period?: string }): Promise<ApiResponse<{ 
		totalBurned: number;
		burnedPeriod: number;
		burnRate: number;
		largestBurns: Array<{ amount: number; timestamp: string; jobId: string }>;
	}>> {
		try {
			const response = await this.client.get('/bme/burn/statistics', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get historical stats
	 */
	async getHistoricalStats(params: { metric: string; period: string; granularity?: string }): Promise<ApiResponse<Array<{ timestamp: string; value: number }>>> {
		try {
			const response = await this.client.get('/network/historical', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Queue Operations ============

	/**
	 * Get estimated wait time
	 */
	async getEstimatedWait(params: { gpuType?: string; priority?: string }): Promise<ApiResponse<{ 
		estimatedMinutes: number;
		confidence: number;
		queueLength: number;
	}>> {
		try {
			const response = await this.client.get('/queue/estimate', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get queue statistics
	 */
	async getQueueStatistics(params?: { period?: string }): Promise<ApiResponse<{ 
		averageWait: number;
		peakWait: number;
		throughput: number;
		byPriority: Record<string, { count: number; avgWait: number }>;
	}>> {
		try {
			const response = await this.client.get('/queue/statistics', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Prioritize job in queue
	 */
	async prioritizeJob(jobId: string, priority: string): Promise<ApiResponse<{ 
		newPosition: number;
		additionalCost: number;
		estimatedStart: string;
	}>> {
		try {
			const response = await this.client.post(`/queue/${jobId}/prioritize`, { priority });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get priority pricing
	 */
	async getPriorityPricing(): Promise<ApiResponse<Record<string, { multiplier: number; estimatedWait: number }>>> {
		try {
			const response = await this.client.get('/queue/priority-pricing');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get queue history
	 */
	async getQueueHistory(params?: { limit?: number; period?: string }): Promise<ApiResponse<Array<{ 
		timestamp: string;
		length: number;
		avgWait: number;
		processed: number;
	}>>> {
		try {
			const response = await this.client.get('/queue/history', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Scene Operations ============

	/**
	 * Get scene info (alias)
	 */
	async getSceneInfo(sceneId: string): Promise<ApiResponse<{
		id: string;
		name: string;
		format: string;
		size: number;
		assets: string[];
		requirements: { minVram: number; estimatedTime: number };
	}>> {
		return this.getScene(sceneId);
	}

	/**
	 * Get scene assets
	 */
	async getSceneAssets(sceneId: string): Promise<ApiResponse<Array<{ 
		name: string;
		type: string;
		size: number;
		path: string;
		status: string;
	}>>> {
		try {
			const response = await this.client.get(`/scenes/${sceneId}/assets`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Update scene
	 */
	async updateScene(sceneId: string, updates: Record<string, unknown>): Promise<ApiResponse<{ updated: boolean }>> {
		try {
			const response = await this.client.patch(`/scenes/${sceneId}`, updates);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Delete scene
	 */
	async deleteScene(sceneId: string): Promise<ApiResponse<{ deleted: boolean }>> {
		try {
			const response = await this.client.delete(`/scenes/${sceneId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get scene requirements
	 */
	async getSceneRequirements(sceneId: string): Promise<ApiResponse<{ 
		minVram: number;
		recommendedGpu: string;
		estimatedTime: number;
		complexity: string;
	}>> {
		try {
			const response = await this.client.get(`/scenes/${sceneId}/requirements`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Estimate scene cost
	 */
	async estimateSceneCost(sceneId: string, params: { quality?: string; gpuType?: string }): Promise<ApiResponse<{ 
		estimated: number;
		min: number;
		max: number;
		breakdown: Record<string, number>;
	}>> {
		try {
			const response = await this.client.post(`/scenes/${sceneId}/estimate`, params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get scene history
	 */
	async getSceneHistory(sceneId: string): Promise<ApiResponse<Array<{ 
		timestamp: string;
		action: string;
		details: Record<string, unknown>;
	}>>> {
		try {
			const response = await this.client.get(`/scenes/${sceneId}/history`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Output Operations ============

	/**
	 * Get output info
	 */
	async getOutputInfo(outputId: string): Promise<ApiResponse<{ 
		id: string;
		jobId: string;
		format: string;
		size: number;
		url: string;
		createdAt: string;
	}>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job output info
	 */
	async getJobOutputInfo(jobId: string): Promise<ApiResponse<Array<{ 
		id: string;
		format: string;
		size: number;
		url: string;
	}>>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/outputs`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Download output
	 */
	async downloadOutput(outputId: string): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}/download`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get output URL
	 */
	async getOutputUrl(outputId: string, params?: { expiry?: number }): Promise<ApiResponse<{ url: string; expiresAt: string }>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}/url`, { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Convert output format
	 */
	async convertOutput(outputId: string, targetFormat: string, options?: Record<string, unknown>): Promise<ApiResponse<{ 
		conversionId: string;
		status: string;
		outputUrl?: string;
	}>> {
		try {
			const response = await this.client.post(`/outputs/${outputId}/convert`, { targetFormat, ...options });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get thumbnail
	 */
	async getThumbnail(outputId: string, params?: { width?: number; height?: number }): Promise<ApiResponse<{ url: string; width: number; height: number }>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}/thumbnail`, { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get preview
	 */
	async getPreview(outputId: string): Promise<ApiResponse<{ url: string; format: string; duration?: number }>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}/preview`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get streaming URL
	 */
	async getStreamUrl(outputId: string): Promise<ApiResponse<{ url: string; protocol: string; expiresAt: string }>> {
		try {
			const response = await this.client.get(`/outputs/${outputId}/stream`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get storage info
	 */
	async getStorageInfo(): Promise<ApiResponse<{ 
		used: number;
		available: number;
		total: number;
		files: number;
	}>> {
		try {
			const response = await this.client.get('/storage/info');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Delete output
	 */
	async deleteOutput(outputId: string): Promise<ApiResponse<{ deleted: boolean }>> {
		try {
			const response = await this.client.delete(`/outputs/${outputId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended BME Operations ============

	/**
	 * Get burn rate
	 */
	async getBurnRate(params?: { period?: string }): Promise<ApiResponse<{ 
		rate: number;
		dailyAverage: number;
		trend: string;
		history: Array<{ timestamp: string; amount: number }>;
	}>> {
		try {
			const response = await this.client.get('/bme/burn-rate', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get mint rate
	 */
	async getMintRate(params?: { period?: string }): Promise<ApiResponse<{ 
		rate: number;
		dailyAverage: number;
		trend: string;
		history: Array<{ timestamp: string; amount: number }>;
	}>> {
		try {
			const response = await this.client.get('/bme/mint-rate', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get token circulation
	 */
	async getTokenCirculation(): Promise<ApiResponse<{ 
		circulating: number;
		staked: number;
		locked: number;
		burned: number;
		total: number;
	}>> {
		try {
			const response = await this.client.get('/bme/circulation');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get BME history
	 */
	async getBmeHistory(params?: { period?: string; granularity?: string }): Promise<ApiResponse<Array<{ 
		timestamp: string;
		burnRate: number;
		mintRate: number;
		equilibrium: number;
	}>>> {
		try {
			const response = await this.client.get('/bme/history', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Calculate equilibrium
	 */
	async calculateEquilibrium(params: { burnRate: number; mintRate: number; growthRate?: number }): Promise<ApiResponse<{ 
		equilibrium: number;
		timeToEquilibrium: number;
		projectedSupply: number;
	}>> {
		try {
			const response = await this.client.post('/bme/calculate-equilibrium', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get emission schedule
	 */
	async getEmissionSchedule(): Promise<ApiResponse<Array<{ 
		period: string;
		emissions: number;
		halvingDate?: string;
	}>>> {
		try {
			const response = await this.client.get('/bme/emission-schedule');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended Job Operations ============

	/**
	 * Retry failed job
	 */
	async retryJob(jobId: string, options?: { retryFailedFramesOnly?: boolean; newPriority?: string }): Promise<ApiResponse<JobInfo>> {
		try {
			const response = await this.client.post(`/jobs/${jobId}/retry`, options || {});
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job logs
	 */
	async getJobLogs(jobId: string): Promise<ApiResponse<Array<{ timestamp: string; level: string; message: string }>>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/logs`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job metrics
	 */
	async getJobMetrics(jobId: string): Promise<ApiResponse<{ 
		gpuTime: number;
		renderTime: number;
		queueTime: number;
		framesPerSecond: number;
		memoryUsage: number;
	}>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/metrics`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Update job settings
	 */
	async updateJobSettings(jobId: string, settings: Record<string, unknown>): Promise<ApiResponse<{ updated: boolean }>> {
		try {
			const response = await this.client.patch(`/jobs/${jobId}/settings`, settings);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Extended AI Operations ============

	/**
	 * Get AI job status
	 */
	async getAIJobStatus(jobId: string): Promise<ApiResponse<{ 
		status: string;
		progress: number;
		tokenUsage?: { input: number; output: number; total: number };
	}>> {
		try {
			const response = await this.client.get(`/ai/jobs/${jobId}/status`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get AI model info
	 */
	async getModelInfo(modelId: string): Promise<ApiResponse<{
		id: string;
		name: string;
		framework: string;
		type: string;
		size: number;
		parameters: number;
		contextLength?: number;
	}>> {
		try {
			const response = await this.client.get(`/ai/models/${modelId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * List AI models (alias for listAIModels)
	 */
	async listModels(): Promise<ApiResponse<Array<{
		id: string;
		name: string;
		framework: string;
		type: string;
		size: number;
	}>>> {
		return this.listAIModels();
	}

	// ============ Frame Operations ============

	/**
	 * Get frame info
	 */
	async getFrameInfo(jobId: string, frameNumber: number): Promise<ApiResponse<{
		frameNumber: number;
		status: string;
		startedAt?: string;
		completedAt?: string;
		renderTime?: number;
		outputUrl?: string;
	}>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/frames/${frameNumber}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * List frames for job
	 */
	async listFrames(jobId: string): Promise<ApiResponse<Array<{
		frameNumber: number;
		status: string;
		renderTime?: number;
	}>>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/frames`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Retry frame
	 */
	async retryFrame(jobId: string, frameNumber: number): Promise<ApiResponse<{ retried: boolean; newStatus: string }>> {
		try {
			const response = await this.client.post(`/jobs/${jobId}/frames/${frameNumber}/retry`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Staking Operations ============

	/**
	 * Get staking info
	 */
	async getStakingInfo(wallet: string): Promise<ApiResponse<{
		staked: number;
		locked: number;
		available: number;
		rewards: number;
		apy: number;
		lockEndDate?: string;
	}>> {
		try {
			const response = await this.client.get(`/staking/${wallet}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get staking APY
	 */
	async getStakingApy(): Promise<ApiResponse<{ currentApy: number; projectedApy: number; historicalApy: Array<{ date: string; apy: number }> }>> {
		try {
			const response = await this.client.get('/staking/apy');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Node Operator Operations ============

	/**
	 * Get operator info
	 */
	async getOperatorInfo(operatorId: string): Promise<ApiResponse<{
		id: string;
		name: string;
		tier: string;
		status: string;
		nodeCount: number;
		totalEarnings: number;
		joinedAt: string;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator nodes
	 */
	async getOperatorNodes(operatorId: string): Promise<ApiResponse<NodeInfo[]>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/nodes`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator earnings
	 */
	async getOperatorEarnings(operatorId: string, period?: string): Promise<ApiResponse<{
		totalEarnings: number;
		pendingPayout: number;
		paidOut: number;
		history: Array<{ date: string; amount: number }>;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/earnings`, { params: { period } });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator stats
	 */
	async getOperatorStats(operatorId: string): Promise<ApiResponse<{
		totalJobs: number;
		completedJobs: number;
		failedJobs: number;
		averageJobTime: number;
		uptime: number;
		reputation: number;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/stats`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get payout history
	 */
	async getPayoutHistory(operatorId: string, params?: { period?: string; limit?: number }): Promise<ApiResponse<{
		payouts: Array<{ date: string; amount: number; txHash: string }>;
		totalPaidOut: number;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/payouts`, { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Configure payout address
	 */
	async configurePayoutAddress(address: string): Promise<ApiResponse<{ configured: boolean }>> {
		try {
			const response = await this.client.post('/operators/payout-address', { address });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator tier
	 */
	async getOperatorTier(operatorId: string): Promise<ApiResponse<{
		tier: string;
		benefits: string[];
		nextTier: string;
		progressToNext: number;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/tier`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator performance metrics
	 */
	async getOperatorPerformanceMetrics(operatorId: string): Promise<ApiResponse<{
		uptime: number;
		jobSuccessRate: number;
		averageRenderTime: number;
		gpuUtilization: number;
		networkScore: number;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/performance`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get operator job history
	 */
	async getOperatorJobHistory(operatorId: string, params?: { period?: string; limit?: number }): Promise<ApiResponse<{
		jobs: JobInfo[];
		totalJobs: number;
	}>> {
		try {
			const response = await this.client.get(`/operators/${operatorId}/jobs`, { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Update operator profile
	 */
	async updateOperatorProfile(profile: { name?: string; description?: string }): Promise<ApiResponse<{
		updated: boolean;
		profile: { name: string; description: string };
	}>> {
		try {
			const response = await this.client.put('/operators/profile', profile);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Pricing Operations ============

	/**
	 * Get current pricing
	 */
	async getCurrentPricing(): Promise<ApiResponse<PricingInfo>> {
		try {
			const response = await this.client.get('/pricing');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get render pricing
	 */
	async getRenderPricing(params?: { engine?: string; quality?: string }): Promise<ApiResponse<{
		basePricePerHour: number;
		qualityMultiplier: number;
		engineMultiplier: number;
		estimatedCostPerFrame: number;
	}>> {
		try {
			const response = await this.client.get('/pricing/render', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get AI pricing
	 */
	async getAiPricing(params?: { model?: string; framework?: string }): Promise<ApiResponse<{
		pricePerToken: number;
		pricePerGpuHour: number;
		modelMultiplier: number;
	}>> {
		try {
			const response = await this.client.get('/pricing/ai', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get price history
	 */
	async getPriceHistory(params?: { period?: string; granularity?: string }): Promise<ApiResponse<Array<{
		timestamp: string;
		price: number;
	}>>> {
		try {
			const response = await this.client.get('/pricing/history', { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Calculate job cost
	 */
	async calculateJobCost(params: JobCreateParams): Promise<ApiResponse<{
		estimatedCost: number;
		breakdown: { gpu: number; storage: number; priority: number };
		currency: string;
	}>> {
		try {
			const response = await this.client.post('/pricing/calculate', params);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get discount tiers
	 */
	async getDiscountTiers(): Promise<ApiResponse<Array<{
		tier: number;
		threshold: number;
		discount: number;
	}>>> {
		try {
			const response = await this.client.get('/pricing/discounts');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get volume pricing
	 */
	async getVolumePricing(): Promise<ApiResponse<Array<{
		volumeTier: number;
		minVolume: number;
		pricePerUnit: number;
	}>>> {
		try {
			const response = await this.client.get('/pricing/volume');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Staking Extended Operations ============

	/**
	 * Stake tokens
	 */
	async stakeTokens(wallet: string, amount: number, lockPeriod?: number): Promise<ApiResponse<{
		staked: boolean;
		txHash: string;
		amount: number;
		lockEndDate?: string;
	}>> {
		try {
			const response = await this.client.post('/staking/stake', { wallet, amount, lockPeriod });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Unstake tokens
	 */
	async unstakeTokens(wallet: string, amount: number): Promise<ApiResponse<{
		unstaked: boolean;
		txHash: string;
		amount: number;
	}>> {
		try {
			const response = await this.client.post('/staking/unstake', { wallet, amount });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get staking rewards
	 */
	async getStakingRewards(wallet: string): Promise<ApiResponse<{
		pendingRewards: number;
		claimedRewards: number;
		totalRewards: number;
		history: Array<{ date: string; amount: number }>;
	}>> {
		try {
			const response = await this.client.get(`/staking/${wallet}/rewards`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Claim staking rewards
	 */
	async claimStakingRewards(wallet: string): Promise<ApiResponse<{
		claimed: boolean;
		txHash: string;
		amount: number;
	}>> {
		try {
			const response = await this.client.post(`/staking/${wallet}/claim`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get staking history
	 */
	async getStakingHistory(wallet: string, params?: { limit?: number }): Promise<ApiResponse<Array<{
		action: string;
		amount: number;
		timestamp: string;
		txHash: string;
	}>>> {
		try {
			const response = await this.client.get(`/staking/${wallet}/history`, { params });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get node stakes
	 */
	async getNodeStakes(nodeId: string): Promise<ApiResponse<{
		totalStaked: number;
		stakers: Array<{ wallet: string; amount: number }>;
	}>> {
		try {
			const response = await this.client.get(`/nodes/${nodeId}/stakes`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Delegate stake
	 */
	async delegateStake(wallet: string, nodeId: string, amount: number): Promise<ApiResponse<{
		delegated: boolean;
		txHash: string;
		amount: number;
	}>> {
		try {
			const response = await this.client.post('/staking/delegate', { wallet, nodeId, amount });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Utility Operations ============

	/**
	 * Sign message
	 */
	async signMessage(message: string, wallet: string): Promise<ApiResponse<{
		signature: string;
		publicKey: string;
	}>> {
		try {
			const response = await this.client.post('/utility/sign', { message, wallet });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Verify signature
	 */
	async verifySignature(message: string, signature: string, publicKey: string): Promise<ApiResponse<{
		valid: boolean;
	}>> {
		try {
			const response = await this.client.post('/utility/verify', { message, signature, publicKey });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get network status
	 */
	async getNetworkStatus(): Promise<ApiResponse<{
		status: string;
		latency: number;
		lastBlock: number;
	}>> {
		try {
			const response = await this.client.get('/network/status');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get API status
	 */
	async getApiStatus(): Promise<ApiResponse<{ status: string; version: string }>> {
		try {
			const response = await this.client.get('/status');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Validate job config
	 */
	async validateJobConfig(config: JobCreateParams): Promise<ApiResponse<{
		valid: boolean;
		errors: string[];
		warnings: string[];
	}>> {
		try {
			const response = await this.client.post('/utility/validate-job', config);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Parse scene file
	 */
	async parseSceneFile(sceneId: string): Promise<ApiResponse<{
		format: string;
		objects: number;
		materials: number;
		textures: number;
		animations: number;
		estimatedRenderTime: number;
	}>> {
		try {
			const response = await this.client.get(`/scenes/${sceneId}/parse`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	// ============ Escrow Extended Operations ============

	/**
	 * Deposit to escrow
	 */
	async depositToEscrow(amount: number, wallet: string): Promise<ApiResponse<{
		deposited: boolean;
		txHash: string;
		newBalance: number;
	}>> {
		try {
			const response = await this.client.post('/escrow/deposit', { amount, wallet });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Withdraw from escrow
	 */
	async withdrawFromEscrow(amount: number, wallet: string): Promise<ApiResponse<{
		withdrawn: boolean;
		txHash: string;
		newBalance: number;
	}>> {
		try {
			const response = await this.client.post('/escrow/withdraw', { amount, wallet });
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get escrow contract info
	 */
	async getEscrowContract(): Promise<ApiResponse<{
		address: string;
		programId: string;
		version: string;
	}>> {
		try {
			const response = await this.client.get('/escrow/contract');
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Calculate required deposit
	 */
	async calculateRequiredDeposit(jobParams: JobCreateParams): Promise<ApiResponse<{
		required: number;
		buffer: number;
		total: number;
	}>> {
		try {
			const response = await this.client.post('/escrow/calculate', jobParams);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}

	/**
	 * Get job progress
	 */
	async getJobProgress(jobId: string): Promise<ApiResponse<{
		progress: number;
		currentFrame: number;
		totalFrames: number;
		estimatedTimeRemaining: number;
	}>> {
		try {
			const response = await this.client.get(`/jobs/${jobId}/progress`);
			return { success: true, data: response.data };
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return { success: false, error: errorMessage };
		}
	}
}

export default RenderApiClient;
