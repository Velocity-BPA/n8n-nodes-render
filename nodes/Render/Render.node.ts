/**
 * Render Network Node
 * Main action node for Render Network operations
 */

import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

// Import all resource operations and fields
import { walletOperations, walletFields, executeWalletOperation } from './actions/wallet/wallet';
import { jobOperations, jobFields, executeJobOperation } from './actions/job/job';
import { renderingOperations, renderingFields, executeRenderingOperation } from './actions/rendering/rendering';
import { aiComputeOperations, aiComputeFields, executeAiComputeOperation } from './actions/aiCompute/aiCompute';
import { nodeOperations, nodeFields, executeNodeOperation } from './actions/node/node';
import { nodeOperatorOperations, nodeOperatorFields, executeNodeOperatorOperation } from './actions/nodeOperator/nodeOperator';
import { pricingOperations, pricingFields, executePricingOperation } from './actions/pricing/pricing';
import { stakingOperations, stakingFields, executeStakingOperation } from './actions/staking/staking';
import { escrowOperations, escrowFields, executeEscrowOperation } from './actions/escrow/escrow';
import { frameOperations, frameFields, executeFrameOperation } from './actions/frame/frame';
import { sceneOperations, sceneFields, executeSceneOperation } from './actions/scene/scene';
import { outputOperations, outputFields, executeOutputOperation } from './actions/output/output';
import { networkStatsOperations, networkStatsFields, executeNetworkStatsOperation } from './actions/networkStats/networkStats';
import { gpuOperations, gpuFields, executeGpuOperation } from './actions/gpu/gpu';
import { queueOperations, queueFields, executeQueueOperation } from './actions/queue/queue';
import { burnMintOperations, burnMintFields, executeBurnMintOperation } from './actions/burnMint/burnMint';
import { utilityOperations, utilityFields, executeUtilityOperation } from './actions/utility/utility';

export class Render implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Render Network',
		name: 'render',
		icon: 'file:render.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Interact with Render Network for GPU rendering and AI compute',
		defaults: {
			name: 'Render Network',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'renderNetwork',
				required: true,
				displayOptions: {
					show: {
						resource: ['wallet', 'staking', 'utility'],
					},
				},
			},
			{
				name: 'renderApi',
				required: true,
				displayOptions: {
					show: {
						resource: [
							'job', 'rendering', 'aiCompute', 'node', 'nodeOperator',
							'pricing', 'escrow', 'frame', 'scene', 'output',
							'networkStats', 'gpu', 'queue', 'burnMint',
						],
					},
				},
			},
			{
				name: 'nodeOperator',
				required: false,
				displayOptions: {
					show: {
						resource: ['node', 'nodeOperator'],
					},
				},
			},
		],
		properties: [
			// Resource Selection
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'AI Compute',
						value: 'aiCompute',
						description: 'AI inference and training operations',
					},
					{
						name: 'Burn-Mint (BME)',
						value: 'burnMint',
						description: 'Token burn-mint equilibrium operations',
					},
					{
						name: 'Escrow',
						value: 'escrow',
						description: 'Escrow account operations',
					},
					{
						name: 'Frame',
						value: 'frame',
						description: 'Individual frame operations',
					},
					{
						name: 'GPU',
						value: 'gpu',
						description: 'GPU information and reservation',
					},
					{
						name: 'Job',
						value: 'job',
						description: 'Render job management',
					},
					{
						name: 'Network Stats',
						value: 'networkStats',
						description: 'Network statistics and metrics',
					},
					{
						name: 'Node',
						value: 'node',
						description: 'Render node information',
					},
					{
						name: 'Node Operator',
						value: 'nodeOperator',
						description: 'Node operator management',
					},
					{
						name: 'Output',
						value: 'output',
						description: 'Rendered output management',
					},
					{
						name: 'Pricing',
						value: 'pricing',
						description: 'Pricing and cost information',
					},
					{
						name: 'Queue',
						value: 'queue',
						description: 'Job queue management',
					},
					{
						name: 'Rendering',
						value: 'rendering',
						description: '3D rendering operations',
					},
					{
						name: 'Scene',
						value: 'scene',
						description: 'Scene file management',
					},
					{
						name: 'Staking',
						value: 'staking',
						description: 'RENDER token staking',
					},
					{
						name: 'Utility',
						value: 'utility',
						description: 'Helper utilities and tools',
					},
					{
						name: 'Wallet',
						value: 'wallet',
						description: 'Wallet and balance operations',
					},
				],
				default: 'wallet',
			},

			// Operations for each resource
			...walletOperations,
			...jobOperations,
			...renderingOperations,
			...aiComputeOperations,
			...nodeOperations,
			...nodeOperatorOperations,
			...pricingOperations,
			...stakingOperations,
			...escrowOperations,
			...frameOperations,
			...sceneOperations,
			...outputOperations,
			...networkStatsOperations,
			...gpuOperations,
			...queueOperations,
			...burnMintOperations,
			...utilityOperations,

			// Fields for each resource
			...walletFields,
			...jobFields,
			...renderingFields,
			...aiComputeFields,
			...nodeFields,
			...nodeOperatorFields,
			...pricingFields,
			...stakingFields,
			...escrowFields,
			...frameFields,
			...sceneFields,
			...outputFields,
			...networkStatsFields,
			...gpuFields,
			...queueFields,
			...burnMintFields,
			...utilityFields,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let result;

				switch (resource) {
					case 'wallet':
						result = await executeWalletOperation.call(this, operation, i);
						break;
					case 'job':
						result = await executeJobOperation.call(this, operation, i);
						break;
					case 'rendering':
						result = await executeRenderingOperation.call(this, operation, i);
						break;
					case 'aiCompute':
						result = await executeAiComputeOperation.call(this, operation, i);
						break;
					case 'node':
						result = await executeNodeOperation.call(this, operation, i);
						break;
					case 'nodeOperator':
						result = await executeNodeOperatorOperation.call(this, operation, i);
						break;
					case 'pricing':
						result = await executePricingOperation.call(this, operation, i);
						break;
					case 'staking':
						result = await executeStakingOperation.call(this, operation, i);
						break;
					case 'escrow':
						result = await executeEscrowOperation.call(this, operation, i);
						break;
					case 'frame':
						result = await executeFrameOperation.call(this, operation, i);
						break;
					case 'scene':
						result = await executeSceneOperation.call(this, operation, i);
						break;
					case 'output':
						result = await executeOutputOperation.call(this, operation, i);
						break;
					case 'networkStats':
						result = await executeNetworkStatsOperation.call(this, operation, i);
						break;
					case 'gpu':
						result = await executeGpuOperation.call(this, operation, i);
						break;
					case 'queue':
						result = await executeQueueOperation.call(this, operation, i);
						break;
					case 'burnMint':
						result = await executeBurnMintOperation.call(this, operation, i);
						break;
					case 'utility':
						result = await executeUtilityOperation.call(this, operation, i);
						break;
					default:
						throw new Error(`Unknown resource: ${resource}`);
				}

				returnData.push({ json: result });
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: error instanceof Error ? error.message : String(error),
						},
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
