/**
 * Wallet Resource Actions
 * Operations for RENDER and SOL wallet management
 */

import type { IExecuteFunctions, INodeProperties, IDataObject } from 'n8n-workflow';
import { SolanaClient } from '../../transport/solanaClient';
import { RenderApiClient } from '../../transport/renderApi';
import { formatRender, formatSol } from '../../utils/unitConverter';

// Wallet Operations
export const walletOperations: INodeProperties[] = [
	{
		displayName: 'Operation',
		name: 'operation',
		type: 'options',
		noDataExpression: true,
		displayOptions: {
			show: {
				resource: ['wallet'],
			},
		},
		options: [
			{
				name: 'Get RENDER Balance',
				value: 'getRenderBalance',
				description: 'Get RENDER token balance for a wallet',
				action: 'Get RENDER balance',
			},
			{
				name: 'Get SOL Balance',
				value: 'getSolBalance',
				description: 'Get SOL balance for a wallet',
				action: 'Get SOL balance',
			},
			{
				name: 'Get All Token Balances',
				value: 'getAllTokenBalances',
				description: 'Get all SPL token balances for a wallet',
				action: 'Get all token balances',
			},
			{
				name: 'Transfer RENDER',
				value: 'transferRender',
				description: 'Transfer RENDER tokens to another wallet',
				action: 'Transfer RENDER',
			},
			{
				name: 'Get Transaction History',
				value: 'getTransactionHistory',
				description: 'Get transaction history for a wallet',
				action: 'Get transaction history',
			},
			{
				name: 'Get Wallet Jobs',
				value: 'getWalletJobs',
				description: 'Get jobs submitted by this wallet',
				action: 'Get wallet jobs',
			},
			{
				name: 'Get Wallet Earnings',
				value: 'getWalletEarnings',
				description: 'Get earnings for a node operator wallet',
				action: 'Get wallet earnings',
			},
			{
				name: 'Get Wallet Spending',
				value: 'getWalletSpending',
				description: 'Get spending history for a wallet',
				action: 'Get wallet spending',
			},
			{
				name: 'Validate Address',
				value: 'validateAddress',
				description: 'Validate a Solana wallet address',
				action: 'Validate address',
			},
			{
				name: 'Get Escrow Balance',
				value: 'getEscrowBalance',
				description: 'Get escrow balance for job payments',
				action: 'Get escrow balance',
			},
		],
		default: 'getRenderBalance',
	},
];

// Wallet Fields
export const walletFields: INodeProperties[] = [
	// Address field for balance lookups
	{
		displayName: 'Wallet Address',
		name: 'walletAddress',
		type: 'string',
		default: '',
		placeholder: 'Enter Solana wallet address or leave empty for your wallet',
		description: 'Solana wallet address. Leave empty to use your configured wallet.',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: [
					'getRenderBalance',
					'getSolBalance',
					'getAllTokenBalances',
					'getTransactionHistory',
					'getWalletJobs',
					'getWalletEarnings',
					'getWalletSpending',
					'getEscrowBalance',
				],
			},
		},
	},
	// Address field for validation
	{
		displayName: 'Address to Validate',
		name: 'addressToValidate',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Enter Solana address to validate',
		description: 'The Solana address to validate',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['validateAddress'],
			},
		},
	},
	// Transfer recipient
	{
		displayName: 'Recipient Address',
		name: 'recipientAddress',
		type: 'string',
		default: '',
		required: true,
		placeholder: 'Enter recipient Solana wallet address',
		description: 'The recipient wallet address',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['transferRender'],
			},
		},
	},
	// Transfer amount
	{
		displayName: 'Amount',
		name: 'amount',
		type: 'number',
		default: 0,
		required: true,
		typeOptions: {
			minValue: 0,
			numberPrecision: 8,
		},
		description: 'Amount of RENDER tokens to transfer',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['transferRender'],
			},
		},
	},
	// Transaction history limit
	{
		displayName: 'Limit',
		name: 'limit',
		type: 'number',
		default: 10,
		typeOptions: {
			minValue: 1,
			maxValue: 100,
		},
		description: 'Maximum number of transactions to return',
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['getTransactionHistory', 'getWalletJobs', 'getWalletEarnings', 'getWalletSpending'],
			},
		},
	},
	// Additional options
	{
		displayName: 'Options',
		name: 'options',
		type: 'collection',
		placeholder: 'Add Option',
		default: {},
		displayOptions: {
			show: {
				resource: ['wallet'],
				operation: ['getTransactionHistory'],
			},
		},
		options: [
			{
				displayName: 'Before Signature',
				name: 'beforeSignature',
				type: 'string',
				default: '',
				description: 'Get transactions before this signature (for pagination)',
			},
		],
	},
];

// Execute wallet operations
export async function executeWalletOperation(
	this: IExecuteFunctions,
	operation: string,
	itemIndex: number,
): Promise<IDataObject> {
	// Get credentials and create clients
	const apiCredentials = await this.getCredentials('renderApi');
	const apiClient = new RenderApiClient({
		apiEndpoint: apiCredentials.apiEndpoint as string,
		apiKey: apiCredentials.apiKey as string,
		creatorAccountId: apiCredentials.creatorAccountId as string,
	});

	const networkCredentials = await this.getCredentials('renderNetwork');
	const solanaClient = new SolanaClient({
		network: (networkCredentials.network as 'solana-mainnet' | 'solana-devnet' | 'custom') || 'solana-mainnet',
		rpcUrl: networkCredentials.rpcUrl as string,
		privateKey: networkCredentials.privateKey as string,
	});

	let result: IDataObject = {};

	switch (operation) {
		case 'getRenderBalance': {
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex, '') as string;
			const balance = await solanaClient.getRenderBalance(walletAddress || undefined);
			result = {
				success: true,
				balance: balance.uiAmount,
				formatted: formatRender(balance.uiAmount),
				mint: balance.mint,
				decimals: balance.decimals,
				symbol: balance.symbol,
				raw: balance.amount,
			};
			break;
		}

		case 'getSolBalance': {
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex, '') as string;
			const balance = await solanaClient.getSolBalance(walletAddress || undefined);
			result = {
				success: true,
				balance,
				formatted: formatSol(balance * 1e9),
				symbol: 'SOL',
			};
			break;
		}

		case 'getAllTokenBalances': {
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex, '') as string;
			const balances = await solanaClient.getAllTokenBalances(walletAddress || undefined);
			result = {
				success: true,
				tokenCount: balances.length,
				tokens: balances.map(b => ({
					mint: b.mint,
					balance: b.uiAmount,
					decimals: b.decimals,
					symbol: b.symbol || 'Unknown',
				})),
			};
			break;
		}

		case 'transferRender': {
			const recipientAddress = this.getNodeParameter('recipientAddress', itemIndex) as string;
			const amount = this.getNodeParameter('amount', itemIndex) as number;

			// Validate recipient address
			if (!SolanaClient.validateAddress(recipientAddress)) {
				throw new Error('Invalid recipient address');
			}

			const txResult = await solanaClient.transferRender(recipientAddress, amount);
			result = {
				success: txResult.success,
				signature: txResult.signature,
				slot: txResult.slot,
				blockTime: txResult.blockTime,
				amount,
				recipient: recipientAddress,
				error: txResult.error,
			};
			break;
		}

		case 'getTransactionHistory': {
			const walletAddress = this.getNodeParameter('walletAddress', itemIndex, '') as string;
			const limit = this.getNodeParameter('limit', itemIndex, 10) as number;
			const options = this.getNodeParameter('options', itemIndex, {}) as IDataObject;

			const history = await solanaClient.getTransactionHistory(
				walletAddress || undefined,
				limit,
				options.beforeSignature as string | undefined,
			);
			result = {
				success: true,
				count: history.length,
				transactions: history,
			};
			break;
		}

		case 'getWalletJobs': {
			const limit = this.getNodeParameter('limit', itemIndex, 10) as number;
			const jobs = await apiClient.listJobs({ limit });
			result = {
				success: jobs.success,
				jobs: jobs.data?.jobs || [],
				total: jobs.data?.total || 0,
				error: jobs.error,
			};
			break;
		}

		case 'getWalletEarnings': {
			// This would call the API for earnings data
			const escrowHistory = await apiClient.getEscrowHistory({ limit: 100 });
			const earnings = (escrowHistory.data || []).filter(
				(e: IDataObject) => e.type === 'earning'
			);
			result = {
				success: escrowHistory.success,
				earnings,
				total: earnings.reduce((sum: number, e: IDataObject) => sum + (e.amount as number || 0), 0),
				error: escrowHistory.error,
			};
			break;
		}

		case 'getWalletSpending': {
			const limit = this.getNodeParameter('limit', itemIndex, 10) as number;
			const escrowHistory = await apiClient.getEscrowHistory({ limit });
			const spending = (escrowHistory.data || []).filter(
				(e: IDataObject) => e.type === 'payment' || e.type === 'job_payment'
			);
			result = {
				success: escrowHistory.success,
				spending,
				total: spending.reduce((sum: number, e: IDataObject) => sum + (e.amount as number || 0), 0),
				error: escrowHistory.error,
			};
			break;
		}

		case 'validateAddress': {
			const address = this.getNodeParameter('addressToValidate', itemIndex) as string;
			const isValid = SolanaClient.validateAddress(address);
			result = {
				address,
				valid: isValid,
				network: 'solana',
			};
			break;
		}

		case 'getEscrowBalance': {
			const escrow = await apiClient.getEscrowBalance();
			result = {
				success: escrow.success,
				total: escrow.data?.total || 0,
				available: escrow.data?.available || 0,
				locked: escrow.data?.locked || 0,
				currency: escrow.data?.currency || 'RENDER',
				error: escrow.error,
			};
			break;
		}

		default:
			throw new Error(`Unknown wallet operation: ${operation}`);
	}

	return result;
}
