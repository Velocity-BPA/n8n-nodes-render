/**
 * Render Network Program IDs and contract addresses
 * On-chain programs for jobs, staking, escrow, and BME
 */

// Solana Program IDs for Render Network
export const RENDER_PROGRAMS = {
	// Main Render Network program
	main: 'RNDRHNTFsxvLTEE1xQ3MYbQuhXtgTh5gMknGc5RjH7o',
	
	// Job management program
	jobs: 'RNDRjobsProg1111111111111111111111111111111',
	
	// Staking program
	staking: 'RNDRstakeProg111111111111111111111111111111',
	
	// Escrow program
	escrow: 'RNDRescrowProg11111111111111111111111111111',
	
	// BME (Burn-Mint Equilibrium) program
	bme: 'RNDRbmeProg1111111111111111111111111111111',
	
	// Node registration program
	nodes: 'RNDRnodesProg111111111111111111111111111111',
	
	// Operator program
	operator: 'RNDRoperatorProg1111111111111111111111111',
} as const;

// Legacy Ethereum contract addresses
export const ETHEREUM_CONTRACTS = {
	// Legacy RNDR Token contract
	token: '0x6De037ef9aD2725EB40118Bb1702EBb27e4Aeb24',
	
	// Legacy staking contract
	staking: '0x0000000000000000000000000000000000000000',
	
	// Legacy escrow contract
	escrow: '0x0000000000000000000000000000000000000000',
} as const;

// Token Program IDs
export const TOKEN_PROGRAMS = {
	splToken: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
	associatedToken: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
	tokenMetadata: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
} as const;

// System Programs
export const SYSTEM_PROGRAMS = {
	system: '11111111111111111111111111111111',
	rent: 'SysvarRent111111111111111111111111111111111',
	clock: 'SysvarC1ock11111111111111111111111111111111',
} as const;

// Program versioning
export const PROGRAM_VERSIONS = {
	main: '1.0.0',
	jobs: '1.0.0',
	staking: '1.0.0',
	escrow: '1.0.0',
	bme: '1.0.0',
} as const;

export type RenderProgram = keyof typeof RENDER_PROGRAMS;
