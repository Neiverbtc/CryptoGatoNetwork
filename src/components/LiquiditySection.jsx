import React from 'react';
import { useChainId } from 'wagmi';
import { CONTRACTS } from '../config/wagmi';
import { ArrowLeftRight, Droplets, BarChart3, ExternalLink } from 'lucide-react';

const LiquiditySection = () => {
  const chainId = useChainId();
  const liquidityConnectorAddress = CONTRACTS[chainId]?.LIQUIDITY_CONNECTOR;

  const dexes = [
    {
      name: 'PancakeSwap',
      logo: '🥞',
      allocation: '40%',
      status: 'Activo',
      color: 'text-yellow-400',
      description: 'DEX principal con mayor liquidez'
    },
    {
      name: 'Biswap',
      logo: '🔷',
      allocation: '30%',
      status: 'Próximamente',
      color: 'text-blue-400',
      description: 'DEX con fees reducidos'
    },
    {
      name: 'ApeSwap',
      logo: '🐵',
      allocation: '30%',
      status: 'Próximamente',
      color: 'text-purple-400',
      description: 'DEX enfocado en DeFi'
    }
  ];

  const features = [
    {
      icon: <ArrowLeftRight className="h-6 w-6" />,
      title: 'Multi-DEX Trading',
      description: 'Intercambia tokens en múltiples DEXs automáticamente'
    },
    {
      icon: <Droplets className="h-6 w-6" />,
      title: 'Liquidez Distribuida',
      description: 'Liquidez automáticamente distribuida entre DEXs'
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: 'Optimización de Precios',
      description: 'Encuentra automáticamente el mejor precio disponible'
    }
  ];

  const openInExplorer = (address) => {
    const explorerUrl = chainId === 97 ? 'https://testnet.bscscan.com' : 'https://bscscan.com';
    window.open(`${explorerUrl}/address/${address}`, '_blank');
  };

  return (
    <section id="liquidity" className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold glow-text mb-4">Conector de Liquidez</h2>
          <p className="text-xl text-gray-300">
            Sistema avanzado de liquidez distribuida en múltiples DEXs
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <div key={index} className="card text-center">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-gray-400">{feature.description}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DEX Information */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Droplets className="h-8 w-8 text-blue-400 mr-3" />
              <h3 className="text-2xl font-bold">DEXs Integrados</h3>
            </div>

            <div className="space-y-4">
              {dexes.map((dex, index) => (
                <div key={index} className="bg-slate-700/50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{dex.logo}</span>
                      <div>
                        <h4 className="font-semibold">{dex.name}</h4>
                        <p className="text-sm text-gray-400">{dex.description}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${dex.color}`}>{dex.allocation}</div>
                      <div className="text-sm text-gray-400">{dex.status}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-blue-500/30">
              <p className="text-sm text-gray-300">
                💡 <strong>Nota:</strong> La liquidez se distribuye automáticamente 
                para optimizar el trading y reducir el slippage.
              </p>
            </div>
          </div>

          {/* Contract Information */}
          <div className="card">
            <div className="flex items-center mb-6">
              <BarChart3 className="h-8 w-8 text-purple-400 mr-3" />
              <h3 className="text-2xl font-bold">Información del Contrato</h3>
            </div>

            <div className="space-y-6">
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Contrato:</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-mono">
                      {liquidityConnectorAddress ? 
                        `${liquidityConnectorAddress.slice(0, 6)}...${liquidityConnectorAddress.slice(-4)}` : 
                        'No disponible'
                      }
                    </span>
                    {liquidityConnectorAddress && (
                      <button
                        onClick={() => openInExplorer(liquidityConnectorAddress)}
                        className="text-gray-400 hover:text-purple-400"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Estado:</span>
                  <span className="text-green-400 font-semibold">✅ Activo</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">DEXs Soportados:</span>
                  <span className="font-semibold">3+</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-400">Optimización:</span>
                  <span className="text-blue-400 font-semibold">Automática</span>
                </div>
              </div>

              <div className="space-y-3">
                <button className="w-full btn-primary">
                  Ver en PancakeSwap
                </button>
                <button className="w-full btn-secondary">
                  Análisis de Liquidez
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="mt-12 card">
          <h4 className="text-xl font-bold mb-6 text-center">🚀 Beneficios del Sistema Multi-DEX</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⚡</div>
              <h5 className="font-semibold text-yellow-400 mb-1">Velocidad</h5>
              <p className="text-sm text-gray-400">Trades instantáneos</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">💰</div>
              <h5 className="font-semibold text-green-400 mb-1">Mejores Precios</h5>
              <p className="text-sm text-gray-400">Optimización automática</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🔒</div>
              <h5 className="font-semibold text-blue-400 mb-1">Seguridad</h5>
              <p className="text-sm text-gray-400">Contratos verificados</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📈</div>
              <h5 className="font-semibold text-purple-400 mb-1">Liquidez</h5>
              <p className="text-sm text-gray-400">Siempre disponible</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default LiquiditySection;