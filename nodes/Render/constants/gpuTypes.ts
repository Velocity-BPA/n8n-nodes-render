/**
 * GPU Types and Specifications for Render Network
 * Supported GPUs, performance tiers, and pricing
 */

export interface GpuType {
	id: string;
	name: string;
	manufacturer: 'nvidia' | 'amd';
	vram: number; // in GB
	tier: 1 | 2 | 3 | 4;
	renderScore: number; // Relative performance score
	aiScore: number; // AI inference/training score
	priceMultiplier: number; // Price relative to base
	supported: boolean;
}

export const GPU_TYPES: Record<string, GpuType> = {
	// NVIDIA Consumer GPUs
	'rtx-4090': {
		id: 'rtx-4090',
		name: 'NVIDIA RTX 4090',
		manufacturer: 'nvidia',
		vram: 24,
		tier: 4,
		renderScore: 100,
		aiScore: 95,
		priceMultiplier: 3.0,
		supported: true,
	},
	'rtx-4080': {
		id: 'rtx-4080',
		name: 'NVIDIA RTX 4080',
		manufacturer: 'nvidia',
		vram: 16,
		tier: 3,
		renderScore: 75,
		aiScore: 70,
		priceMultiplier: 2.2,
		supported: true,
	},
	'rtx-4070-ti': {
		id: 'rtx-4070-ti',
		name: 'NVIDIA RTX 4070 Ti',
		manufacturer: 'nvidia',
		vram: 12,
		tier: 3,
		renderScore: 60,
		aiScore: 55,
		priceMultiplier: 1.8,
		supported: true,
	},
	'rtx-4070': {
		id: 'rtx-4070',
		name: 'NVIDIA RTX 4070',
		manufacturer: 'nvidia',
		vram: 12,
		tier: 2,
		renderScore: 50,
		aiScore: 45,
		priceMultiplier: 1.5,
		supported: true,
	},
	'rtx-3090': {
		id: 'rtx-3090',
		name: 'NVIDIA RTX 3090',
		manufacturer: 'nvidia',
		vram: 24,
		tier: 3,
		renderScore: 70,
		aiScore: 65,
		priceMultiplier: 2.0,
		supported: true,
	},
	'rtx-3080': {
		id: 'rtx-3080',
		name: 'NVIDIA RTX 3080',
		manufacturer: 'nvidia',
		vram: 10,
		tier: 2,
		renderScore: 55,
		aiScore: 50,
		priceMultiplier: 1.6,
		supported: true,
	},
	'rtx-3070': {
		id: 'rtx-3070',
		name: 'NVIDIA RTX 3070',
		manufacturer: 'nvidia',
		vram: 8,
		tier: 2,
		renderScore: 45,
		aiScore: 40,
		priceMultiplier: 1.3,
		supported: true,
	},
	'rtx-3060': {
		id: 'rtx-3060',
		name: 'NVIDIA RTX 3060',
		manufacturer: 'nvidia',
		vram: 12,
		tier: 1,
		renderScore: 35,
		aiScore: 30,
		priceMultiplier: 1.0,
		supported: true,
	},

	// NVIDIA Professional GPUs
	'a100': {
		id: 'a100',
		name: 'NVIDIA A100',
		manufacturer: 'nvidia',
		vram: 80,
		tier: 4,
		renderScore: 90,
		aiScore: 100,
		priceMultiplier: 5.0,
		supported: true,
	},
	'a6000': {
		id: 'a6000',
		name: 'NVIDIA RTX A6000',
		manufacturer: 'nvidia',
		vram: 48,
		tier: 4,
		renderScore: 85,
		aiScore: 80,
		priceMultiplier: 4.0,
		supported: true,
	},
	'a5000': {
		id: 'a5000',
		name: 'NVIDIA RTX A5000',
		manufacturer: 'nvidia',
		vram: 24,
		tier: 3,
		renderScore: 65,
		aiScore: 60,
		priceMultiplier: 2.5,
		supported: true,
	},
	'a4000': {
		id: 'a4000',
		name: 'NVIDIA RTX A4000',
		manufacturer: 'nvidia',
		vram: 16,
		tier: 2,
		renderScore: 50,
		aiScore: 45,
		priceMultiplier: 1.8,
		supported: true,
	},
	'h100': {
		id: 'h100',
		name: 'NVIDIA H100',
		manufacturer: 'nvidia',
		vram: 80,
		tier: 4,
		renderScore: 95,
		aiScore: 100,
		priceMultiplier: 6.0,
		supported: true,
	},

	// AMD GPUs
	'rx-7900-xtx': {
		id: 'rx-7900-xtx',
		name: 'AMD RX 7900 XTX',
		manufacturer: 'amd',
		vram: 24,
		tier: 3,
		renderScore: 70,
		aiScore: 50,
		priceMultiplier: 2.0,
		supported: true,
	},
	'rx-7900-xt': {
		id: 'rx-7900-xt',
		name: 'AMD RX 7900 XT',
		manufacturer: 'amd',
		vram: 20,
		tier: 3,
		renderScore: 60,
		aiScore: 45,
		priceMultiplier: 1.7,
		supported: true,
	},
} as const;

// GPU Tiers with requirements and benefits
export const GPU_TIERS = {
	1: {
		name: 'Entry Level',
		minVram: 8,
		minRenderScore: 30,
		jobPriority: 'low',
		maxConcurrentJobs: 1,
	},
	2: {
		name: 'Standard',
		minVram: 10,
		minRenderScore: 45,
		jobPriority: 'normal',
		maxConcurrentJobs: 2,
	},
	3: {
		name: 'Professional',
		minVram: 16,
		minRenderScore: 60,
		jobPriority: 'high',
		maxConcurrentJobs: 4,
	},
	4: {
		name: 'Enterprise',
		minVram: 24,
		minRenderScore: 80,
		jobPriority: 'priority',
		maxConcurrentJobs: 8,
	},
} as const;

// Supported GPU manufacturers
export const GPU_MANUFACTURERS = ['nvidia', 'amd'] as const;

// Get GPU by ID
export function getGpuById(id: string): GpuType | undefined {
	return GPU_TYPES[id];
}

// Get GPUs by tier
export function getGpusByTier(tier: 1 | 2 | 3 | 4): GpuType[] {
	return Object.values(GPU_TYPES).filter(gpu => gpu.tier === tier);
}

// Get GPUs by minimum VRAM
export function getGpusByMinVram(minVram: number): GpuType[] {
	return Object.values(GPU_TYPES).filter(gpu => gpu.vram >= minVram);
}

export type GpuTier = keyof typeof GPU_TIERS;
export type GpuManufacturer = typeof GPU_MANUFACTURERS[number];
