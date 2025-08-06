import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getMint, getAssociatedTokenAddress } from '@solana/spl-token';

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
    if (err.message?.includes('could not find account')) return 0;
    throw err;
  }
}
