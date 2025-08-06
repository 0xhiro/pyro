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

const endpoint = 'https://api.mainnet-beta.solana.com'; // or devnet if testing
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
