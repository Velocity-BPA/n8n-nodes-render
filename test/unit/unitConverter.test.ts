/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	lamportsToSol,
	solToLamports,
	renderToSmallestUnit,
	smallestUnitToRender,
	formatTokenAmount,
	parseTokenAmount,
} from '../../nodes/Render/utils/unitConverter';

describe('Unit Converter Utils', () => {
	describe('lamportsToSol', () => {
		it('should convert lamports to SOL correctly', () => {
			expect(lamportsToSol(1000000000)).toBe(1);
			expect(lamportsToSol(500000000)).toBe(0.5);
			expect(lamportsToSol(0)).toBe(0);
		});

		it('should handle large values', () => {
			expect(lamportsToSol(100000000000)).toBe(100);
		});
	});

	describe('solToLamports', () => {
		it('should convert SOL to lamports correctly', () => {
			expect(solToLamports(1)).toBe(1000000000);
			expect(solToLamports(0.5)).toBe(500000000);
			expect(solToLamports(0)).toBe(0);
		});
	});

	describe('renderToSmallestUnit', () => {
		it('should convert RENDER to smallest unit', () => {
			expect(renderToSmallestUnit(1)).toBe(1000000000000000000n);
			expect(renderToSmallestUnit(0)).toBe(0n);
		});
	});

	describe('smallestUnitToRender', () => {
		it('should convert smallest unit to RENDER', () => {
			expect(smallestUnitToRender(1000000000000000000n)).toBe(1);
			expect(smallestUnitToRender(0n)).toBe(0);
		});
	});

	describe('formatTokenAmount', () => {
		it('should format token amounts correctly', () => {
			expect(formatTokenAmount(1.5, 'RENDER')).toBe('1.5 RENDER');
			expect(formatTokenAmount(100, 'SOL')).toBe('100 SOL');
		});

		it('should handle decimal places', () => {
			expect(formatTokenAmount(1.123456789, 'RENDER', 4)).toBe('1.1235 RENDER');
		});
	});

	describe('parseTokenAmount', () => {
		it('should parse token amount strings', () => {
			expect(parseTokenAmount('1.5 RENDER')).toBe(1.5);
			expect(parseTokenAmount('100 SOL')).toBe(100);
		});

		it('should handle plain numbers', () => {
			expect(parseTokenAmount('42')).toBe(42);
		});
	});
});
