import React, { useState } from 'react';
import { useAccount, useReadContract, useWriteContract, useChainId } from 'wagmi';
import { CONTRACTS } from '../config/wagmi';
import { Clock, DollarSign, Target, Users } from 'lucide-react';
import { parseEther, formatEther } from 'viem';

// ABI simplificado para el contrato de presale
const presaleABI = [
  {
    "inputs": [],
    "name": "currentPhase",
    "outputs": [{"internalType": "enum CryptoGatoPresale.PresalePhase", "name": "", "type": "uint8"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "tokenPrice",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalRaised",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fundingGoal",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [{"internalType": "address", "name": "", "type": "address"}],
    "name": "contributions",
    "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "buyTokens",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

const PresaleSection = () => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const [bnbAmount, setBnbAmount] = useState('');
  
  const presaleAddress = CONTRACTS[chainId]?.CRYPTOGATO_PRESALE;

  // Leer datos del contrato de presale
  const { data: currentPhase } = useReadContract({
    address: presaleAddress,
    abi: presaleABI,
    functionName: 'currentPhase',
  });

  const { data: tokenPrice } = useReadContract({
    address: presaleAddress,
    abi: presaleABI,
    functionName: 'tokenPrice',
  });

  const { data: totalRaised } = useReadContract({
    address: presaleAddress,
    abi: presaleABI,
    functionName: 'totalRaised',
  });

  const { data: fundingGoal } = useReadContract({
    address: presaleAddress,
    abi: presaleABI,
    functionName: 'fundingGoal',
  });

  const { data: userContribution } = useReadContract({
    address: presaleAddress,
    abi: presaleABI,
    functionName: 'contributions',
    args: [address],
    enabled: !!address,
  });

  const { writeContract, isPending } = useWriteContract();

  // Convertir fase numérica a texto
  const getPhaseText = (phase) => {
    switch (phase) {
      case 0: return 'Configuración';
      case 1: return 'Lista Blanca';
      case 2: return 'Pública';
      case 3: return 'Finalizada';
      default: return 'Desconocida';
    }
  };

  // Calcular progreso
  const progressPercentage = totalRaised && fundingGoal 
    ? (Number(totalRaised) / Number(fundingGoal)) * 100 
    : 0;

  // Calcular tokens que recibirá
  const calculateTokens = () => {
    if (!bnbAmount || !tokenPrice) return '0';
    const bnbWei = parseEther(bnbAmount);
    const tokens = (bnbWei * BigInt(1e18)) / tokenPrice;
    return formatEther(tokens);
  };

  const handleBuyTokens = async () => {
    if (!bnbAmount || !presaleAddress) return;
    
    try {
      await writeContract({
        address: presaleAddress,
        abi: presaleABI,
        functionName: 'buyTokens',
        value: parseEther(bnbAmount),
      });
    } catch (error) {
      console.error('Error comprando tokens:', error);
    }
  };

  return (
    <section id="presale" className="py-16 px-4 sm:px-6 lg:px-8 bg-slate-900/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold glow-text mb-4">Preventa CryptoGato</h2>
          <p className="text-xl text-gray-300">
            Participa en la preventa y obtén tokens CGATO con descuento exclusivo
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Estado de la Preventa */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Target className="h-8 w-8 text-green-400 mr-3" />
              <h3 className="text-2xl font-bold">Estado de la Preventa</h3>
            </div>

            <div className="space-y-6">
              {/* Progreso */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-400">Progreso</span>
                  <span className="font-semibold">{progressPercentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-sm text-gray-400 mt-1">
                  <span>{totalRaised ? formatEther(totalRaised) : '0'} BNB</span>
                  <span>{fundingGoal ? formatEther(fundingGoal) : '0'} BNB</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                  <Clock className="h-6 w-6 text-blue-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-blue-400">
                    {getPhaseText(currentPhase)}
                  </div>
                  <div className="text-sm text-gray-400">Fase Actual</div>
                </div>

                <div className="bg-slate-700/50 p-4 rounded-lg text-center">
                  <DollarSign className="h-6 w-6 text-purple-400 mx-auto mb-2" />
                  <div className="text-lg font-bold text-purple-400">
                    {tokenPrice ? formatEther(tokenPrice) : '0'}
                  </div>
                  <div className="text-sm text-gray-400">Precio (BNB)</div>
                </div>
              </div>

              {address && userContribution && (
                <div className="bg-slate-700/30 p-4 rounded-lg border border-purple-500/30">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Tu Contribución:</span>
                    <span className="font-semibold text-purple-400">
                      {formatEther(userContribution)} BNB
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comprar Tokens */}
          <div className="card">
            <div className="flex items-center mb-6">
              <Users className="h-8 w-8 text-purple-400 mr-3" />
              <h3 className="text-2xl font-bold">Comprar Tokens</h3>
            </div>

            {isConnected ? (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Cantidad de BNB
                  </label>
                  <input
                    type="number"
                    value={bnbAmount}
                    onChange={(e) => setBnbAmount(e.target.value)}
                    placeholder="0.1"
                    step="0.01"
                    min="0"
                    className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {bnbAmount && (
                  <div className="bg-slate-700/50 p-4 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Recibirás:</span>
                      <span className="font-semibold text-green-400">
                        {calculateTokens()} CGATO
                      </span>
                    </div>
                  </div>
                )}

                <button
                  onClick={handleBuyTokens}
                  disabled={!bnbAmount || isPending || currentPhase === 3}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isPending ? 'Procesando...' : 'Comprar Tokens'}
                </button>

                <div className="text-center text-sm text-gray-400">
                  <p>⚡ Transacción instantánea en BSC</p>
                  <p>🔒 Contratos verificados y seguros</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">
                  Conecta tu wallet para participar en la preventa
                </p>
                <button className="btn-primary">
                  Conectar Wallet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-12 card">
          <h4 className="text-xl font-bold mb-4">📋 Información de la Preventa</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-gray-300">
            <div>
              <h5 className="font-semibold text-purple-400 mb-2">🎯 Objetivo</h5>
              <p>Recaudar fondos para el desarrollo del ecosistema y la liquidez inicial en DEXs.</p>
            </div>
            <div>
              <h5 className="font-semibold text-blue-400 mb-2">⏰ Fases</h5>
              <p>Lista Blanca → Preventa Pública → Distribución con vesting programado.</p>
            </div>
            <div>
              <h5 className="font-semibold text-green-400 mb-2">🔒 Seguridad</h5>
              <p>Contratos auditados con funciones de pausa y recuperación de emergencia.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PresaleSection;