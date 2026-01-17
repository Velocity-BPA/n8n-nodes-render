/**
 * Unit Converter Utilities for Render Network
 * Conversion helpers for tokens, time, and other units
 */

import { RENDER_TOKEN } from '../constants/networks';

// RENDER token constants
const RENDER_DECIMALS = RENDER_TOKEN.solana.decimals; // 8 decimals

// Render Network uses OB (Object Budget) as an internal unit
// 1 RENDER = 1000 OB (for pricing calculations)
const OB_PER_RENDER = 1000;

/**
 * Convert RENDER to OB (Object Budget)
 * OB is the internal pricing unit
 */
export function renderToOb(render: number): number {
	return render * OB_PER_RENDER;
}

/**
 * Convert OB (Object Budget) to RENDER
 */
export function obToRender(ob: number): number {
	return ob / OB_PER_RENDER;
}

/**
 * Convert RENDER amount to smallest unit (lamports equivalent)
 */
export function toSmallestUnit(amount: number | string): bigint {
	const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
	return BigInt(Math.floor(numAmount * Math.pow(10, RENDER_DECIMALS)));
}

/**
 * Convert from smallest unit to RENDER
 */
export function fromSmallestUnit(amount: bigint | string | number): number {
	const bigAmount = typeof amount === 'bigint' ? amount : BigInt(amount);
	return Number(bigAmount) / Math.pow(10, RENDER_DECIMALS);
}

/**
 * Format RENDER amount for display
 */
export function formatRender(
	amount: number,
	options: {
		decimals?: number;
		symbol?: boolean;
		compact?: boolean;
	} = {}
): string {
	const decimals = options.decimals ?? 4;
	const showSymbol = options.symbol ?? true;
	const compact = options.compact ?? false;

	let formatted: string;

	if (compact && amount >= 1000000) {
		formatted = (amount / 1000000).toFixed(2) + 'M';
	} else if (compact && amount >= 1000) {
		formatted = (amount / 1000).toFixed(2) + 'K';
	} else {
		formatted = amount.toFixed(decimals);
	}

	return showSymbol ? `${formatted} RENDER` : formatted;
}

/**
 * Parse RENDER amount from string
 */
export function parseRender(input: string): number {
	// Remove currency symbol and whitespace
	const cleaned = input.replace(/[^\d.-]/g, '');
	const parsed = parseFloat(cleaned);
	return isNaN(parsed) ? 0 : parsed;
}

// SOL constants
const LAMPORTS_PER_SOL = 1_000_000_000;

/**
 * Convert SOL to lamports
 */
export function solToLamports(sol: number): number {
	return Math.floor(sol * LAMPORTS_PER_SOL);
}

/**
 * Convert lamports to SOL
 */
export function lamportsToSol(lamports: number | bigint): number {
	return Number(lamports) / LAMPORTS_PER_SOL;
}

/**
 * Format SOL amount for display
 */
export function formatSol(
	lamports: number | bigint,
	options: { decimals?: number; symbol?: boolean } = {}
): string {
	const sol = lamportsToSol(lamports);
	const decimals = options.decimals ?? 4;
	const showSymbol = options.symbol ?? true;
	
	const formatted = sol.toFixed(decimals);
	return showSymbol ? `${formatted} SOL` : formatted;
}

// Time conversions

/**
 * Convert seconds to human-readable duration
 */
export function secondsToDuration(seconds: number): string {
	if (seconds < 60) {
		return `${Math.round(seconds)}s`;
	}
	
	if (seconds < 3600) {
		const mins = Math.floor(seconds / 60);
		const secs = Math.round(seconds % 60);
		return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
	}
	
	if (seconds < 86400) {
		const hours = Math.floor(seconds / 3600);
		const mins = Math.floor((seconds % 3600) / 60);
		return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
	}
	
	const days = Math.floor(seconds / 86400);
	const hours = Math.floor((seconds % 86400) / 3600);
	return hours > 0 ? `${days}d ${hours}h` : `${days}d`;
}

/**
 * Parse duration string to seconds
 */
export function durationToSeconds(duration: string): number {
	let total = 0;
	
	// Match patterns like "1d", "2h", "30m", "45s"
	const dayMatch = duration.match(/(\d+)\s*d/i);
	const hourMatch = duration.match(/(\d+)\s*h/i);
	const minMatch = duration.match(/(\d+)\s*m/i);
	const secMatch = duration.match(/(\d+)\s*s/i);
	
	if (dayMatch) total += parseInt(dayMatch[1]) * 86400;
	if (hourMatch) total += parseInt(hourMatch[1]) * 3600;
	if (minMatch) total += parseInt(minMatch[1]) * 60;
	if (secMatch) total += parseInt(secMatch[1]);
	
	return total;
}

/**
 * Convert GPU hours to human-readable format
 */
export function formatGpuHours(hours: number): string {
	if (hours < 1) {
		const minutes = Math.round(hours * 60);
		return `${minutes} GPU-minutes`;
	}
	
	if (hours < 24) {
		return `${hours.toFixed(2)} GPU-hours`;
	}
	
	const days = hours / 24;
	return `${days.toFixed(2)} GPU-days`;
}

// Data size conversions

/**
 * Convert bytes to human-readable size
 */
export function bytesToSize(bytes: number, decimals: number = 2): string {
	if (bytes === 0) return '0 Bytes';
	
	const k = 1024;
	const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	
	return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Parse size string to bytes
 */
export function sizeToBytes(size: string): number {
	const match = size.match(/^([\d.]+)\s*(bytes?|kb|mb|gb|tb|pb)?$/i);
	if (!match) return 0;
	
	const value = parseFloat(match[1]);
	const unit = (match[2] || 'bytes').toLowerCase();
	
	const multipliers: Record<string, number> = {
		byte: 1,
		bytes: 1,
		kb: 1024,
		mb: 1024 ** 2,
		gb: 1024 ** 3,
		tb: 1024 ** 4,
		pb: 1024 ** 5,
	};
	
	return value * (multipliers[unit] || 1);
}

// Resolution helpers

/**
 * Calculate total pixels from resolution
 */
export function resolutionToPixels(width: number, height: number): number {
	return width * height;
}

/**
 * Calculate megapixels from resolution
 */
export function resolutionToMegapixels(width: number, height: number): number {
	return (width * height) / 1_000_000;
}

/**
 * Format resolution for display
 */
export function formatResolution(width: number, height: number): string {
	// Check for common resolutions
	const common: Record<string, string> = {
		'1280x720': '720p HD',
		'1920x1080': '1080p Full HD',
		'2560x1440': '1440p QHD',
		'3840x2160': '4K UHD',
		'7680x4320': '8K UHD',
	};
	
	const key = `${width}x${height}`;
	if (common[key]) {
		return `${key} (${common[key]})`;
	}
	
	return key;
}

// Progress helpers

/**
 * Calculate progress percentage (internal helper)
 */
function calcProgressPercent(current: number, total: number): number {
	if (total <= 0) return 0;
	return Math.min(100, Math.max(0, (current / total) * 100));
}

/**
 * Format progress for display
 */
export function formatProgress(
	current: number,
	total: number,
	options: { decimals?: number; showFraction?: boolean } = {}
): string {
	const percentage = calcProgressPercent(current, total);
	const decimals = options.decimals ?? 1;
	
	if (options.showFraction) {
		return `${current}/${total} (${percentage.toFixed(decimals)}%)`;
	}
	
	return `${percentage.toFixed(decimals)}%`;
}

// Timestamp helpers

/**
 * Format timestamp for display
 */
export function formatTimestamp(
	timestamp: number | string | Date,
	options: { includeTime?: boolean; relative?: boolean } = {}
): string {
	const date = new Date(timestamp);
	
	if (options.relative) {
		const now = Date.now();
		const diff = now - date.getTime();
		
		if (diff < 60000) return 'just now';
		if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
		if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
		if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
	}
	
	const dateStr = date.toLocaleDateString();
	
	if (options.includeTime) {
		return `${dateStr} ${date.toLocaleTimeString()}`;
	}
	
	return dateStr;
}

/**
 * Parse various timestamp formats to Date
 */
export function parseTimestamp(input: string | number): Date {
	if (typeof input === 'number') {
		// Assume Unix timestamp (seconds or milliseconds)
		if (input < 10000000000) {
			return new Date(input * 1000);
		}
		return new Date(input);
	}
	
	return new Date(input);
}
