/**
 * Network configuration constants for Render Network
 * Includes Solana RPC endpoints and legacy Ethereum configs
 */

export const SOLANA_NETWORKS = {
	'solana-mainnet': {
		name: 'Solana Mainnet Beta',
		rpcUrl: 'https://api.mainnet-beta.solana.com',
		wsUrl: 'wss://api.mainnet-beta.solana.com',
		explorerUrl: 'https://explorer.solana.com',
		cluster: 'mainnet-beta' as const,
	},
	'solana-devnet': {
		name: 'Solana Devnet',
		rpcUrl: 'https://api.devnet.solana.com',
		wsUrl: 'wss://api.devnet.solana.com',
		explorerUrl: 'https://explorer.solana.com?cluster=devnet',
		cluster: 'devnet' as const,
	},
} as const;

export const ETHEREUM_NETWORKS = {
	mainnet: {
		name: 'Ethereum Mainnet',
		chainId: 1,
		explorerUrl: 'https://etherscan.io',
	},
} as const;

// RENDER Token mint addresses
export const RENDER_TOKEN = {
	solana: {
		mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',
		decimals: 8,
		symbol: 'RENDER',
		name: 'Render Token',
	},
	ethereum: {
		contract: '0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24',
		decimals: 18,
		symbol: 'RNDR',
		name: 'Render Token (Legacy)',
	},
} as const;

// Render Network API endpoints
export const RENDER_API_ENDPOINTS = {
	production: 'https://api.rendernetwork.com/v1',
	staging: 'https://staging-api.rendernetwork.com/v1',
} as const;

// Operator API endpoints
export const OPERATOR_API_ENDPOINTS = {
	production: 'https://operator-api.rendernetwork.com/v1',
	staging: 'https://staging-operator-api.rendernetwork.com/v1',
} as const;

// WebSocket endpoints for real-time updates
export const WEBSOCKET_ENDPOINTS = {
	jobs: 'wss://stream.rendernetwork.com/jobs',
	nodes: 'wss://stream.rendernetwork.com/nodes',
	network: 'wss://stream.rendernetwork.com/network',
} as const;

// Default RPC configuration
export const DEFAULT_RPC_CONFIG = {
	commitment: 'confirmed' as const,
	maxRetries: 3,
	retryDelay: 1000,
	timeout: 30000,
} as const;

export type SolanaNetwork = keyof typeof SOLANA_NETWORKS;
export type EthereumNetwork = keyof typeof ETHEREUM_NETWORKS;
