import React from 'react';
import { TrendingUp, Shield, Zap, Users } from 'lucide-react';
import CryptoGatoLogo from './CryptoGatoLogo';

const Hero = () => {
  return (
    <section className="relative py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          {/* Logo Central */}
          <div className="flex justify-center mb-8">
            <CryptoGatoLogo size="large" />
          </div>
          
          {/* Main Title */}
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="glow-text">CryptoGato</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            El ecosistema DeFi más avanzado en Binance Smart Chain con funcionalidades 
            innovadoras y protección anti-whale integrada
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="btn-primary text-lg px-8 py-4">
              Explorar Token
            </button>
            <button className="btn-secondary text-lg px-8 py-4">
              Ver Contratos
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="card text-center">
              <div className="bg-purple-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-purple-400 mb-2">10B</h3>
              <p className="text-gray-400">Suministro Total</p>
            </div>

            <div className="card text-center">
              <div className="bg-blue-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-blue-400 mb-2">100%</h3>
              <p className="text-gray-400">Seguro</p>
            </div>

            <div className="card text-center">
              <div className="bg-green-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-green-400 mb-2">BSC</h3>
              <p className="text-gray-400">Red Rápida</p>
            </div>

            <div className="card text-center">
              <div className="bg-orange-600 w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-orange-400 mb-2">Multi</h3>
              <p className="text-gray-400">DEX Support</p>
            </div>
          </div>
        </div>
      </div>

      {/* Background decoration */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-blue-600/20 rounded-full blur-3xl"></div>
      </div>
    </section>
  );
};

export default Hero;