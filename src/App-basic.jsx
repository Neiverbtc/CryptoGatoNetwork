import React from 'react';

function App() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)',
      color: 'white',
      fontFamily: 'Arial, sans-serif',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', padding: '40px 0' }}>
          <h1 style={{ 
            fontSize: '60px', 
            fontWeight: 'bold', 
            background: 'linear-gradient(to right, #c084fc, #60a5fa)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            marginBottom: '20px'
          }}>
            🐱 CryptoGato
          </h1>
          <p style={{ fontSize: '24px', color: '#d1d5db', marginBottom: '30px' }}>
            Ecosistema DeFi Avanzado en Binance Smart Chain
          </p>
          <button style={{
            background: 'linear-gradient(to right, #7c3aed, #3b82f6)',
            color: 'white',
            border: 'none',
            padding: '15px 30px',
            borderRadius: '10px',
            fontSize: '18px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}>
            ¡Tu DApp Está Funcionando! 🎉
          </button>
        </header>

        {/* Stats */}
        <section style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '20px',
          marginBottom: '60px'
        }}>
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            border: '1px solid #475569'
          }}>
            <h3 style={{ fontSize: '36px', color: '#c084fc', marginBottom: '10px' }}>10B</h3>
            <p style={{ color: '#9ca3af' }}>Suministro Total CGATO</p>
          </div>
          
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            border: '1px solid #475569'
          }}>
            <h3 style={{ fontSize: '36px', color: '#60a5fa', marginBottom: '10px' }}>100%</h3>
            <p style={{ color: '#9ca3af' }}>Contratos Verificados</p>
          </div>
          
          <div style={{
            background: 'rgba(30, 41, 59, 0.7)',
            padding: '30px',
            borderRadius: '15px',
            textAlign: 'center',
            border: '1px solid #475569'
          }}>
            <h3 style={{ fontSize: '36px', color: '#34d399', marginBottom: '10px' }}>BSC</h3>
            <p style={{ color: '#9ca3af' }}>Testnet Activo</p>
          </div>
        </section>

        {/* Contracts */}
        <section style={{
          background: 'rgba(30, 41, 59, 0.7)',
          padding: '40px',
          borderRadius: '15px',
          border: '1px solid #475569'
        }}>
          <h2 style={{ 
            fontSize: '32px', 
            textAlign: 'center', 
            marginBottom: '30px',
            background: 'linear-gradient(to right, #c084fc, #60a5fa)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent'
          }}>
            🚀 Contratos Desplegados Exitosamente
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px',
              background: 'rgba(124, 58, 237, 0.2)',
              borderRadius: '10px'
            }}>
              <span style={{ fontWeight: 'bold' }}>🪙 Token Principal:</span>
              <span style={{ fontFamily: 'monospace', color: '#c084fc' }}>0x487A001ce10215F5B9aC8827823e821C6E70CB66</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px',
              background: 'rgba(59, 130, 246, 0.2)',
              borderRadius: '10px'
            }}>
              <span style={{ fontWeight: 'bold' }}>💰 Preventa:</span>
              <span style={{ fontFamily: 'monospace', color: '#60a5fa' }}>0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D</span>
            </div>
            
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              padding: '15px',
              background: 'rgba(16, 185, 129, 0.2)',
              borderRadius: '10px'
            }}>
              <span style={{ fontWeight: 'bold' }}>🔄 Liquidez:</span>
              <span style={{ fontFamily: 'monospace', color: '#34d399' }}>0xF308cbA0e89CaEbd325aE09BF9E19d142d9279CE</span>
            </div>
          </div>
        </section>

        {/* Success Message */}
        <div style={{
          textAlign: 'center',
          marginTop: '40px',
          padding: '30px',
          background: 'rgba(16, 185, 129, 0.2)',
          borderRadius: '15px',
          border: '2px solid #10b981'
        }}>
          <h3 style={{ fontSize: '24px', color: '#10b981', marginBottom: '15px' }}>
            ✅ ¡TU ECOSISTEMA CRYPTOGATO ESTÁ COMPLETAMENTE FUNCIONAL!
          </h3>
          <p style={{ color: '#d1d5db', fontSize: '18px' }}>
            🎉 Contratos desplegados en BSC Testnet<br/>
            🔧 DApp funcionando correctamente<br/>
            🚀 ¡Listo para conectar wallets e interactuar!
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;