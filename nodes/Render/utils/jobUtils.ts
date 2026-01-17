/**
 * Job Utilities for Render Network
 * Helper functions for job management and validation
 */

import { RENDER_QUALITY_PRESETS, SCENE_FORMATS, OUTPUT_FORMATS } from '../constants/formats';
import { GPU_TYPES } from '../constants/gpuTypes';

export interface JobValidationResult {
	valid: boolean;
	errors: string[];
	warnings: string[];
}

export interface JobRequirements {
	minVram: number;
	estimatedTime: number;
	estimatedCost: number;
	recommendedGpu: string;
	recommendedTier: number;
}

/**
 * Validate job configuration before submission
 */
export function validateJobConfig(config: {
	sceneFormat?: string;
	outputFormat?: string;
	quality?: string;
	resolution?: { width: number; height: number };
	frames?: { start: number; end: number };
	gpuType?: string;
}): JobValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];

	// Validate scene format
	if (config.sceneFormat) {
		const format = config.sceneFormat.toLowerCase().replace('.', '');
		if (!Object.keys(SCENE_FORMATS).includes(format)) {
			errors.push(`Unsupported scene format: ${config.sceneFormat}`);
		}
	}

	// Validate output format
	if (config.outputFormat) {
		const format = config.outputFormat.toLowerCase().replace('.', '');
		if (!Object.keys(OUTPUT_FORMATS).includes(format)) {
			errors.push(`Unsupported output format: ${config.outputFormat}`);
		}
	}

	// Validate quality preset
	if (config.quality) {
		if (!Object.keys(RENDER_QUALITY_PRESETS).includes(config.quality)) {
			warnings.push(`Unknown quality preset: ${config.quality}. Using 'production' as default.`);
		}
	}

	// Validate resolution
	if (config.resolution) {
		if (config.resolution.width <= 0 || config.resolution.height <= 0) {
			errors.push('Resolution must have positive width and height');
		}
		if (config.resolution.width > 16384 || config.resolution.height > 16384) {
			warnings.push('Very high resolution may significantly increase render time and cost');
		}
	}

	// Validate frame range
	if (config.frames) {
		if (config.frames.start < 0) {
			errors.push('Frame start must be non-negative');
		}
		if (config.frames.end < config.frames.start) {
			errors.push('Frame end must be greater than or equal to frame start');
		}
		if (config.frames.end - config.frames.start > 10000) {
			warnings.push('Large frame ranges may take significant time to render');
		}
	}

	// Validate GPU type
	if (config.gpuType) {
		if (!GPU_TYPES[config.gpuType]) {
			warnings.push(`Unknown GPU type: ${config.gpuType}. System will auto-select appropriate GPU.`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
	};
}

/**
 * Calculate job requirements based on configuration
 */
export function calculateJobRequirements(config: {
	quality?: string;
	resolution?: { width: number; height: number };
	frames?: { start: number; end: number };
	sceneComplexity?: 'low' | 'medium' | 'high' | 'extreme';
}): JobRequirements {
	// Get quality settings
	const quality = RENDER_QUALITY_PRESETS[config.quality as keyof typeof RENDER_QUALITY_PRESETS] 
		|| RENDER_QUALITY_PRESETS.production;

	// Calculate pixel count
	const resolution = config.resolution || { width: 1920, height: 1080 };
	const pixels = resolution.width * resolution.height;
	const megapixels = pixels / 1000000;

	// Calculate frame count
	const frameCount = config.frames 
		? (config.frames.end - config.frames.start + 1) 
		: 1;

	// Scene complexity multiplier
	const complexityMultipliers = {
		low: 0.5,
		medium: 1.0,
		high: 2.0,
		extreme: 4.0,
	};
	const complexityMultiplier = complexityMultipliers[config.sceneComplexity || 'medium'];

	// Calculate VRAM requirements
	let minVram = 8; // Base requirement
	if (megapixels > 8) minVram = 16;
	if (megapixels > 16) minVram = 24;
	if (megapixels > 32) minVram = 48;
	minVram *= complexityMultiplier;

	// Calculate estimated time (in seconds per frame)
	const baseTimePerFrame = (megapixels * quality.samples) / 10000;
	const estimatedTimePerFrame = baseTimePerFrame * complexityMultiplier;
	const estimatedTime = estimatedTimePerFrame * frameCount;

	// Calculate estimated cost (simplified)
	const baseRate = 0.01; // RENDER per GPU-minute
	const gpuMinutes = estimatedTime / 60;
	const estimatedCost = gpuMinutes * baseRate * complexityMultiplier;

	// Determine recommended GPU
	let recommendedGpu = 'rtx-3060';
	let recommendedTier = 1;
	
	if (minVram > 10) {
		recommendedGpu = 'rtx-3080';
		recommendedTier = 2;
	}
	if (minVram > 16) {
		recommendedGpu = 'rtx-4080';
		recommendedTier = 3;
	}
	if (minVram > 24) {
		recommendedGpu = 'rtx-4090';
		recommendedTier = 4;
	}

	return {
		minVram: Math.ceil(minVram),
		estimatedTime: Math.ceil(estimatedTime),
		estimatedCost: Math.round(estimatedCost * 100) / 100,
		recommendedGpu,
		recommendedTier,
	};
}

/**
 * Parse job status to human-readable format
 */
export function formatJobStatus(status: string): string {
	const statusMap: Record<string, string> = {
		pending: 'Pending - Waiting in queue',
		queued: 'Queued - Ready to start',
		assigned: 'Assigned - Sent to node',
		preparing: 'Preparing - Setting up scene',
		rendering: 'Rendering - In progress',
		processing: 'Processing - Post-processing output',
		uploading: 'Uploading - Saving results',
		completed: 'Completed - Ready for download',
		failed: 'Failed - Error occurred',
		cancelled: 'Cancelled - Stopped by user',
		timeout: 'Timeout - Exceeded time limit',
	};

	return statusMap[status.toLowerCase()] || status;
}

/**
 * Calculate progress percentage
 */
export function calculateProgress(current: number, total: number): number {
	if (total <= 0) return 0;
	const progress = (current / total) * 100;
	return Math.min(100, Math.max(0, Math.round(progress * 100) / 100));
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(seconds: number): string {
	if (seconds < 60) {
		return `${Math.round(seconds)}s`;
	}
	if (seconds < 3600) {
		const minutes = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		return `${minutes}m ${secs}s`;
	}
	const hours = Math.floor(seconds / 3600);
	const minutes = Math.floor((seconds % 3600) / 60);
	return `${hours}h ${minutes}m`;
}

/**
 * Generate job priority score
 */
export function calculatePriorityScore(priority: string, submissionTime: Date): number {
	const priorityWeights: Record<string, number> = {
		low: 1,
		normal: 2,
		high: 3,
		priority: 4,
	};

	const weight = priorityWeights[priority] || 2;
	const ageMinutes = (Date.now() - submissionTime.getTime()) / 60000;
	
	// Score increases with priority and age
	return weight * 1000 + ageMinutes;
}

/**
 * Validate scene file extension
 */
export function isValidSceneFile(filename: string): boolean {
	const ext = filename.toLowerCase().split('.').pop() || '';
	return Object.values(SCENE_FORMATS).some(format => 
		format.extension.slice(1) === ext
	);
}

/**
 * Get scene format info from filename
 */
export function getSceneFormatInfo(filename: string): {
	format: string;
	maxSize: number;
	supported: boolean;
} | null {
	const ext = filename.toLowerCase().split('.').pop() || '';
	
	for (const [key, format] of Object.entries(SCENE_FORMATS)) {
		if (format.extension.slice(1) === ext) {
			return {
				format: key,
				maxSize: format.maxSize,
				supported: format.supported,
			};
		}
	}
	
	return null;
}
