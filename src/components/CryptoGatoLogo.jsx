import React from 'react';

const CryptoGatoLogo = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16',
    large: 'w-32 h-32 md:w-40 md:w-40'
  };

  return (
    <div className={`${sizeClasses[size]} relative flex items-center justify-center`}>
      {/* Gato Cyberpunk sin fondo */}
      <div className="relative w-full h-full">
        {/* Cuerpo del gato */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-br from-purple-500/80 to-blue-500/80 blur-sm animate-pulse"></div>
        
        {/* Cabeza principal */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            {/* Cara del gato */}
            <div className="w-8 h-8 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-400 relative border-2 border-cyan-400/50">
              
              {/* Orejas */}
              <div className="absolute -top-2 -left-1 w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-purple-400"></div>
              <div className="absolute -top-2 -right-1 w-0 h-0 border-l-2 border-r-2 border-b-4 border-transparent border-b-purple-400"></div>
              
              {/* Ojos brillantes */}
              <div className="absolute top-1/4 left-1/4 w-1 h-1 md:w-2 md:h-2 rounded-full bg-cyan-400 animate-ping"></div>
              <div className="absolute top-1/4 right-1/4 w-1 h-1 md:w-2 md:h-2 rounded-full bg-cyan-400 animate-ping"></div>
              
              {/* Nariz */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1 h-1 bg-pink-400 rounded-full"></div>
              
              {/* Boca */}
              <div className="absolute bottom-1/4 left-1/2 transform -translate-x-1/2">
                <div className="w-2 h-1 border-b-2 border-cyan-400 rounded-b-full"></div>
              </div>
            </div>
            
            {/* Bigotes */}
            <div className="absolute top-1/2 -left-2 w-3 h-0.5 bg-gradient-to-r from-transparent to-cyan-400 opacity-70"></div>
            <div className="absolute top-1/2 -right-2 w-3 h-0.5 bg-gradient-to-l from-transparent to-cyan-400 opacity-70"></div>
            
            {/* Efectos de brillo cyberpunk */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-400/30 animate-spin-slow"></div>
            <div className="absolute inset-0 rounded-full border border-purple-400/20 animate-pulse"></div>
          </div>
        </div>
        
        {/* Partículas flotantes */}
        <div className="absolute top-0 left-1/4 w-1 h-1 bg-cyan-400 rounded-full animate-bounce opacity-60"></div>
        <div className="absolute bottom-0 right-1/4 w-1 h-1 bg-purple-400 rounded-full animate-bounce delay-300 opacity-60"></div>
        <div className="absolute top-1/4 right-0 w-0.5 h-0.5 bg-pink-400 rounded-full animate-ping delay-500 opacity-80"></div>
      </div>
    </div>
  );
};

export default CryptoGatoLogo;