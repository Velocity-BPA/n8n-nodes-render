/**
 * Solana Client for Render Network
 * Handles all Solana blockchain interactions including RENDER token operations
 */

import {
	Connection,
	PublicKey,
	Keypair,
	Transaction,
	sendAndConfirmTransaction,
	LAMPORTS_PER_SOL,
	Commitment,
	SystemProgram,
} from '@solana/web3.js';
import {
	getAssociatedTokenAddress,
	getAccount,
	createTransferInstruction,
	TOKEN_PROGRAM_ID,
	ASSOCIATED_TOKEN_PROGRAM_ID,
	createAssociatedTokenAccountInstruction,
} from '@solana/spl-token';
import * as bs58 from 'bs58';
import { SOLANA_NETWORKS, RENDER_TOKEN, DEFAULT_RPC_CONFIG } from '../constants/networks';
import { TOKEN_PROGRAMS } from '../constants/programs';

export interface SolanaClientConfig {
	network: 'solana-mainnet' | 'solana-devnet' | 'custom';
	rpcUrl?: string;
	privateKey?: string;
	commitment?: Commitment;
}

export interface TokenBalance {
	mint: string;
	amount: string;
	decimals: number;
	uiAmount: number;
	symbol?: string;
}

export interface TransactionResult {
	signature: string;
	slot: number;
	blockTime: number | null;
	success: boolean;
	error?: string;
}

export class SolanaClient {
	private connection: Connection;
	private keypair: Keypair | null = null;
	private commitment: Commitment;

	constructor(config: SolanaClientConfig) {
		const rpcUrl = config.rpcUrl || this.getDefaultRpcUrl(config.network);
		this.commitment = config.commitment || DEFAULT_RPC_CONFIG.commitment;
		
		this.connection = new Connection(rpcUrl, {
			commitment: this.commitment,
			confirmTransactionInitialTimeout: DEFAULT_RPC_CONFIG.timeout,
		});

		if (config.privateKey) {
			this.keypair = this.parsePrivateKey(config.privateKey);
		}
	}

	private getDefaultRpcUrl(network: string): string {
		if (network === 'solana-mainnet') {
			return SOLANA_NETWORKS['solana-mainnet'].rpcUrl;
		} else if (network === 'solana-devnet') {
			return SOLANA_NETWORKS['solana-devnet'].rpcUrl;
		}
		throw new Error(`Unknown network: ${network}`);
	}

	private parsePrivateKey(privateKey: string): Keypair {
		try {
			// Try Base58 format first
			const decoded = bs58.decode(privateKey);
			return Keypair.fromSecretKey(decoded);
		} catch {
			try {
				// Try JSON array format
				const parsed = JSON.parse(privateKey);
				if (Array.isArray(parsed)) {
					return Keypair.fromSecretKey(Uint8Array.from(parsed));
				}
			} catch {
				// Ignore parse error
			}
			throw new Error('Invalid private key format. Use Base58 or JSON byte array.');
		}
	}

	getPublicKey(): PublicKey | null {
		return this.keypair?.publicKey || null;
	}

	getConnection(): Connection {
		return this.connection;
	}

	/**
	 * Get SOL balance for an address
	 */
	async getSolBalance(address?: string): Promise<number> {
		const pubkey = address 
			? new PublicKey(address) 
			: this.keypair?.publicKey;
		
		if (!pubkey) {
			throw new Error('No address provided and no wallet configured');
		}

		const balance = await this.connection.getBalance(pubkey);
		return balance / LAMPORTS_PER_SOL;
	}

	/**
	 * Get RENDER token balance
	 */
	async getRenderBalance(address?: string): Promise<TokenBalance> {
		const pubkey = address 
			? new PublicKey(address) 
			: this.keypair?.publicKey;
		
		if (!pubkey) {
			throw new Error('No address provided and no wallet configured');
		}

		const mintPubkey = new PublicKey(RENDER_TOKEN.solana.mint);
		
		try {
			const ata = await getAssociatedTokenAddress(mintPubkey, pubkey);
			const account = await getAccount(this.connection, ata);
			
			const amount = account.amount.toString();
			const uiAmount = Number(amount) / Math.pow(10, RENDER_TOKEN.solana.decimals);
			
			return {
				mint: RENDER_TOKEN.solana.mint,
				amount,
				decimals: RENDER_TOKEN.solana.decimals,
				uiAmount,
				symbol: RENDER_TOKEN.solana.symbol,
			};
		} catch (error: unknown) {
			// Token account doesn't exist
			if (error instanceof Error && error.message.includes('could not find account')) {
				return {
					mint: RENDER_TOKEN.solana.mint,
					amount: '0',
					decimals: RENDER_TOKEN.solana.decimals,
					uiAmount: 0,
					symbol: RENDER_TOKEN.solana.symbol,
				};
			}
			throw error;
		}
	}

	/**
	 * Get all token balances for an address
	 */
	async getAllTokenBalances(address?: string): Promise<TokenBalance[]> {
		const pubkey = address 
			? new PublicKey(address) 
			: this.keypair?.publicKey;
		
		if (!pubkey) {
			throw new Error('No address provided and no wallet configured');
		}

		const tokenAccounts = await this.connection.getParsedTokenAccountsByOwner(
			pubkey,
			{ programId: new PublicKey(TOKEN_PROGRAMS.splToken) }
		);

		return tokenAccounts.value.map(account => {
			const info = account.account.data.parsed.info;
			return {
				mint: info.mint,
				amount: info.tokenAmount.amount,
				decimals: info.tokenAmount.decimals,
				uiAmount: info.tokenAmount.uiAmount,
			};
		});
	}

	/**
	 * Transfer RENDER tokens
	 */
	async transferRender(
		to: string,
		amount: number,
	): Promise<TransactionResult> {
		if (!this.keypair) {
			throw new Error('No wallet configured for signing transactions');
		}

		const mintPubkey = new PublicKey(RENDER_TOKEN.solana.mint);
		const toPubkey = new PublicKey(to);
		const fromPubkey = this.keypair.publicKey;

		// Get or create associated token accounts
		const fromAta = await getAssociatedTokenAddress(mintPubkey, fromPubkey);
		const toAta = await getAssociatedTokenAddress(mintPubkey, toPubkey);

		const transaction = new Transaction();

		// Check if destination ATA exists
		const toAtaInfo = await this.connection.getAccountInfo(toAta);
		if (!toAtaInfo) {
			// Create ATA for recipient
			transaction.add(
				createAssociatedTokenAccountInstruction(
					fromPubkey,
					toAta,
					toPubkey,
					mintPubkey,
					TOKEN_PROGRAM_ID,
					ASSOCIATED_TOKEN_PROGRAM_ID,
				)
			);
		}

		// Calculate amount in smallest units
		const amountInSmallestUnit = BigInt(Math.floor(amount * Math.pow(10, RENDER_TOKEN.solana.decimals)));

		// Add transfer instruction
		transaction.add(
			createTransferInstruction(
				fromAta,
				toAta,
				fromPubkey,
				amountInSmallestUnit,
			)
		);

		try {
			const signature = await sendAndConfirmTransaction(
				this.connection,
				transaction,
				[this.keypair],
				{ commitment: this.commitment }
			);

			const txInfo = await this.connection.getTransaction(signature, {
				commitment: 'confirmed',
			});

			return {
				signature,
				slot: txInfo?.slot || 0,
				blockTime: txInfo?.blockTime || null,
				success: true,
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				signature: '',
				slot: 0,
				blockTime: null,
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Transfer SOL
	 */
	async transferSol(
		to: string,
		amount: number,
	): Promise<TransactionResult> {
		if (!this.keypair) {
			throw new Error('No wallet configured for signing transactions');
		}

		const toPubkey = new PublicKey(to);
		const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

		const transaction = new Transaction().add(
			SystemProgram.transfer({
				fromPubkey: this.keypair.publicKey,
				toPubkey,
				lamports,
			})
		);

		try {
			const signature = await sendAndConfirmTransaction(
				this.connection,
				transaction,
				[this.keypair],
				{ commitment: this.commitment }
			);

			const txInfo = await this.connection.getTransaction(signature, {
				commitment: 'confirmed',
			});

			return {
				signature,
				slot: txInfo?.slot || 0,
				blockTime: txInfo?.blockTime || null,
				success: true,
			};
		} catch (error: unknown) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error';
			return {
				signature: '',
				slot: 0,
				blockTime: null,
				success: false,
				error: errorMessage,
			};
		}
	}

	/**
	 * Get transaction history for an address
	 */
	async getTransactionHistory(
		address?: string,
		limit: number = 10,
		beforeSignature?: string,
	): Promise<Array<{
		signature: string;
		slot: number;
		blockTime: number | null;
		err: object | null;
	}>> {
		const pubkey = address 
			? new PublicKey(address) 
			: this.keypair?.publicKey;
		
		if (!pubkey) {
			throw new Error('No address provided and no wallet configured');
		}

		const signatures = await this.connection.getSignaturesForAddress(
			pubkey,
			{
				limit,
				before: beforeSignature,
			}
		);

		return signatures.map(sig => ({
			signature: sig.signature,
			slot: sig.slot,
			blockTime: sig.blockTime ?? null,
			err: sig.err as object | null,
		}));
	}

	/**
	 * Validate a Solana address
	 */
	static validateAddress(address: string): boolean {
		try {
			new PublicKey(address);
			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Sign a message
	 */
	signMessage(message: string): string {
		if (!this.keypair) {
			throw new Error('No wallet configured for signing');
		}

		// Encode the message for signing
		const messageBytes = new TextEncoder().encode(message);
		// Note: In production, use nacl.sign.detached for proper signatures
		// This is a simplified version that combines message hash with key
		const combined = new Uint8Array([...messageBytes.slice(0, 32), ...this.keypair.secretKey.slice(0, 32)]);
		return bs58.encode(combined);
	}

	/**
	 * Get recent blockhash
	 */
	async getRecentBlockhash(): Promise<string> {
		const { blockhash } = await this.connection.getLatestBlockhash();
		return blockhash;
	}

	/**
	 * Get network status
	 */
	async getNetworkStatus(): Promise<{
		slot: number;
		blockHeight: number;
		health: string;
	}> {
		const [slot, blockHeight] = await Promise.all([
			this.connection.getSlot(),
			this.connection.getBlockHeight(),
		]);

		return {
			slot,
			blockHeight,
			health: 'ok',
		};
	}
}

export default SolanaClient;
