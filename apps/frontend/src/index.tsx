// index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

import {
  ConnectionProvider,
  WalletProvider
} from '@solana/wallet-adapter-react';

import {
  WalletModalProvider
} from '@solana/wallet-adapter-react-ui';

import {
  PhantomWalletAdapter
} from '@solana/wallet-adapter-phantom';

import '@solana/wallet-adapter-react-ui/styles.css';

import { Buffer } from 'buffer'; // 👈 keep this here
if (!window.Buffer) {
  window.Buffer = Buffer;
}

const endpoint = 'https://mainnet.helius-rpc.com/?api-key=e52b7e28-596b-48c2-abaa-10f5dd653e72';
const wallets = [new PhantomWalletAdapter()];

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        <App />
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
