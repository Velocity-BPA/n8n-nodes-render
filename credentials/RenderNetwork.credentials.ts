import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

/**
 * Render Network Credentials
 * Supports Solana-based RENDER token operations
 * Handles wallet authentication for on-chain interactions
 */
export class RenderNetwork implements ICredentialType {
	name = 'renderNetwork';
	displayName = 'Render Network';
	documentationUrl = 'https://docs.rendernetwork.com';
	properties: INodeProperties[] = [
		{
			displayName: 'Network',
			name: 'network',
			type: 'options',
			options: [
				{
					name: 'Solana Mainnet',
					value: 'solana-mainnet',
					description: 'Solana Mainnet Beta (Production)',
				},
				{
					name: 'Solana Devnet',
					value: 'solana-devnet',
					description: 'Solana Devnet (Testing)',
				},
				{
					name: 'Legacy Ethereum',
					value: 'ethereum',
					description: 'Legacy Ethereum Network (Historical)',
				},
				{
					name: 'Custom Endpoint',
					value: 'custom',
					description: 'Custom RPC endpoint',
				},
			],
			default: 'solana-mainnet',
			description: 'Select the network to connect to',
		},
		{
			displayName: 'Solana RPC URL',
			name: 'solanaRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://api.mainnet-beta.solana.com',
			description: 'Custom Solana RPC endpoint URL. Leave empty for default.',
			displayOptions: {
				show: {
					network: ['solana-mainnet', 'solana-devnet', 'custom'],
				},
			},
		},
		{
			displayName: 'Private Key',
			name: 'privateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			required: true,
			description: 'Solana wallet private key in Base58 format or JSON byte array. Never share this key.',
			displayOptions: {
				show: {
					network: ['solana-mainnet', 'solana-devnet', 'custom'],
				},
			},
		},
		{
			displayName: 'Ethereum RPC URL',
			name: 'ethereumRpcUrl',
			type: 'string',
			default: '',
			placeholder: 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID',
			description: 'Ethereum RPC endpoint for legacy operations',
			displayOptions: {
				show: {
					network: ['ethereum'],
				},
			},
		},
		{
			displayName: 'Ethereum Private Key',
			name: 'ethereumPrivateKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
			description: 'Ethereum wallet private key (hex format). For legacy network only.',
			displayOptions: {
				show: {
					network: ['ethereum'],
				},
			},
		},
		{
			displayName: 'Commitment Level',
			name: 'commitment',
			type: 'options',
			options: [
				{
					name: 'Finalized',
					value: 'finalized',
					description: 'Most secure - transaction fully confirmed',
				},
				{
					name: 'Confirmed',
					value: 'confirmed',
					description: 'Good balance of speed and safety',
				},
				{
					name: 'Processed',
					value: 'processed',
					description: 'Fastest - may be reverted',
				},
			],
			default: 'confirmed',
			description: 'Solana transaction commitment level',
			displayOptions: {
				show: {
					network: ['solana-mainnet', 'solana-devnet', 'custom'],
				},
			},
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://api.mainnet-beta.solana.com',
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				jsonrpc: '2.0',
				id: 1,
				method: 'getHealth',
			}),
		},
	};
}
