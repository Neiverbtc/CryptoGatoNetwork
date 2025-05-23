import React from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Wallet, Cat } from 'lucide-react';
import cryptoGatoLogo from '../assets/cryptogato-logo-improved.svg';

const Navbar = () => {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  const formatAddress = (addr) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <nav className="bg-slate-900/80 backdrop-blur-md border-b border-slate-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <img 
                src={cryptoGatoLogo} 
                alt="CryptoGato Logo" 
                className="h-12 w-12 filter drop-shadow-lg hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold glow-text">CryptoGato</h1>
              <p className="text-xs text-gray-400">Ecosistema DeFi</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <a href="#token" className="text-gray-300 hover:text-purple-400 transition-colors">
              Token
            </a>
            <a href="#presale" className="text-gray-300 hover:text-purple-400 transition-colors">
              Preventa
            </a>
            <a href="#liquidity" className="text-gray-300 hover:text-purple-400 transition-colors">
              Liquidez
            </a>
          </div>

          {/* Wallet Connection */}
          <div>
            {isConnected ? (
              <div className="flex items-center space-x-4">
                <div className="bg-slate-800 px-3 py-2 rounded-lg border border-slate-600">
                  <span className="text-sm text-gray-300">{formatAddress(address)}</span>
                </div>
                <button
                  onClick={() => disconnect()}
                  className="btn-secondary text-sm"
                >
                  Desconectar
                </button>
              </div>
            ) : (
              <button
                onClick={() => connect({ connector: connectors[0] })}
                className="btn-primary flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Conectar Wallet</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;