import axios from 'axios';

interface BurnTransaction {
  signature: string;
  wallet: string;
  amount: number;
  timestamp: number;
  mint: string;
}

export class SolanaService {
  private readonly apiKey: string;
  private readonly apiUrl: string;
  private readonly network: string;

  constructor() {
    this.apiKey = process.env.HELIUS_API_KEY || process.env.SOLANA_RPC_URL?.match(/api-key=([^&?]+)/)?.[1] || '';
    this.network = process.env.SOLANA_RPC_URL?.includes('devnet') ? 'devnet' : 'mainnet';
    
    if (!this.apiKey) {
      throw new Error("Helius API key is required. Please provide it in HELIUS_API_KEY environment variable or extract from SOLANA_RPC_URL.");
    }
    
    this.apiUrl = `https://${this.network === 'mainnet' ? 'mainnet.helius-rpc.com' : 'devnet.helius-rpc.com'}/?api-key=${this.apiKey}`;
    console.log(`🚀 SolanaService initialized with Helius DAS API (${this.network})`);
  }

  /**
   * Get burn transactions for a specific token mint using the Helius DAS API with RPC fallback
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
    console.log(`🔍 Getting burn transactions for mint: ${mintAddress} using Helius DAS API`);
    
    try {
      const allSignatures = await this.getAllSignaturesForMint(mintAddress);
      
      console.log(`📝 Found ${allSignatures.length} signatures for mint address using DAS API.`);
      
      const { Connection } = await import('@solana/web3.js');
      const connection = new Connection(this.apiUrl, 'confirmed');

      const burnTransactions: BurnTransaction[] = [];

      if (allSignatures && allSignatures.length > 0) {
        const chunkSize = 100;
        for (let i = 0; i < allSignatures.length; i += chunkSize) {
          if (burnTransactions.length >= limit) break;

          const chunk = allSignatures.slice(i, i + chunkSize);
          
          // Process transactions one by one instead of batching (free tier limitation)
          for (const signature of chunk) {
            if (burnTransactions.length >= limit) break;
            
            try {
              const tx = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
              });

              if (tx && this.isRPCBurnTransaction(tx)) {
                const burnTx = this.parseRPCBurnTransaction(tx, signature, mintAddress);
                if (burnTx) {
                  burnTransactions.push(burnTx);
                }
              }
              
              // Small delay to avoid rate limits
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (txError) {
              console.warn(`Failed to process transaction ${signature.slice(0, 8)}:`, txError);
            }
          }
        }
      }

      console.log(`✅ Found ${burnTransactions.length} burn transactions for mint ${mintAddress} via DAS`);

      // If the fast DAS API returns no burns, try the slower but more reliable RPC method as a backup.
      if (burnTransactions.length === 0) {
        console.log(`ℹ️ DAS API found 0 burns, attempting RPC fallback as a safeguard...`);
        return this.getBurnTransactionsRPC(mintAddress, options);
      }
      
      return burnTransactions;
      
    } catch (error) {
      console.warn('Helius DAS API failed, falling back to RPC method:', error);
      return this.getBurnTransactionsRPC(mintAddress, options);
    }
  }

  /**
   * Get all transaction signatures for a specific token mint using the Helius DAS API
   */
  private async getAllSignaturesForMint(mintAddress: string): Promise<string[]> {
    const allSignatures: string[] = [];
    let page = 1;

    try {
      while (true) {
        console.log(`📄 Fetching page ${page} of signatures for mint ${mintAddress}...`);
        
        const response = await axios.post(this.apiUrl, {
            jsonrpc: '2.0',
            id: `helius-get-signatures-for-asset-${mintAddress}`,
            method: 'getSignaturesForAsset',
            params: {
                id: mintAddress,
                page: page,
                limit: 1000,
            },
        }, {
            timeout: 30000,
        });
        
        const signatures = response.data?.result?.items || [];
        
        if (signatures.length === 0) {
          console.log(`📄 No more signatures found on page ${page}`);
          break;
        }

        allSignatures.push(...signatures.map((s: any) => s.signature));
        console.log(`✍️ Found ${signatures.length} signatures on page ${page}. Total: ${allSignatures.length}`);

        if (signatures.length < 1000) {
          break;
        }

        page++;
        
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      return allSignatures;

    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Error fetching signatures from Helius:', error.response?.data || error.message);
      } else {
        console.error('An unexpected error occurred while fetching signatures:', error);
      }
      throw error;
    }
  }

  /**
   * Check if a parsed transaction contains a burn instruction (RPC version)
   */
  private isRPCBurnTransaction(transaction: any): boolean {
    if (!transaction.meta || !transaction.transaction) return false;

    const instructions = transaction.transaction.message.instructions;
    const BURN_ADDRESS = '11111111111111111111111111111112';
    
    return instructions.some((instruction: any) => {
      // Handle parsed instructions
      if ('parsed' in instruction) {
        const parsed = instruction.parsed;
        
        // Check for SPL Token burn instruction
        if (parsed?.type === 'burn') {
          return true;
        }
        
        // Check for transfer to burn address (both transfer and transferChecked)
        if (parsed?.type === 'transfer' || parsed?.type === 'transferChecked') {
          return parsed.info?.destination === BURN_ADDRESS;
        }
        
        // Check for closeAccount (another way to burn tokens)
        if (parsed?.type === 'closeAccount') {
          return true;
        }
      }
      
      return false;
    });
  }

  /**
   * Parse RPC burn transaction to extract relevant data
   */
  private parseRPCBurnTransaction(
    transaction: any, 
    signature: string,
    targetMint: string
  ): BurnTransaction | null {
    try {
      if (!transaction.meta || !transaction.transaction) return null;

      const instructions = transaction.transaction.message.instructions;
      const BURN_ADDRESS = '11111111111111111111111111111112';
      
      for (const instruction of instructions) {
        if ('parsed' in instruction) {
          const parsed = instruction.parsed;
          const info = parsed.info;
          
          // Handle SPL Token burn instruction
          if (parsed?.type === 'burn' && info.mint === targetMint) {
            return {
              signature,
              wallet: info.authority || '',
              amount: parseInt(info.amount) || 0,
              timestamp: transaction.blockTime || 0,
              mint: targetMint
            };
          }
          
          // Handle transfer to burn address (both transfer and transferChecked)
          if ((parsed?.type === 'transfer' || parsed?.type === 'transferChecked') && 
              info?.destination === BURN_ADDRESS && info.mint === targetMint) {
            return {
              signature,
              wallet: info.authority || info.source || '',
              amount: parseInt(info.amount || info.tokenAmount?.amount) || 0,
              timestamp: transaction.blockTime || 0,
              mint: targetMint
            };
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing RPC burn transaction:', error);
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
   * Fallback RPC method for getting burn transactions when Helius DAS API fails
   */
  async getBurnTransactionsRPC(
    mintAddress: string, 
    options: {
      limit?: number;
      before?: string;
      until?: string;
    } = {}
  ): Promise<BurnTransaction[]> {
    const { limit = 100 } = options;
    console.log(`🔄 Fallback: Getting burn transactions for mint: ${mintAddress} using RPC method`);
    
    try {
      const { Connection, PublicKey } = await import('@solana/web3.js');
      const connection = new Connection(this.apiUrl, 'confirmed');
      const mintPubkey = new PublicKey(mintAddress);
      
      // Strategy 1: Get signatures from the mint address
      console.log(`📝 Searching for transactions involving mint: ${mintAddress}`);
      const mintSignaturesInfo = await connection.getSignaturesForAddress(mintPubkey, {
        limit: Math.min(limit * 5, 1000)
      });
      const mintSignatures = mintSignaturesInfo.map(s => s.signature);
      console.log(`📝 Found ${mintSignatures.length} signatures for mint address`);

      // Only use mint signatures - burn address has too many irrelevant transactions
      const allSignatures = mintSignatures;
      console.log(`📝 Total unique signatures to process: ${allSignatures.length}`);

      const burnTransactions: BurnTransaction[] = [];
      const chunkSize = 100; // Process signatures in chunks of 100

      for (let i = 0; i < allSignatures.length; i += chunkSize) {
        if (burnTransactions.length >= limit) break;

        const chunk = allSignatures.slice(i, i + chunkSize);
        console.log(`Processing chunk ${i / chunkSize + 1} of ${Math.ceil(allSignatures.length / chunkSize)}...`);
        
        try {
          // Process transactions one by one instead of batching (free tier limitation)
          for (const signature of chunk) {
            if (burnTransactions.length >= limit) break;
            
            try {
              const tx = await connection.getParsedTransaction(signature, {
                maxSupportedTransactionVersion: 0,
              });

              if (tx && this.isRPCBurnTransaction(tx)) {
                const burnTx = this.parseRPCBurnTransaction(tx, signature, mintAddress);
                if (burnTx) {
                  console.log(`🔥 Found burn: ${burnTx.amount} tokens from ${burnTx.wallet.slice(0, 8)}... (sig: ${signature.slice(0, 8)}...)`);
                  burnTransactions.push(burnTx);
                }
              }
              
              // Small delay to avoid rate limits
              await new Promise(resolve => setTimeout(resolve, 50));
            } catch (txError) {
              console.warn(`Failed to process transaction ${signature.slice(0, 8)}:`, txError);
            }
          }
        } catch (error) {
            console.warn(`Failed to process chunk:`, error);
        }

        // Add a delay between chunks to avoid rate limiting
        if (i + chunkSize < allSignatures.length) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      console.log(`✅ RPC fallback found ${burnTransactions.length} burn transactions for mint ${mintAddress}`);
      return burnTransactions.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
      
    } catch (error) {
      console.error('RPC fallback method also failed:', error);
      return [];
    }
  }

  /**
   * Get total burns for a mint address
   */
  async getTotalBurns(mintAddress: string): Promise<number> {
    const burns = await this.getBurnTransactions(mintAddress);
    return burns.reduce((total, burn) => total + burn.amount, 0);
  }
}