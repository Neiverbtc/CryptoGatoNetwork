import React from 'react';
import { Cat, Github, Twitter, Send, Globe } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <Twitter className="h-5 w-5" />, label: 'Twitter', href: '#' },
    { icon: <Send className="h-5 w-5" />, label: 'Telegram', href: '#' },
    { icon: <Github className="h-5 w-5" />, label: 'GitHub', href: '#' },
    { icon: <Globe className="h-5 w-5" />, label: 'Website', href: '#' },
  ];

  const quickLinks = [
    { label: 'Token Info', href: '#token' },
    { label: 'Preventa', href: '#presale' },
    { label: 'Liquidez', href: '#liquidity' },
    { label: 'Documentación', href: '#' },
  ];

  const legalLinks = [
    { label: 'Términos de Uso', href: '#' },
    { label: 'Política de Privacidad', href: '#' },
    { label: 'Disclaimer', href: '#' },
    { label: 'Auditoría', href: '#' },
  ];

  return (
    <footer className="bg-slate-900/80 border-t border-slate-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-2 rounded-lg">
                <Cat className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold glow-text">CryptoGato</h3>
                <p className="text-sm text-gray-400">Ecosistema DeFi Avanzado</p>
              </div>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              CryptoGato es un token BEP-20 innovador en Binance Smart Chain que ofrece 
              funcionalidades DeFi avanzadas, distribución multi-DEX y protección anti-whale integrada.
            </p>
            <div className="flex space-x-4">
              {socialLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  className="bg-slate-800 hover:bg-purple-600 p-2 rounded-lg transition-colors"
                  aria-label={link.label}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Enlaces Rápidos</h4>
            <ul className="space-y-2">
              {quickLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Legal</h4>
            <ul className="space-y-2">
              {legalLinks.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-400 hover:text-purple-400 transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-slate-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm">
              © {currentYear} CryptoGato. Todos los derechos reservados.
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <span className="text-sm text-gray-400">Powered by</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-yellow-400">BSC</span>
                <span className="text-gray-500">|</span>
                <span className="text-sm font-semibold text-purple-400">Hardhat</span>
                <span className="text-gray-500">|</span>
                <span className="text-sm font-semibold text-blue-400">React</span>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 p-4 bg-slate-800/50 rounded-lg border border-orange-500/30">
          <p className="text-xs text-gray-400 text-center">
            ⚠️ <strong>Disclaimer:</strong> CryptoGato es un proyecto experimental en BSC Testnet. 
            Toda inversión en criptomonedas conlleva riesgos. Este proyecto es solo para fines educativos y de desarrollo.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;