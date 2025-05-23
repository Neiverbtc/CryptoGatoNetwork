import React, { useState, useEffect } from 'react';

function App() {
  const [walletAddress, setWalletAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [chainId, setChainId] = useState(null);
  const [showEcosystemModal, setShowEcosystemModal] = useState(false);

  // Detectar si MetaMask está instalado
  const isMetaMaskInstalled = () => {
    return typeof window.ethereum !== 'undefined';
  };

  // Conectar wallet
  const connectWallet = async () => {
    if (!isMetaMaskInstalled()) {
      alert('¡MetaMask no está instalado! Por favor instálalo para continuar.');
      return;
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts',
      });
      
      const chainId = await window.ethereum.request({
        method: 'eth_chainId',
      });

      setWalletAddress(accounts[0]);
      setIsConnected(true);
      setChainId(parseInt(chainId, 16));
    } catch (error) {
      console.error('Error conectando wallet:', error);
    }
  };

  // Desconectar wallet
  const disconnectWallet = () => {
    setWalletAddress('');
    setIsConnected(false);
    setChainId(null);
  };

  // Cambiar a BSC Testnet
  const switchToBSCTestnet = async () => {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x61' }], // BSC Testnet
      });
    } catch (error) {
      if (error.code === 4902) {
        // Red no existe, agregarla
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x61',
              chainName: 'BSC Testnet',
              nativeCurrency: {
                name: 'BNB',
                symbol: 'tBNB',
                decimals: 18,
              },
              rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
              blockExplorerUrls: ['https://testnet.bscscan.com/'],
            }],
          });
        } catch (addError) {
          console.error('Error agregando BSC Testnet:', addError);
        }
      }
    }
  };

  // Formatear dirección
  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Detectar cambios en la wallet
  useEffect(() => {
    if (isMetaMaskInstalled()) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setWalletAddress(accounts[0]);
          setIsConnected(true);
        }
      });

      window.ethereum.on('chainChanged', (chainId) => {
        setChainId(parseInt(chainId, 16));
      });
    }
  }, []);

  const contracts = {
    token: '0x487A001ce10215F5B9aC8827823e821C6E70CB66',
    presale: '0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D',
    liquidity: '0xF308cbA0e89CaEbd325aE09BF9E19d142d9279CE'
  };

  // Funciones para los botones
  const openBSCScan = (address) => {
    const url = chainId === 97 
      ? `https://testnet.bscscan.com/address/${address}` 
      : `https://bscscan.com/address/${address}`;
    window.open(url, '_blank');
  };

  const scrollToContracts = () => {
    document.getElementById('contracts-section').scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  const exploreEcosystem = () => {
    if (!isConnected) {
      alert('¡Conecta tu wallet primero para explorar el ecosistema completo!');
      return;
    }
    setShowEcosystemModal(true);
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #0f172a 0%, #581c87 25%, #1e40af 50%, #581c87 75%, #0f172a 100%)',
      color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      {/* Header con Wallet */}
      <header style={{
        background: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(139, 92, 246, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          padding: '0 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '80px'
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <img 
              src="/src/assets/cryptogato-logo.png" 
              alt="CryptoGato Logo"
              style={{
                width: '65px',
                height: '65px',
                borderRadius: '50%',
                border: '3px solid rgba(139, 92, 246, 0.6)',
                background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                padding: '3px',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.4)'
              }}
            />
            <div>
              <h1 style={{ 
                fontSize: '28px', 
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #c084fc, #60a5fa, #34d399)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                margin: 0
              }}>
                CryptoGato
              </h1>
              <p style={{ color: '#94a3b8', fontSize: '14px', margin: 0 }}>DeFi Ecosystem</p>
            </div>
          </div>

          {/* Wallet Connection */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            {chainId && chainId !== 97 && (
              <button
                onClick={switchToBSCTestnet}
                style={{
                  background: 'linear-gradient(135deg, #f59e0b, #f97316)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '10px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cambiar a BSC Testnet
              </button>
            )}
            
            {!isConnected ? (
              <button
                onClick={connectWallet}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px',
                  transition: 'all 0.3s ease'
                }}
              >
                🦊 Conectar Wallet
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  background: 'rgba(139, 92, 246, 0.2)',
                  border: '1px solid rgba(139, 92, 246, 0.5)',
                  padding: '8px 16px',
                  borderRadius: '10px'
                }}>
                  <span style={{ fontSize: '14px', color: '#c084fc' }}>
                    {formatAddress(walletAddress)}
                  </span>
                </div>
                <button
                  onClick={disconnectWallet}
                  style={{
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    color: '#fca5a5',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  Desconectar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section Mejorado */}
      <section style={{ 
        padding: '100px 20px', 
        textAlign: 'center',
        background: 'radial-gradient(ellipse at center, rgba(139, 92, 246, 0.1) 0%, transparent 70%)'
      }}>
        <h1 style={{ 
          fontSize: 'clamp(48px, 8vw, 96px)', 
          fontWeight: 'bold',
          background: 'linear-gradient(135deg, #c084fc, #60a5fa, #34d399, #fbbf24)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          color: 'transparent',
          marginBottom: '30px',
          textShadow: '0 0 40px rgba(139, 92, 246, 0.3)'
        }}>
          CryptoGato DeFi
        </h1>
        
        <p style={{ 
          fontSize: 'clamp(18px, 3vw, 28px)', 
          color: '#e2e8f0', 
          marginBottom: '50px',
          maxWidth: '900px',
          margin: '0 auto 50px',
          lineHeight: '1.6'
        }}>
          Ecosistema DeFi revolucionario en Binance Smart Chain con funcionalidades 
          avanzadas, protección anti-whale y distribución multi-DEX
        </p>

        {/* Status */}
        {isConnected && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid rgba(16, 185, 129, 0.5)',
            padding: '15px 30px',
            borderRadius: '15px',
            display: 'inline-block',
            marginBottom: '40px'
          }}>
            <span style={{ color: '#34d399', fontWeight: 'bold' }}>
              ✅ Wallet Conectada {chainId === 97 ? '• BSC Testnet' : '• Red Incorrecta'}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '20px', 
          justifyContent: 'center', 
          marginBottom: '80px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={exploreEcosystem}
            style={{
              background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
              border: 'none',
              padding: '18px 36px',
              borderRadius: '15px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: '0 10px 30px rgba(139, 92, 246, 0.3)',
              transition: 'all 0.3s ease'
            }}
          >
            🚀 Explorar Ecosystem
          </button>
          
          <button 
            onClick={scrollToContracts}
            style={{
              background: 'rgba(30, 41, 59, 0.8)',
              border: '2px solid rgba(139, 92, 246, 0.5)',
              padding: '18px 36px',
              borderRadius: '15px',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '18px',
              transition: 'all 0.3s ease'
            }}
          >
            📋 Ver Contratos
          </button>
        </div>

        {/* Stats Grid Mejorado */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '30px',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {[
            { icon: '🪙', value: '10B', label: 'Suministro Total', color: '#c084fc' },
            { icon: '🛡️', value: '100%', label: 'Seguridad Verificada', color: '#60a5fa' },
            { icon: '⚡', value: 'BSC', label: 'Red Ultra Rápida', color: '#34d399' },
            { icon: '🔄', value: 'Multi', label: 'DEX Integrados', color: '#fbbf24' }
          ].map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(30, 41, 59, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '20px',
              padding: '40px 30px',
              textAlign: 'center',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}>
              <div style={{ fontSize: '48px', marginBottom: '20px' }}>{stat.icon}</div>
              <h3 style={{ 
                fontSize: '42px', 
                fontWeight: 'bold', 
                color: stat.color, 
                marginBottom: '15px',
                textShadow: `0 0 20px ${stat.color}50`
              }}>
                {stat.value}
              </h3>
              <p style={{ color: '#cbd5e1', fontSize: '16px' }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Contracts Section */}
      <section id="contracts-section" style={{
        padding: '80px 20px',
        background: 'rgba(15, 23, 42, 0.8)',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ 
            fontSize: '48px', 
            textAlign: 'center', 
            marginBottom: '60px',
            background: 'linear-gradient(135deg, #c084fc, #60a5fa)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            🚀 Contratos Desplegados
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '30px' }}>
            {[
              { name: 'Token Principal', icon: '🪙', address: contracts.token, color: '#c084fc' },
              { name: 'Sistema Preventa', icon: '💰', address: contracts.presale, color: '#60a5fa' },
              { name: 'Conector Liquidez', icon: '🔄', address: contracts.liquidity, color: '#34d399' }
            ].map((contract, index) => (
              <div key={index} style={{
                background: 'rgba(30, 41, 59, 0.6)',
                border: `1px solid ${contract.color}50`,
                borderRadius: '20px',
                padding: '30px',
                transition: 'all 0.3s ease'
              }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '20px',
                  gap: '15px'
                }}>
                  <div style={{ fontSize: '32px' }}>{contract.icon}</div>
                  <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: contract.color }}>
                    {contract.name}
                  </h3>
                </div>
                
                <div style={{
                  background: `${contract.color}20`,
                  padding: '15px',
                  borderRadius: '12px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  color: contract.color,
                  wordBreak: 'break-all',
                  border: `1px solid ${contract.color}50`
                }}>
                  {contract.address}
                </div>
                
                <button 
                  onClick={() => openBSCScan(contract.address)}
                  style={{
                    background: `linear-gradient(135deg, ${contract.color}, ${contract.color}80)`,
                    border: 'none',
                    padding: '12px 24px',
                    borderRadius: '10px',
                    color: 'white',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    marginTop: '20px',
                    width: '100%'
                  }}
                >
                  Ver en BSCScan
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        background: 'rgba(15, 23, 42, 0.9)',
        borderTop: '1px solid rgba(139, 92, 246, 0.3)',
        padding: '60px 20px 40px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h3 style={{ 
            fontSize: '32px', 
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #c084fc, #60a5fa, #34d399)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            🎉 ¡Ecosistema CryptoGato Completamente Funcional!
          </h3>
          
          <p style={{ color: '#cbd5e1', fontSize: '18px', lineHeight: '1.6', marginBottom: '30px' }}>
            Contratos desplegados exitosamente en BSC Testnet • DApp Web3 funcional • 
            Listo para interacciones reales con wallets
          </p>
          
          <div style={{
            background: 'rgba(139, 92, 246, 0.1)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            padding: '20px',
            borderRadius: '15px',
            fontSize: '14px',
            color: '#94a3b8'
          }}>
            © 2025 CryptoGato DeFi • Proyecto educativo en BSC Testnet • 
            Desarrollado con React + Vite + Hardhat
          </div>
        </div>
      </footer>

      {/* Modal Profesional del Ecosistema */}
      {showEcosystemModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          backdropFilter: 'blur(10px)',
          zIndex: 10000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            border: '2px solid rgba(139, 92, 246, 0.5)',
            borderRadius: '20px',
            padding: '40px',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            position: 'relative'
          }}>
            {/* Header del Modal */}
            <div style={{ textAlign: 'center', marginBottom: '40px' }}>
              <h2 style={{
                fontSize: '42px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #c084fc, #60a5fa, #34d399)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                marginBottom: '15px'
              }}>
                🚀 Ecosistema CryptoGato
              </h2>
              <p style={{ color: '#cbd5e1', fontSize: '18px' }}>
                Arquitectura DeFi completa y profesional en Binance Smart Chain
              </p>
            </div>

            {/* Grid de Características */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
              gap: '25px',
              marginBottom: '40px'
            }}>
              {[
                {
                  icon: '🪙',
                  title: 'Token CryptoGato (CGATO)',
                  features: [
                    '• Suministro: 10,000,000,000 tokens',
                    '• Standard: BEP-20/ERC-20 compatible',
                    '• Anti-whale: Límites máximos por transacción',
                    '• Categorías: Distribución controlada por tipo',
                    '• Minteo: Solo autorizados pueden crear tokens'
                  ],
                  color: '#c084fc',
                  address: contracts.token
                },
                {
                  icon: '💰',
                  title: 'Sistema de Preventa',
                  features: [
                    '• Fases: Setup → Whitelist → Público → Finalizado',
                    '• Vesting: Liberación gradual programada',
                    '• Límites: Mínimo y máximo configurables',
                    '• Whitelist: Acceso temprano controlado',
                    '• Seguridad: Pausas y recuperación de emergencia'
                  ],
                  color: '#60a5fa',
                  address: contracts.presale
                },
                {
                  icon: '🔄',
                  title: 'Conector de Liquidez Multi-DEX',
                  features: [
                    '• PancakeSwap: Integración nativa completa',
                    '• Biswap: Soporte para fees reducidos',
                    '• ApeSwap: Optimización DeFi avanzada',
                    '• Distribución: Automática entre DEXs',
                    '• Ruteo: Mejor precio automático'
                  ],
                  color: '#34d399',
                  address: contracts.liquidity
                }
              ].map((feature, index) => (
                <div key={index} style={{
                  background: 'rgba(30, 41, 59, 0.6)',
                  border: `1px solid ${feature.color}50`,
                  borderRadius: '15px',
                  padding: '25px'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '20px',
                    gap: '12px'
                  }}>
                    <span style={{ fontSize: '32px' }}>{feature.icon}</span>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: 'bold',
                      color: feature.color
                    }}>
                      {feature.title}
                    </h3>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    {feature.features.map((item, i) => (
                      <p key={i} style={{
                        color: '#e2e8f0',
                        fontSize: '14px',
                        marginBottom: '8px',
                        lineHeight: '1.5'
                      }}>
                        {item}
                      </p>
                    ))}
                  </div>
                  
                  <div style={{
                    background: `${feature.color}20`,
                    padding: '10px',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '12px',
                    color: feature.color,
                    wordBreak: 'break-all'
                  }}>
                    {feature.address}
                  </div>
                </div>
              ))}
            </div>

            {/* Estadísticas del Ecosistema */}
            <div style={{
              background: 'rgba(139, 92, 246, 0.1)',
              border: '1px solid rgba(139, 92, 246, 0.3)',
              borderRadius: '15px',
              padding: '30px',
              marginBottom: '30px'
            }}>
              <h3 style={{
                fontSize: '24px',
                fontWeight: 'bold',
                color: '#c084fc',
                marginBottom: '20px',
                textAlign: 'center'
              }}>
                📊 Estadísticas del Ecosistema
              </h3>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '20px'
              }}>
                {[
                  { label: 'Contratos Desplegados', value: '3', icon: '📋' },
                  { label: 'Red de Despliegue', value: 'BSC Testnet', icon: '🌐' },
                  { label: 'Estado de Verificación', value: 'Verificados', icon: '✅' },
                  { label: 'Funcionalidades', value: '100% Activas', icon: '⚡' }
                ].map((stat, index) => (
                  <div key={index} style={{
                    textAlign: 'center',
                    padding: '15px'
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '8px' }}>{stat.icon}</div>
                    <div style={{
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: '#60a5fa',
                      marginBottom: '5px'
                    }}>
                      {stat.value}
                    </div>
                    <div style={{ fontSize: '14px', color: '#94a3b8' }}>
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Botón de Cerrar */}
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => setShowEcosystemModal(false)}
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #3b82f6)',
                  border: 'none',
                  padding: '15px 40px',
                  borderRadius: '12px',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ✨ ¡Increíble! Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;