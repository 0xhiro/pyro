// index.tsx

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import Overlay from './Overlay';

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

import { Buffer } from 'buffer';
if (!window.Buffer) {
  // @ts-ignore
  window.Buffer = Buffer;
}


const endpoint = process.env.REACT_APP_SOLANA_RPC_URL
  || 'https://api.mainnet-beta.solana.com';
const wallets = [new PhantomWalletAdapter()];

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
const isOverlay = window.location.pathname.startsWith('/overlay');

root.render(
  <ConnectionProvider endpoint={endpoint}>
    <WalletProvider wallets={wallets} autoConnect>
      <WalletModalProvider>
        {isOverlay ? <Overlay /> : <App />}
      </WalletModalProvider>
    </WalletProvider>
  </ConnectionProvider>
);
