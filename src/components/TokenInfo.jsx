import React from 'react';
import { useAccount, useReadContract, useChainId } from 'wagmi';
import { CONTRACTS } from '../config/wagmi';
import { Copy, ExternalLink, Coins, PieChart } from 'lucide-react';

// ABI simplificado para las funciones que necesitamos
const tokenABI = [
  {
    "inputs": [],
    "name": "name",
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "symbol", 
    "outputs": [{"internalType": "string", "name": "", "type": "string"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  }
];

const TokenInfo = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const tokenAddress = CONTRACTS[chainId]?.CRYPTOGATO_TOKEN;

  // Leer datos del contrato
  const { data: tokenName } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'name',
  });

  const { data: tokenSymbol } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'symbol',
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'totalSupply',
  });

  const { data: userBalance } = useReadContract({
    address: tokenAddress,
    abi: tokenABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  const formatTokenAmount = (amount) => {
    if (!amount) return '0';
    const formatted = Number(amount) / Math.pow(10, 18);
    return formatted.toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const openInExplorer = (address) => {
    const explorerUrl = chainId === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
    window.open(`${explorerUrl}/address/${address}`, '_blank');
  };

  // Distribución de tokens por categoría
  const distribution = [
    { category: 'Preventa', percentage: 30, color: 'bg-purple-500' },
    { category: 'Liquidez', percentage: 25, color: 'bg-blue-500' },
    { category: 'Team/Marketing', percentage: 20, color: 'bg-green-500' },
    { category: 'Exchanges', percentage: 15, color: 'bg-yellow-500' },
    { category: 'Ecosystem', percentage: 5, color: 'bg-red-500' },
    { category: 'Reserva', percentage: 5, color: 'bg-gray-500' },
  ];

  return (
    <section id="token" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold glow-text mb-4">Información del Token</h2>
          <p className="text-xl text-gray-300">
            Datos en tiempo real del contrato CryptoGato en BSC
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Token Stats */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Coins className="h-8 w-8 text-purple-400 mr-3" />
              <h3 className="text-2xl font-bold">Estadísticas del Token</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Nombre:</span>
                <span className="font-semibold">{tokenName || 'Cargando...'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Símbolo:</span>
                <span className="font-semibold">{tokenSymbol || 'Cargando...'}</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Suministro Total:</span>
                <span className="font-semibold">{formatTokenAmount(totalSupply)} CGATO</span>
              </div>

              {address && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tu Balance:</span>
                  <span className="font-semibold text-purple-400">
                    {formatTokenAmount(userBalance)} CGATO
                  </span>
                </div>
              )}

              <div className="border-t border-slate-600 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Contrato:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">
                      {tokenAddress ? `${tokenAddress.slice(0, 6)}...${tokenAddress.slice(-4)}` : 'No disponible'}
                    </span>
                    {tokenAddress && (
                      <>
                        <button
                          onClick={() => copyToClipboard(tokenAddress)}
                          className="text-gray-400 hover:text-purple-400"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openInExplorer(tokenAddress)}
                          className="text-gray-400 hover:text-purple-400"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Token Distribution */}
          <div className="card">
            <div className="flex items-center mb-6">
              <PieChart className="h-8 w-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-bold">Distribución de Tokens</h3>
            </div>

            <div className="space-y-4">
              {distribution.map((item, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">{item.category}</span>
                    <span className="font-semibold">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-slate-700/50 rounded-lg">
              <p className="text-sm text-gray-300">
                💡 <strong>Nota:</strong> El suministro total está distribuido estratégicamente 
                para asegurar liquidez, desarrollo del ecosistema y recompensas para la comunidad.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TokenInfo;