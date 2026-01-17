/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	calculateJobCost,
	applyVolumeDiscount,
	formatPrice,
	getGpuTierMultiplier,
} from '../../nodes/Render/utils/pricingUtils';

describe('Pricing Utils', () => {
	describe('calculateJobCost', () => {
		it('should calculate basic job cost', () => {
			const cost = calculateJobCost({
				basePrice: 0.01,
				frames: 100,
				gpuHours: 1,
			});
			expect(cost).toBeGreaterThan(0);
		});

		it('should apply GPU tier multiplier', () => {
			const baseCost = calculateJobCost({
				basePrice: 0.01,
				frames: 100,
				gpuHours: 1,
				gpuTier: 1,
			});
			const premiumCost = calculateJobCost({
				basePrice: 0.01,
				frames: 100,
				gpuHours: 1,
				gpuTier: 4,
			});
			expect(premiumCost).toBeGreaterThan(baseCost);
		});
	});

	describe('applyVolumeDiscount', () => {
		it('should apply discount for high volume', () => {
			const originalPrice = 100;
			const discounted = applyVolumeDiscount(originalPrice, 1000);
			expect(discounted).toBeLessThan(originalPrice);
		});

		it('should not apply discount below threshold', () => {
			const originalPrice = 100;
			const notDiscounted = applyVolumeDiscount(originalPrice, 10);
			expect(notDiscounted).toBe(originalPrice);
		});
	});

	describe('formatPrice', () => {
		it('should format price with currency', () => {
			expect(formatPrice(10.5, 'RENDER')).toBe('10.50 RENDER');
			expect(formatPrice(100, 'USD')).toBe('$100.00');
		});

		it('should handle decimal places', () => {
			expect(formatPrice(10.12345, 'RENDER', 4)).toBe('10.1235 RENDER');
		});
	});

	describe('getGpuTierMultiplier', () => {
		it('should return correct multipliers', () => {
			expect(getGpuTierMultiplier(1)).toBe(1);
			expect(getGpuTierMultiplier(2)).toBe(1.5);
			expect(getGpuTierMultiplier(3)).toBe(2);
			expect(getGpuTierMultiplier(4)).toBe(3);
		});

		it('should handle invalid tiers', () => {
			expect(getGpuTierMultiplier(0)).toBe(1);
			expect(getGpuTierMultiplier(5)).toBe(1);
		});
	});
});
