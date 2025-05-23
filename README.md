# 🐱 CryptoGato Token - Ecosistema DeFi Avanzado

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue.svg)](https://soliditylang.org/)
[![Hardhat](https://img.shields.io/badge/Hardhat-2.19.0-orange.svg)](https://hardhat.org/)
[![BSC](https://img.shields.io/badge/BSC-Testnet-green.svg)](https://testnet.bscscan.com/)

> Ecosistema DeFi innovador con token BEP-20, sistema de preventa inteligente y liquidez multi-DEX en Binance Smart Chain.

## 🌟 Características Principales

- 🪙 **Token BEP-20** con suministro fijo de 10 mil millones
- 🛡️ **Protección anti-whale** con límites configurables
- 🎫 **Sistema de preventa** con vesting inteligente
- 🔗 **Conector multi-DEX** para optimización de liquidez
- 🔐 **Seguridad institucional** con timelock de 24 horas
- ⚡ **Gas optimizado** para transacciones eficientes

## 📋 Contratos Desplegados (BSC Testnet)

| Contrato | Dirección | Estado |
|----------|-----------|--------|
| CryptoGato Token | `0x487A001ce10215F5B9aC8827823e821C6E70CB66` | ✅ Verificado |
| CryptoGato Presale | `0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D` | ✅ Verificado |
| Liquidity Connector | `0xF308cbA0e89CaEbd325aE09BF9E19d142d9279CE` | ✅ Verificado |

## 🚀 Inicio Rápido

### Prerrequisitos

```bash
# Node.js v18+ y npm
node --version
npm --version

# Git
git --version
```

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/cryptogato-token.git
cd cryptogato-token

# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus claves privadas
```

### Configuración de Entorno

```bash
# .env
PRIVATE_KEY=tu_clave_privada_aqui
BSCSCAN_API_KEY=tu_api_key_de_bscscan
```

### Comandos Principales

```bash
# Compilar contratos
npx hardhat compile

# Ejecutar tests
npx hardhat test

# Desplegar en testnet
npx hardhat run scripts/deploy.js --network bscTestnet

# Verificar contratos
npx hardhat run scripts/verify-contracts.js --network bscTestnet

# Iniciar DApp
npm run dev
```

## 🏗️ Arquitectura del Proyecto

```
cryptogato-token/
├── contracts/              # Contratos inteligentes
│   ├── CryptoGato.sol      # Token principal
│   ├── CryptoGatoPresale.sol # Sistema de preventa
│   └── CGATOLiquidityConnector.sol # Conector multi-DEX
├── scripts/                # Scripts de despliegue
├── test/                   # Tests automatizados
├── src/                    # Frontend DApp (React)
├── docs/                   # Documentación
│   ├── WHITEPAPER.md       # Whitepaper técnico
│   ├── SECURITY.md         # Guía de seguridad
│   └── ARCHITECTURE.md     # Arquitectura técnica
└── tasks/                  # Tareas de Hardhat
```

## 💰 Tokenomics

| Categoría | Porcentaje | Cantidad (CGATO) |
|-----------|------------|------------------|
| Presale | 30% | 3,000,000,000 |
| Liquidity | 25% | 2,500,000,000 |
| Team/Marketing | 20% | 2,000,000,000 |
| Exchanges | 15% | 1,500,000,000 |
| Ecosystem | 5% | 500,000,000 |
| Strategic Reserve | 5% | 500,000,000 |

## 🛡️ Seguridad

### Características de Seguridad

- ✅ **Timelock de 24 horas** para operaciones críticas
- ✅ **Protección contra reentrancia** en todos los contratos
- ✅ **Control de acceso granular** con roles específicos
- ✅ **Límites anti-whale** configurables
- ✅ **Pausabilidad de emergencia** para todos los contratos

### Auditorías

- 🔍 **Análisis estático** con Solhint y Slither
- 🧪 **Cobertura de tests** >95%
- 📊 **150+ casos de prueba** automatizados
- ⛽ **Optimización de gas** verificada

## 🎯 Sistema de Preventa

### Fases

1. **WHITELIST** (48 horas)
   - Precio: 0.000025 BNB por CGATO
   - Solo direcciones autorizadas

2. **PUBLIC** (Duración variable)
   - Precio: 0.00003 BNB por CGATO
   - Acceso público

### Vesting

- **20% inmediato** al comprar
- **30 días de cliff** sin liberación
- **150 días de vesting lineal** (80% restante)

## 🔗 Liquidez Multi-DEX

### DEXs Soportados

- **PancakeSwap V2** (70% de liquidez)
- **Biswap** (20% de liquidez) - Próximamente
- **ApeSwap** (10% de liquidez) - Próximamente

### Funcionalidades

- 🔄 **Distribución automática** entre DEXs
- 📈 **Optimización de precios** cross-DEX
- ⚡ **Routing inteligente** para grandes órdenes

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Test con cobertura
npm run test:coverage

# Test de gas
npm run test:gas

# Test de un contrato específico
npx hardhat test test/CryptoGato.test.js
```

### Cobertura de Tests

- ✅ CryptoGato Token: 98% cobertura
- ✅ Presale Contract: 96% cobertura
- ✅ Liquidity Connector: 94% cobertura

## 📖 Documentación

- 📄 [**Whitepaper Técnico**](./docs/WHITEPAPER.md) - Documento completo del protocolo
- 🔐 [**Guía de Seguridad**](./docs/SECURITY.md) - Mejores prácticas de seguridad
- 🏗️ [**Arquitectura**](./docs/ARCHITECTURE.md) - Diseño técnico detallado

## 🗺️ Roadmap 2025

### Q1 2025 - Lanzamiento
- [x] Desarrollo de contratos
- [x] Auditorías internas
- [x] Despliegue en testnet
- [ ] Lanzamiento de preventa
- [ ] Despliegue en mainnet

### Q2 2025 - Expansión
- [ ] Integración Biswap/ApeSwap
- [ ] Dashboard de analytics
- [ ] Sistema de staking
- [ ] Mobile app

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **Fork** el repositorio
2. **Crea** una rama para tu feature (`git checkout -b feature/amazing-feature`)
3. **Commit** tus cambios (`git commit -m 'Add amazing feature'`)
4. **Push** a la rama (`git push origin feature/amazing-feature`)
5. **Abre** un Pull Request

### Desarrollo Local

```bash
# Configurar entorno de desarrollo
npm run setup

# Ejecutar linter
npm run lint

# Formatear código
npm run format

# Pre-commit hooks
npm run pre-commit
```

## 📞 Comunidad y Soporte

- 📱 **Telegram:** @CryptoGatoOfficial
- 🐦 **Twitter:** @CryptoGatoToken
- 💬 **Discord:** CryptoGato Community
- 🌐 **Website:** https://cryptogato.finance

## ⚖️ Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para más detalles.

## ⚠️ Disclaimer

Este software se proporciona "tal como está", sin garantías de ningún tipo. Los contratos inteligentes han sido probados pero no auditados por terceros. Usa bajo tu propio riesgo.

---

**© 2025 CryptoGato Protocol. Construido con ❤️ para la comunidad DeFi.**