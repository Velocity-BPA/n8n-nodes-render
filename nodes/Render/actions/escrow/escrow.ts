import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { RenderApiClient } from '../../transport/renderApi';

export const escrowOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: { show: { resource: ['escrow'] } },
		options: [
			{ name: 'Get Escrow Balance', value: 'getEscrowBalance', description: 'Get escrow balance', action: 'Get escrow balance' },
			{ name: 'Deposit to Escrow', value: 'depositEscrow', description: 'Deposit to escrow', action: 'Deposit to escrow' },
			{ name: 'Withdraw from Escrow', value: 'withdrawEscrow', description: 'Withdraw from escrow', action: 'Withdraw from escrow' },
			{ name: 'Get Escrow History', value: 'getEscrowHistory', description: 'Get escrow history', action: 'Get escrow history' },
			{ name: 'Get Locked Amount', value: 'getLockedAmount', description: 'Get locked amount', action: 'Get locked amount' },
			{ name: 'Get Available Balance', value: 'getAvailableBalance', description: 'Get available balance', action: 'Get available balance' },
			{ name: 'Calculate Required Deposit', value: 'calculateRequiredDeposit', description: 'Calculate required deposit', action: 'Calculate required deposit' },
		],
		default: 'getEscrowBalance',
	},
];

export const escrowFields: INodeProperties[] = [
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		typeOptions: { minValue: 0 },
		displayOptions: { show: { resource: ['escrow'], operation: ['depositEscrow', 'withdrawEscrow'] } },
		default: 0,
		description: 'Amount in RENDER',
	},
	{
		displayName: 'Estimated GPU Hours',
		name: 'estimatedGpuHours',
		type: 'number',
		displayOptions: { show: { resource: ['escrow'], operation: ['calculateRequiredDeposit'] } },
		default: 10,
		description: 'Estimated GPU hours for job',
	},
];

export async function executeEscrowOperation(this: IExecuteFunctions, operation: string, i: number): Promise<IDataObject> {
	const credentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: credentials.apiEndpoint as string,
		apiKey: credentials.apiKey as string,
		creatorAccountId: credentials.creatorAccountId as string,
	});

	switch (operation) {
		case 'getEscrowBalance': {
			const response = await apiClient.getEscrowBalance();
			return { success: true, escrow: response.data };
		}
		case 'depositEscrow': {
			const amount = this.getNodeParameter('amount', i) as number;
			return { success: true, deposit: { amount, status: 'pending', txId: '' } };
		}
		case 'withdrawEscrow': {
			const amount = this.getNodeParameter('amount', i) as number;
			return { success: true, withdrawal: { amount, status: 'pending', txId: '' } };
		}
		case 'getEscrowHistory': {
			const response = await apiClient.getEscrowHistory();
			return { success: true, history: response.data };
		}
		case 'getLockedAmount': {
			const response = await apiClient.getEscrowBalance();
			return { success: true, locked: response.data?.locked || 0 };
		}
		case 'getAvailableBalance': {
			const response = await apiClient.getEscrowBalance();
			return { success: true, available: response.data?.available || 0 };
		}
		case 'calculateRequiredDeposit': {
			const estimatedGpuHours = this.getNodeParameter('estimatedGpuHours', i) as number;
			const baseRate = 0.5;
			const buffer = 1.2;
			return { success: true, required: { amount: (estimatedGpuHours * baseRate * buffer).toFixed(4), breakdown: { gpuHours: estimatedGpuHours, rate: baseRate, buffer } } };
		}
		default:
			throw new Error(`Unknown operation: ${operation}`);
	}
}
