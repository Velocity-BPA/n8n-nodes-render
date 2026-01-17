/**
 * Pricing Utilities for Render Network
 * Helper functions for cost calculations and pricing
 */

import { GPU_TYPES } from '../constants/gpuTypes';
import { RENDER_QUALITY_PRESETS } from '../constants/formats';

export interface PricingConfig {
	baseRatePerGpuHour: number;  // In RENDER tokens
	priorityMultipliers: Record<string, number>;
	qualityMultipliers: Record<string, number>;
	volumeDiscounts: Array<{ threshold: number; discount: number }>;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
	baseRatePerGpuHour: 0.5,  // 0.5 RENDER per GPU hour
	priorityMultipliers: {
		low: 0.8,
		normal: 1.0,
		high: 1.5,
		priority: 2.0,
	},
	qualityMultipliers: {
		draft: 0.25,
		preview: 0.5,
		production: 1.0,
		highQuality: 2.0,
		ultra: 4.0,
	},
	volumeDiscounts: [
		{ threshold: 100, discount: 0.05 },    // 5% off over 100 hours
		{ threshold: 500, discount: 0.10 },    // 10% off over 500 hours
		{ threshold: 1000, discount: 0.15 },   // 15% off over 1000 hours
		{ threshold: 5000, discount: 0.20 },   // 20% off over 5000 hours
	],
};

export interface CostEstimate {
	baseCost: number;
	gpuCost: number;
	priorityCost: number;
	qualityCost: number;
	volumeDiscount: number;
	totalCost: number;
	currency: string;
	breakdown: {
		gpuHours: number;
		gpuType: string;
		priority: string;
		quality: string;
	};
}

/**
 * Calculate estimated cost for a render job
 */
export function calculateRenderCost(params: {
	gpuHours: number;
	gpuType?: string;
	priority?: string;
	quality?: string;
	config?: Partial<PricingConfig>;
}): CostEstimate {
	const config = { ...DEFAULT_PRICING_CONFIG, ...params.config };
	
	// Get GPU price multiplier
	const gpuInfo = params.gpuType ? GPU_TYPES[params.gpuType] : null;
	const gpuMultiplier = gpuInfo?.priceMultiplier || 1.0;

	// Get priority multiplier
	const priorityMultiplier = config.priorityMultipliers[params.priority || 'normal'] || 1.0;

	// Get quality multiplier
	const qualityMultiplier = config.qualityMultipliers[params.quality || 'production'] || 1.0;

	// Calculate base cost
	const baseCost = params.gpuHours * config.baseRatePerGpuHour;

	// Calculate individual costs
	const gpuCost = baseCost * (gpuMultiplier - 1);
	const priorityCost = baseCost * (priorityMultiplier - 1);
	const qualityCost = baseCost * (qualityMultiplier - 1);

	// Calculate subtotal before discount
	const subtotal = baseCost + gpuCost + priorityCost + qualityCost;

	// Calculate volume discount
	let volumeDiscount = 0;
	for (const tier of config.volumeDiscounts) {
		if (params.gpuHours >= tier.threshold) {
			volumeDiscount = subtotal * tier.discount;
		}
	}

	// Calculate total
	const totalCost = subtotal - volumeDiscount;

	return {
		baseCost: roundTo(baseCost, 6),
		gpuCost: roundTo(gpuCost, 6),
		priorityCost: roundTo(priorityCost, 6),
		qualityCost: roundTo(qualityCost, 6),
		volumeDiscount: roundTo(volumeDiscount, 6),
		totalCost: roundTo(totalCost, 6),
		currency: 'RENDER',
		breakdown: {
			gpuHours: params.gpuHours,
			gpuType: params.gpuType || 'auto',
			priority: params.priority || 'normal',
			quality: params.quality || 'production',
		},
	};
}

/**
 * Estimate GPU hours needed for a render job
 */
export function estimateGpuHours(params: {
	frames: number;
	resolution: { width: number; height: number };
	samples?: number;
	complexity?: 'low' | 'medium' | 'high' | 'extreme';
	gpuType?: string;
}): number {
	// Base time per megapixel per 1000 samples (in hours)
	const baseTimePerMpPer1kSamples = 0.001;

	// Calculate megapixels
	const megapixels = (params.resolution.width * params.resolution.height) / 1000000;

	// Get sample count (default to production quality)
	const samples = params.samples || RENDER_QUALITY_PRESETS.production.samples;

	// Complexity multipliers
	const complexityMultipliers = {
		low: 0.5,
		medium: 1.0,
		high: 2.0,
		extreme: 4.0,
	};
	const complexityMultiplier = complexityMultipliers[params.complexity || 'medium'];

	// GPU performance multiplier (faster GPU = fewer hours)
	const gpuInfo = params.gpuType ? GPU_TYPES[params.gpuType] : null;
	const gpuPerformance = gpuInfo ? (100 / gpuInfo.renderScore) : 1.0;

	// Calculate estimated hours
	const hoursPerFrame = baseTimePerMpPer1kSamples * megapixels * (samples / 1000) * complexityMultiplier * gpuPerformance;
	const totalHours = hoursPerFrame * params.frames;

	return roundTo(totalHours, 4);
}

/**
 * Calculate AI compute cost
 */
export function calculateAICost(params: {
	gpuHours: number;
	gpuType?: string;
	modelSize?: 'small' | 'medium' | 'large' | 'xlarge';
}): CostEstimate {
	// AI pricing is typically higher due to specialized workloads
	const aiBaseRateMultiplier = 1.5;
	
	// Model size multipliers
	const modelSizeMultipliers = {
		small: 0.5,
		medium: 1.0,
		large: 2.0,
		xlarge: 4.0,
	};

	const config: PricingConfig = {
		...DEFAULT_PRICING_CONFIG,
		baseRatePerGpuHour: DEFAULT_PRICING_CONFIG.baseRatePerGpuHour * aiBaseRateMultiplier,
	};

	const modelMultiplier = modelSizeMultipliers[params.modelSize || 'medium'];
	const adjustedHours = params.gpuHours * modelMultiplier;

	return calculateRenderCost({
		gpuHours: adjustedHours,
		gpuType: params.gpuType,
		priority: 'normal',
		quality: 'production',
		config,
	});
}

/**
 * Get pricing tier based on usage
 */
export function getPricingTier(totalGpuHours: number): {
	tier: string;
	discount: number;
	nextTier?: { threshold: number; discount: number };
} {
	const tiers = DEFAULT_PRICING_CONFIG.volumeDiscounts;
	
	let currentTier = { tier: 'standard', discount: 0 };
	let nextTier: { threshold: number; discount: number } | undefined;

	for (let i = 0; i < tiers.length; i++) {
		if (totalGpuHours >= tiers[i].threshold) {
			currentTier = {
				tier: getTierName(i + 1),
				discount: tiers[i].discount,
			};
			if (i + 1 < tiers.length) {
				nextTier = tiers[i + 1];
			}
		} else if (!nextTier) {
			nextTier = tiers[i];
			break;
		}
	}

	return { ...currentTier, nextTier };
}

/**
 * Get tier name from index
 */
function getTierName(index: number): string {
	const tierNames = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
	return tierNames[Math.min(index, tierNames.length - 1)] || 'standard';
}

/**
 * Calculate cost savings with different configurations
 */
export function compareCosts(params: {
	gpuHours: number;
	configurations: Array<{
		gpuType?: string;
		priority?: string;
		quality?: string;
	}>;
}): Array<{
	config: { gpuType?: string; priority?: string; quality?: string };
	estimate: CostEstimate;
	savings?: number;
}> {
	const results = params.configurations.map(config => ({
		config,
		estimate: calculateRenderCost({
			gpuHours: params.gpuHours,
			...config,
		}),
	}));

	// Sort by total cost
	results.sort((a, b) => a.estimate.totalCost - b.estimate.totalCost);

	// Calculate savings compared to most expensive option
	const maxCost = results[results.length - 1]?.estimate.totalCost || 0;
	
	return results.map(r => ({
		...r,
		savings: roundTo(maxCost - r.estimate.totalCost, 6),
	}));
}

/**
 * Format cost for display
 */
export function formatCost(amount: number, currency: string = 'RENDER'): string {
	if (amount < 0.01) {
		return `< 0.01 ${currency}`;
	}
	return `${amount.toFixed(4)} ${currency}`;
}

/**
 * Convert between currencies (simplified)
 */
export function convertCurrency(
	amount: number,
	from: string,
	to: string,
	rates: Record<string, number>
): number {
	// Convert to base (USD)
	const inUsd = amount / (rates[from] || 1);
	// Convert to target
	return inUsd * (rates[to] || 1);
}

/**
 * Round to specified decimal places
 */
function roundTo(value: number, decimals: number): number {
	const multiplier = Math.pow(10, decimals);
	return Math.round(value * multiplier) / multiplier;
}
