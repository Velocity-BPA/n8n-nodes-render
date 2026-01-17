/**
 * Staking Resource Actions
 * Operations for RENDER token staking on Render Network
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const stakingOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['staking'] } },
		options: [
			{ name: 'Get Stake Info', value: 'getStakeInfo', description: 'Get staking information', action: 'Get stake info' },
			{ name: 'Stake RENDER', value: 'stakeRender', description: 'Stake RENDER tokens', action: 'Stake RENDER' },
			{ name: 'Unstake RENDER', value: 'unstakeRender', description: 'Unstake RENDER tokens', action: 'Unstake RENDER' },
			{ name: 'Get Staking Rewards', value: 'getStakingRewards', description: 'Get available staking rewards', action: 'Get staking rewards' },
			{ name: 'Claim Rewards', value: 'claimRewards', description: 'Claim staking rewards', action: 'Claim rewards' },
			{ name: 'Get Staking APY', value: 'getStakingApy', description: 'Get current staking APY', action: 'Get staking APY' },
			{ name: 'Get Lock Period', value: 'getLockPeriod', description: 'Get staking lock period info', action: 'Get lock period' },
			{ name: 'Get Stake Position', value: 'getStakePosition', description: 'Get current stake position', action: 'Get stake position' },
			{ name: 'Get Staking History', value: 'getStakingHistory', description: 'Get staking history', action: 'Get staking history' },
			{ name: 'Get Node Stakes', value: 'getNodeStakes', description: 'Get stakes for a node', action: 'Get node stakes' },
			{ name: 'Delegate Stake', value: 'delegateStake', description: 'Delegate stake to a node', action: 'Delegate stake' },
		],
		default: 'getStakeInfo',
	},
];

export const stakingFields: INodeProperties[] = [
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		required: true,
		displayOptions: { show: { resource: ['staking'], operation: ['getStakeInfo', 'getStakingRewards', 'getStakePosition', 'getStakingHistory', 'stakeRender', 'unstakeRender', 'claimRewards', 'delegateStake'] } },
		default: '',
		description: 'Wallet address for staking operations',
	},
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		required: true,
		displayOptions: { show: { resource: ['staking'], operation: ['stakeRender', 'unstakeRender', 'delegateStake'] } },
		default: 0,
		description: 'Amount of RENDER tokens',
	},
	{
		displayName: 'Node ID',
		name: 'nodeId',
		type: 'string',
		displayOptions: { show: { resource: ['staking'], operation: ['getNodeStakes', 'delegateStake'] } },
		default: '',
		description: 'Node ID for staking operations',
	},
	{
		displayName: 'Lock Period',
		name: 'lockPeriod',
		type: 'options',
		displayOptions: { show: { resource: ['staking'], operation: ['stakeRender'] } },
		options: [
			{ name: '30 Days', value: '30' },
			{ name: '90 Days', value: '90' },
			{ name: '180 Days', value: '180' },
			{ name: '365 Days', value: '365' },
		],
		default: '30',
		description: 'Lock period for staking',
	},
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		displayOptions: { show: { resource: ['staking'], operation: ['getStakingHistory'] } },
		default: 50,
		description: 'Maximum number of history entries to return',
	},
];

export async function executeStakingOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});

	switch (operation) {
		case 'getStakeInfo': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.getStakingInfo(walletAddress);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				staked: data?.staked || 0,
				locked: data?.locked || 0,
				available: data?.available || 0,
				rewards: data?.rewards || 0,
				apy: data?.apy || 0,
				lockEndDate: data?.lockEndDate || '',
				error: result.error,
			};
		}

		case 'stakeRender': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const amount = this.getNodeParameter('amount', i) as number;
			const lockPeriod = this.getNodeParameter('lockPeriod', i) as string;
			const result = await apiClient.stakeTokens(walletAddress, amount, parseInt(lockPeriod, 10));
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				amount,
				lockPeriod: `${lockPeriod} days`,
				staked: data?.staked || false,
				txHash: data?.txHash || '',
				lockEndDate: data?.lockEndDate || '',
				error: result.error,
			};
		}

		case 'unstakeRender': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const amount = this.getNodeParameter('amount', i) as number;
			const result = await apiClient.unstakeTokens(walletAddress, amount);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				amount,
				unstaked: data?.unstaked || false,
				txHash: data?.txHash || '',
				error: result.error,
			};
		}

		case 'getStakingRewards': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.getStakingRewards(walletAddress);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				pendingRewards: data?.pendingRewards || 0,
				claimedRewards: data?.claimedRewards || 0,
				totalRewards: data?.totalRewards || 0,
				history: data?.history || [],
				error: result.error,
			};
		}

		case 'claimRewards': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.claimStakingRewards(walletAddress);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				claimed: data?.claimed || false,
				txHash: data?.txHash || '',
				amount: data?.amount || 0,
				error: result.error,
			};
		}

		case 'getStakingApy': {
			const result = await apiClient.getStakingApy();
			const data = result.data;
			return {
				success: result.success,
				currentApy: data?.currentApy || 0,
				projectedApy: data?.projectedApy || 0,
				historicalApy: data?.historicalApy || [],
				apyByLockPeriod: {
					'30': 5.0,
					'90': 7.5,
					'180': 10.0,
					'365': 15.0,
				},
				error: result.error,
			};
		}

		case 'getLockPeriod': {
			return {
				success: true,
				availablePeriods: ['30 days', '90 days', '180 days', '365 days'],
				bonusRates: {
					'30': '1x',
					'90': '1.5x',
					'180': '2x',
					'365': '3x',
				},
				minStakeAmount: 100,
			};
		}

		case 'getStakePosition': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const result = await apiClient.getStakingInfo(walletAddress);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				staked: data?.staked || 0,
				locked: data?.locked || 0,
				available: data?.available || 0,
				rewards: data?.rewards || 0,
				apy: data?.apy || 0,
				error: result.error,
			};
		}

		case 'getStakingHistory': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const limit = this.getNodeParameter('limit', i) as number;
			const result = await apiClient.getStakingHistory(walletAddress, { limit });
			const data = result.data || [];
			return {
				success: result.success,
				walletAddress,
				history: data,
				count: Array.isArray(data) ? data.length : 0,
				error: result.error,
			};
		}

		case 'getNodeStakes': {
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const result = await apiClient.getNodeStakes(nodeId);
			const data = result.data;
			return {
				success: result.success,
				nodeId,
				totalStaked: data?.totalStaked || 0,
				stakers: data?.stakers || [],
				error: result.error,
			};
		}

		case 'delegateStake': {
			const walletAddress = this.getNodeParameter('walletAddress', i) as string;
			const nodeId = this.getNodeParameter('nodeId', i) as string;
			const amount = this.getNodeParameter('amount', i) as number;
			const result = await apiClient.delegateStake(walletAddress, nodeId, amount);
			const data = result.data;
			return {
				success: result.success,
				walletAddress,
				nodeId,
				amount,
				delegated: data?.delegated || false,
				txHash: data?.txHash || '',
				error: result.error,
			};
		}

		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
