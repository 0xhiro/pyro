import { Connection, PublicKey, ParsedTransactionWithMeta } from '@solana/web3.js';

interface BurnTransaction {
  signature: string;
  wallet: string;
  amount: number;
  timestamp: number;
  mint: string;
}

export class SolanaService {
  private connection: Connection;
  
  constructor() {
    const rpcUrl = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * Get burn transactions for a specific token mint
   */
  async getBurnTransactions(
    mintAddress: string, 
    options: {
      limit?: number;
      before?: string;
      until?: string;
    } = {}
  ): Promise<BurnTransaction[]> {
    const { limit = 100 } = options;
    
    try {
      const mintPubkey = new PublicKey(mintAddress);
      
      // Get signatures for the mint address
      const signatures = await this.connection.getSignaturesForAddress(
        mintPubkey,
        { limit }
      );

      const burnTransactions: BurnTransaction[] = [];

      // Process signatures in batches to avoid rate limits
      const batchSize = 10;
      for (let i = 0; i < signatures.length; i += batchSize) {
        const batch = signatures.slice(i, i + batchSize);
        const transactions = await Promise.all(
          batch.map(sig => 
            this.connection.getParsedTransaction(sig.signature, {
              maxSupportedTransactionVersion: 0
            })
          )
        );

        for (let j = 0; j < transactions.length; j++) {
          const tx = transactions[j];
          const sig = batch[j];
          
          if (tx && this.isBurnTransaction(tx)) {
            const burnData = this.parseBurnTransaction(tx, sig.signature);
            if (burnData && burnData.mint === mintAddress) {
              burnTransactions.push(burnData);
            }
          }
        }
      }

      return burnTransactions.sort((a, b) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Error fetching burn transactions:', error);
      throw new Error('Failed to fetch burn transactions from blockchain');
    }
  }

  /**
   * Check if a transaction contains a burn instruction
   */
  private isBurnTransaction(transaction: ParsedTransactionWithMeta): boolean {
    if (!transaction.meta || !transaction.transaction) return false;

    // Look for burn instructions in parsed instructions
    const instructions = transaction.transaction.message.instructions;
    
    return instructions.some(instruction => {
      if ('parsed' in instruction) {
        return instruction.parsed?.type === 'burn';
      }
      return false;
    });
  }

  /**
   * Parse burn transaction to extract relevant data
   */
  private parseBurnTransaction(
    transaction: ParsedTransactionWithMeta, 
    signature: string
  ): BurnTransaction | null {
    try {
      if (!transaction.meta || !transaction.transaction) return null;

      const instructions = transaction.transaction.message.instructions;
      
      for (const instruction of instructions) {
        if ('parsed' in instruction && instruction.parsed?.type === 'burn') {
          const parsed = instruction.parsed;
          const info = parsed.info;
          
          return {
            signature,
            wallet: info.authority || '',
            amount: parseInt(info.amount) || 0,
            timestamp: transaction.blockTime || 0,
            mint: info.mint || ''
          };
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing burn transaction:', error);
      return null;
    }
  }

  /**
   * Aggregate burn amounts by wallet for leaderboard
   */
  async getLeaderboardData(
    mintAddress: string,
    options: {
      limit?: number;
      timeWindow?: number; // in seconds
    } = {}
  ): Promise<{ wallet: string; totalBurned: number }[]> {
    const { limit = 10, timeWindow } = options;
    
    const burns = await this.getBurnTransactions(mintAddress, { limit: 1000 });
    
    // Filter by time window if specified
    let filteredBurns = burns;
    if (timeWindow) {
      const cutoff = Date.now() / 1000 - timeWindow;
      filteredBurns = burns.filter(burn => burn.timestamp >= cutoff);
    }

    // Aggregate by wallet
    const walletTotals = new Map<string, number>();
    
    filteredBurns.forEach(burn => {
      const current = walletTotals.get(burn.wallet) || 0;
      walletTotals.set(burn.wallet, current + burn.amount);
    });

    // Convert to array and sort
    return Array.from(walletTotals.entries())
      .map(([wallet, totalBurned]) => ({ wallet, totalBurned }))
      .sort((a, b) => b.totalBurned - a.totalBurned)
      .slice(0, limit);
  }

  /**
   * Get total burns for a mint address
   */
  async getTotalBurns(mintAddress: string): Promise<number> {
    const burns = await this.getBurnTransactions(mintAddress);
    return burns.reduce((total, burn) => total + burn.amount, 0);
  }
}