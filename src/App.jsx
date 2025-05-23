import React from 'react';
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { config } from './config/wagmi';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TokenInfo from './components/TokenInfo';
import PresaleSection from './components/PresaleSection';
import LiquiditySection from './components/LiquiditySection';
import Footer from './components/Footer';

const queryClient = new QueryClient();

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
          <Navbar />
          <Hero />
          <TokenInfo />
          <PresaleSection />
          <LiquiditySection />
          <Footer />
        </div>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export default App;