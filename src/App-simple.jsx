import React from 'react';
import { Cat, TrendingUp, Shield, Zap, Users } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #7c3aed 50%, #1e293b 100%)' }}>
      {/* Navbar */}
      <nav style={{ background: 'rgba(30, 41, 59, 0.8)', borderBottom: '1px solid #475569', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '64px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ background: 'linear-gradient(to right, #7c3aed, #3b82f6)', padding: '8px', borderRadius: '8px' }}>
                <Cat style={{ height: '32px', width: '32px', color: 'white' }} />
              </div>
              <div>
                <h1 className="glow-text" style={{ fontSize: '20px', fontWeight: 'bold', margin: 0 }}>CryptoGato</h1>
                <p style={{ fontSize: '12px', color: '#9ca3af', margin: 0 }}>Ecosistema DeFi</p>
              </div>
            </div>
            <button className="btn-primary">
              Conectar Wallet
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ padding: '80px 20px', textAlign: 'center' }}>
        <h1 className="glow-text" style={{ fontSize: '72px', fontWeight: 'bold', marginBottom: '24px' }}>
          CryptoGato
        </h1>
        <p style={{ fontSize: '24px', color: '#d1d5db', marginBottom: '32px', maxWidth: '800px', margin: '0 auto 32px' }}>
          El ecosistema DeFi más avanzado en Binance Smart Chain con funcionalidades 
          innovadoras y protección anti-whale integrada
        </p>

        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '64px', flexWrap: 'wrap' }}>
          <button className="btn-primary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Explorar Token
          </button>
          <button className="btn-secondary" style={{ fontSize: '18px', padding: '16px 32px' }}>
            Ver Contratos
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '1200px', margin: '0 auto' }}>
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ background: '#7c3aed', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <TrendingUp style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#c084fc', marginBottom: '8px' }}>10B</h3>
            <p style={{ color: '#9ca3af' }}>Suministro Total</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ background: '#3b82f6', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Shield style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#60a5fa', marginBottom: '8px' }}>100%</h3>
            <p style={{ color: '#9ca3af' }}>Seguro</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ background: '#10b981', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Zap style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#34d399', marginBottom: '8px' }}>BSC</h3>
            <p style={{ color: '#9ca3af' }}>Red Rápida</p>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ background: '#f59e0b', width: '48px', height: '48px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Users style={{ height: '24px', width: '24px', color: 'white' }} />
            </div>
            <h3 style={{ fontSize: '32px', fontWeight: 'bold', color: '#fbbf24', marginBottom: '8px' }}>Multi</h3>
            <p style={{ color: '#9ca3af' }}>DEX Support</p>
          </div>
        </div>
      </section>

      {/* Token Info Section */}
      <section style={{ padding: '64px 20px', background: 'rgba(30, 41, 59, 0.3)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="glow-text" style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '16px' }}>Token CryptoGato</h2>
          <p style={{ fontSize: '20px', color: '#d1d5db', marginBottom: '48px' }}>
            Información de tu token desplegado en BSC Testnet
          </p>

          <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h3 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px' }}>Contratos Desplegados</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(124, 58, 237, 0.1)', borderRadius: '8px' }}>
                <span style={{ color: '#d1d5db' }}>Token Principal:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#c084fc' }}>0x487A...CB66</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <span style={{ color: '#d1d5db' }}>Preventa:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#60a5fa' }}>0x77A0...5a1D</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px' }}>
                <span style={{ color: '#d1d5db' }}>Liquidez:</span>
                <span style={{ fontFamily: 'monospace', fontSize: '14px', color: '#34d399' }}>0xF308...79CE</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: 'rgba(30, 41, 59, 0.8)', borderTop: '1px solid #475569', padding: '48px 20px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ background: 'linear-gradient(to right, #7c3aed, #3b82f6)', padding: '8px', borderRadius: '8px' }}>
              <Cat style={{ height: '32px', width: '32px', color: 'white' }} />
            </div>
            <div>
              <h3 className="glow-text" style={{ fontSize: '20px', fontWeight: 'bold' }}>CryptoGato</h3>
              <p style={{ fontSize: '14px', color: '#9ca3af' }}>Ecosistema DeFi Avanzado</p>
            </div>
          </div>
          <p style={{ color: '#9ca3af', marginBottom: '16px' }}>
            © 2025 CryptoGato. Proyecto educativo en BSC Testnet.
          </p>
          <p style={{ fontSize: '12px', color: '#6b7280' }}>
            ⚠️ Proyecto experimental - Solo para fines educativos y de desarrollo
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;