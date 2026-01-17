/*
 * Copyright (c) Velocity BPA, LLC
 * Licensed under the Business Source License 1.1
 * Commercial use requires a separate commercial license.
 * See LICENSE file for details.
 */

import {
	formatJobStatus,
	calculateProgress,
	estimateRemainingTime,
	parseFrameRange,
	generateJobId,
} from '../../nodes/Render/utils/jobUtils';

describe('Job Utils', () => {
	describe('formatJobStatus', () => {
		it('should format job status correctly', () => {
			expect(formatJobStatus('pending')).toBe('Pending');
			expect(formatJobStatus('running')).toBe('Running');
			expect(formatJobStatus('completed')).toBe('Completed');
			expect(formatJobStatus('failed')).toBe('Failed');
		});

		it('should handle unknown status', () => {
			expect(formatJobStatus('unknown_status')).toBe('Unknown_status');
		});
	});

	describe('calculateProgress', () => {
		it('should calculate progress percentage', () => {
			expect(calculateProgress(50, 100)).toBe(50);
			expect(calculateProgress(0, 100)).toBe(0);
			expect(calculateProgress(100, 100)).toBe(100);
		});

		it('should handle edge cases', () => {
			expect(calculateProgress(0, 0)).toBe(0);
			expect(calculateProgress(10, 0)).toBe(0);
		});

		it('should clamp values to 0-100', () => {
			expect(calculateProgress(150, 100)).toBe(100);
			expect(calculateProgress(-10, 100)).toBe(0);
		});
	});

	describe('estimateRemainingTime', () => {
		it('should estimate remaining time', () => {
			const result = estimateRemainingTime(50, 100, 60000);
			expect(result).toBeGreaterThan(0);
		});

		it('should return 0 when complete', () => {
			expect(estimateRemainingTime(100, 100, 60000)).toBe(0);
		});

		it('should handle zero elapsed time', () => {
			expect(estimateRemainingTime(0, 100, 0)).toBe(0);
		});
	});

	describe('parseFrameRange', () => {
		it('should parse simple range', () => {
			expect(parseFrameRange('1-100')).toEqual({ start: 1, end: 100 });
		});

		it('should parse single frame', () => {
			expect(parseFrameRange('50')).toEqual({ start: 50, end: 50 });
		});

		it('should handle comma-separated frames', () => {
			expect(parseFrameRange('1,5,10')).toEqual({ start: 1, end: 10 });
		});
	});

	describe('generateJobId', () => {
		it('should generate unique job IDs', () => {
			const id1 = generateJobId();
			const id2 = generateJobId();
			expect(id1).not.toBe(id2);
		});

		it('should include prefix', () => {
			const id = generateJobId('render');
			expect(id.startsWith('render_')).toBe(true);
		});
	});
});
