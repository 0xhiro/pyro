import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint, getAssociatedTokenAddress, TokenAccountNotFoundError } from '@solana/spl-token';

export async function getTokenBalance(
  connection: Connection,
  wallet: PublicKey,
  mint: PublicKey
): Promise<number> {
  const ata = await getAssociatedTokenAddress(mint, wallet);

  try {
    const [account, mintInfo] = await Promise.all([
      getAccount(connection, ata),
      getMint(connection, mint),
    ]);

    return Number(account.amount) / Math.pow(10, mintInfo.decimals);
  } catch (err: any) {
    // Handle specific TokenAccountNotFoundError
    if (err instanceof TokenAccountNotFoundError) {
      console.log('Token account or mint not found, returning 0 balance');
      return 0;
    }
    // Handle generic account not found messages
    if (err.message?.includes('could not find account')) {
      return 0;
    }
    console.error('Error fetching token balance:', err);
    throw err;
  }
}
