/**
 * Scene Utilities for Render Network
 * Helper functions for scene file handling and validation
 */

import { SCENE_FORMATS, RENDER_ENGINES } from '../constants/formats';

export interface SceneInfo {
	filename: string;
	format: string;
	size: number;
	valid: boolean;
	engine?: string;
	assets?: string[];
	errors?: string[];
}

export interface SceneValidationOptions {
	checkSize?: boolean;
	checkFormat?: boolean;
	maxSize?: number;
}

/**
 * Validate a scene file
 */
export function validateSceneFile(
	filename: string,
	fileSize: number,
	options: SceneValidationOptions = {}
): {
	valid: boolean;
	errors: string[];
	warnings: string[];
	format?: string;
} {
	const errors: string[] = [];
	const warnings: string[] = [];
	let format: string | undefined;

	// Extract extension
	const ext = filename.toLowerCase().split('.').pop() || '';

	// Check format support
	if (options.checkFormat !== false) {
		const formatInfo = Object.entries(SCENE_FORMATS).find(
			([_, f]) => f.extension.slice(1) === ext
		);

		if (!formatInfo) {
			errors.push(`Unsupported scene format: .${ext}`);
		} else {
			format = formatInfo[0];
			if (!formatInfo[1].supported) {
				warnings.push(`Format .${ext} has limited support`);
			}

			// Check file size
			if (options.checkSize !== false) {
				const maxSize = options.maxSize || formatInfo[1].maxSize;
				if (fileSize > maxSize) {
					errors.push(
						`File size (${formatBytes(fileSize)}) exceeds maximum allowed ` +
						`(${formatBytes(maxSize)}) for .${ext} format`
					);
				}
			}
		}
	}

	// General size check
	if (fileSize <= 0) {
		errors.push('File appears to be empty');
	}

	return {
		valid: errors.length === 0,
		errors,
		warnings,
		format,
	};
}

/**
 * Detect the appropriate render engine for a scene format
 */
export function detectRenderEngine(filename: string): string | null {
	const ext = filename.toLowerCase().split('.').pop() || '';

	const engineMapping: Record<string, string> = {
		orbx: 'octane',
		ocs: 'octane',
		blend: 'cycles',
		c4d: 'octane', // C4D often uses Octane
		max: 'arnold',
		ma: 'arnold',
		mb: 'arnold',
		hip: 'redshift',
		usd: 'cycles',
		usda: 'cycles',
		usdc: 'cycles',
	};

	return engineMapping[ext] || null;
}

/**
 * Get supported plugins for a scene format
 */
export function getSupportedPlugins(format: string): string[] {
	const pluginMapping: Record<string, string[]> = {
		blend: ['Octane Blender', 'LuxCore', 'Cycles'],
		c4d: ['Octane C4D', 'Redshift', 'Arnold'],
		max: ['Octane Max', 'V-Ray', 'Arnold', 'Corona'],
		maya: ['Octane Maya', 'Arnold', 'V-Ray', 'Redshift'],
		houdini: ['Octane Houdini', 'Redshift', 'Karma'],
	};

	return pluginMapping[format.toLowerCase()] || [];
}

/**
 * Extract scene metadata from filename
 */
export function parseSceneFilename(filename: string): {
	name: string;
	extension: string;
	version?: string;
	variant?: string;
} {
	// Remove path if present
	const basename = filename.split(/[/\\]/).pop() || filename;
	
	// Split name and extension
	const lastDot = basename.lastIndexOf('.');
	const name = lastDot > 0 ? basename.slice(0, lastDot) : basename;
	const extension = lastDot > 0 ? basename.slice(lastDot + 1) : '';

	// Try to extract version (e.g., _v1, _v02, .v3)
	const versionMatch = name.match(/[._]v(\d+)$/i);
	const version = versionMatch ? versionMatch[1] : undefined;

	// Try to extract variant (e.g., _final, _wip, _render)
	const variantMatch = name.match(/[._](final|wip|render|preview|draft)$/i);
	const variant = variantMatch ? variantMatch[1].toLowerCase() : undefined;

	return {
		name: name.replace(/[._]v\d+$/i, '').replace(/[._](final|wip|render|preview|draft)$/i, ''),
		extension,
		version,
		variant,
	};
}

/**
 * Generate output filename based on scene and settings
 */
export function generateOutputFilename(
	sceneName: string,
	frameNumber: number | null,
	outputFormat: string,
	options: {
		prefix?: string;
		suffix?: string;
		paddedFrames?: number;
	} = {}
): string {
	let filename = options.prefix || '';
	
	// Add scene name (sanitized)
	filename += sceneName.replace(/[^a-zA-Z0-9_-]/g, '_');
	
	// Add frame number if applicable
	if (frameNumber !== null) {
		const padding = options.paddedFrames || 4;
		filename += `_${String(frameNumber).padStart(padding, '0')}`;
	}
	
	// Add suffix
	if (options.suffix) {
		filename += `_${options.suffix}`;
	}
	
	// Add extension
	const ext = outputFormat.startsWith('.') ? outputFormat : `.${outputFormat}`;
	filename += ext;
	
	return filename;
}

/**
 * Calculate estimated scene complexity
 */
export function estimateSceneComplexity(
	fileSize: number,
	format: string
): 'low' | 'medium' | 'high' | 'extreme' {
	// Size thresholds in bytes
	const thresholds = {
		low: 50 * 1024 * 1024,      // 50 MB
		medium: 200 * 1024 * 1024,   // 200 MB
		high: 500 * 1024 * 1024,     // 500 MB
	};

	// Format multipliers (some formats are more compact)
	const formatMultipliers: Record<string, number> = {
		blend: 1.0,
		c4d: 0.8,
		orbx: 1.5,  // ORBX is already optimized
		max: 0.9,
		usd: 1.2,
	};

	const multiplier = formatMultipliers[format.toLowerCase()] || 1.0;
	const adjustedSize = fileSize / multiplier;

	if (adjustedSize < thresholds.low) return 'low';
	if (adjustedSize < thresholds.medium) return 'medium';
	if (adjustedSize < thresholds.high) return 'high';
	return 'extreme';
}

/**
 * Get render engine info
 */
export function getRenderEngineInfo(engine: string): {
	name: string;
	version: string;
	gpuRequired: boolean;
	supported: boolean;
} | null {
	const engineInfo = RENDER_ENGINES[engine.toLowerCase() as keyof typeof RENDER_ENGINES];
	return engineInfo || null;
}

/**
 * Format file size in human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
	if (bytes === 0) return '0 Bytes';

	const k = 1024;
	const dm = decimals < 0 ? 0 : decimals;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

	const i = Math.floor(Math.log(bytes) / Math.log(k));

	return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Parse file size from string (e.g., "10MB", "1.5GB")
 */
export function parseFileSize(sizeStr: string): number {
	const match = sizeStr.match(/^([\d.]+)\s*(bytes?|kb|mb|gb|tb)$/i);
	if (!match) return 0;

	const value = parseFloat(match[1]);
	const unit = match[2].toLowerCase();

	const multipliers: Record<string, number> = {
		byte: 1,
		bytes: 1,
		kb: 1024,
		mb: 1024 * 1024,
		gb: 1024 * 1024 * 1024,
		tb: 1024 * 1024 * 1024 * 1024,
	};

	return value * (multipliers[unit] || 1);
}
