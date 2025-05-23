# 🐱 CryptoGato - Advanced DeFi Token Ecosystem

<div align="center">

![CryptoGato Logo](./generated-icon.png)

**Un ecosistema DeFi completo en Binance Smart Chain con distribución controlada, vesting avanzado y liquidez multi-DEX**

[![BSC Network](https://img.shields.io/badge/Network-Binance%20Smart%20Chain-yellow)](https://bscscan.com/)
[![Solidity](https://img.shields.io/badge/Solidity-^0.8.20-blue)](https://soliditylang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen)](./test/)
[![Coverage](https://img.shields.io/badge/Coverage->95%25-brightgreen)](./coverage/)

[🌐 Sitio Web](#) • [📖 Documentación](./docs/) • [💬 Telegram](#) • [🐦 Twitter](#) • [📊 BSCScan](#)

</div>

---

## 🌟 ¿Qué es CryptoGato?

CryptoGato (CGATO) es un token BEP-20 innovador que combina las mejores prácticas de DeFi con características únicas de seguridad y distribución justa. Diseñado para ofrecer estabilidad, transparencia y crecimiento sostenible en el ecosistema de Binance Smart Chain.

### ✨ Características Principales

🎯 **Distribución por Categorías** - Sistema único que garantiza uso correcto de fondos  
🔒 **Preventa con Vesting** - Liberación gradual que protege el valor a largo plazo  
🌊 **Liquidez Multi-DEX** - Distribución automática en PancakeSwap, Biswap y ApeSwap  
🐋 **Protección Anti-Whale** - Límites configurables para prevenir manipulación  
⏰ **Sistema de Timelock** - 24 horas de transparencia para cambios críticos  
🛡️ **Seguridad Máxima** - Múltiples capas de protección y auditorías

---

## 📊 Tokenomics

| 📋 Categoría | 📈 Porcentaje | 🎯 Cantidad | 🔐 Estado | 💡 Propósito |
|--------------|---------------|-------------|-----------|--------------|
| 💰 **Preventa** | 30% | 3B CGATO | 🟡 Activa | Venta pública y privada con vesting |
| 💧 **Liquidez** | 25% | 2.5B CGATO | 🔒 Bloqueada | Pools en múltiples DEXs |
| 👥 **Equipo/Marketing** | 20% | 2B CGATO | ⏰ Vesting 2 años | Desarrollo y promoción |
| 🏢 **Exchanges** | 15% | 1.5B CGATO | 🔒 Reservado | Listados en CEX |
| 🎁 **Ecosistema** | 5% | 500M CGATO | 🔒 Futuro | Recompensas y staking |
| 🏦 **Reserva** | 5% | 500M CGATO | 🔒 Estratégica | Desarrollo futuro |

**📈 Suministro Total:** 10,000,000,000 CGATO (10 mil millones)

---

## 🚀 Inicio Rápido

### 1️⃣ Configuración del Entorno

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/cryptogato-contracts.git
cd cryptogato-contracts

# Instalar dependencias
npm install --legacy-peer-deps

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus claves
```

### 2️⃣ Compilar y Probar

```bash
# Compilar contratos
npm run compile

# Ejecutar tests
npm run test

# Verificar cobertura
npm run coverage

# Análisis de gas
npm run gas-report
```

### 3️⃣ Desplegar (Testnet)

```bash
# Configurar .env con clave privada de testnet
# Obtener BNB de testnet: https://testnet.binance.org/faucet-smart

# Desplegar contratos
npm run deploy:testnet

# Verificar en BSCScan
npm run verify:testnet
```

---

## 🏗️ Arquitectura del Proyecto

```
cryptogato-contracts/
├── 📁 contracts/           # Contratos inteligentes
│   ├── 🎯 CryptoGato.sol          # Token principal
│   ├── 💰 CryptoGatoPresale.sol   # Sistema de preventa
│   ├── 🔗 CGATOLiquidityConnector.sol # Conector multi-DEX
│   ├── 📚 libraries/              # Bibliotecas personalizadas
│   └── 🔌 interfaces/             # Interfaces externas
├── 📁 scripts/             # Scripts de despliegue
├── 📁 test/               # Tests comprehensivos
├── 📁 docs/               # Documentación completa
└── 📁 .vscode/            # Configuración VS Code
```

### 🔗 Componentes Principales

#### 🎯 CryptoGato Token
- **Estándar:** BEP-20/ERC-20 completo
- **Características:** Anti-whale, fees automáticos, pausable
- **Seguridad:** Timelock, reentrancy protection, access control

#### 💰 CryptoGatoPresale
- **Fases:** Setup → Whitelist → Public → Ended
- **Vesting:** 20% inmediato + liberación gradual 180 días
- **Límites:** Mín/máx por usuario, total cap

#### 🔗 CGATOLiquidityConnector
- **Multi-DEX:** PancakeSwap (70%) + Biswap (20%) + ApeSwap (10%)
- **Optimización:** Mejor precio automático entre DEXs
- **Gestión:** Distribución automática de liquidez

---

## 🛡️ Seguridad

### 🔒 Medidas Implementadas

- **✅ Reentrancy Guards** - Protección contra ataques de reentrancia
- **✅ Access Control** - Roles granulares con OpenZeppelin
- **✅ Pausable** - Pausa de emergencia para todas las operaciones
- **✅ Timelock** - 24 horas de espera para cambios críticos
- **✅ Anti-Whale** - Límites máximos por transacción y wallet
- **✅ Input Validation** - Validación exhaustiva de parámetros

### 📋 Auditorías

- **🔍 Tests Unitarios:** >95% cobertura
- **🔍 Tests de Integración:** Flujos completos
- **🔍 Análisis Estático:** Solhint + revisión manual
- **🔍 OpenZeppelin:** Bibliotecas auditadas v5.0.0

---

## 💰 Participar en la Preventa

### 📅 Cronograma

| 🕐 Fase | ⏰ Duración | 🎯 Acceso | 💎 Precio | 🎁 Beneficios |
|---------|-------------|-----------|-----------|---------------|
| **Whitelist** | 48 horas | Lista blanca | 0.000025 BNB | Precio preferencial |
| **Public** | Hasta sold-out | Público | TBD | Acceso abierto |

### 🎯 Cómo Participar

1. **🔗 Conectar billetera** (MetaMask, Trust Wallet, etc.)
2. **✅ Verificar fase** (Whitelist requiere pre-aprobación)
3. **💰 Enviar BNB** (Mín: 0.1 BNB, Máx: 50 BNB)
4. **⏰ Esperar vesting** (20% inmediato + 180 días gradual)
5. **🎁 Reclamar tokens** cuando estén disponibles

### 📈 Sistema de Vesting

```
Compra → 20% Inmediato → 30 días Cliff → 150 días Liberación Lineal
```

**Ejemplo:** Compras 10,000 CGATO
- Recibes inmediatamente: 2,000 CGATO (20%)
- Después de 30 días: Comienza liberación diaria
- Cada día: ~53 CGATO durante 150 días
- Total: 10,000 CGATO en 180 días

---

## 🔄 Trading y DEXs

### 🌊 Liquidez Distribuida

#### 🥞 PancakeSwap (70% de liquidez)
- **Par principal:** CGATO/BNB
- **URL:** [pancakeswap.finance](https://pancakeswap.finance/)
- **Beneficios:** Mayor liquidez, menor slippage

#### 🔄 Biswap (20% de liquidez)
- **Par:** CGATO/BNB
- **URL:** [biswap.org](https://biswap.org/)
- **Beneficios:** Fees menores, rewards adicionales

#### 🐒 ApeSwap (10% de liquidez)
- **Par:** CGATO/BNB
- **URL:** [apeswap.finance](https://apeswap.finance/)
- **Beneficios:** Acceso a diferentes pools de liquidez

### ⚙️ Configuración Recomendada

- **Slippage:** 5-12% (según volatilidad)
- **Gas:** Estándar BSC (~20 gwei)
- **Red:** Binance Smart Chain (Chain ID: 56)

---

## 🛠️ Para Desarrolladores

### 📋 Requisitos

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Hardhat** (incluido en dependencias)
- **MetaMask** o billetera compatible

### 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run compile          # Compilar contratos
npm run test            # Ejecutar tests
npm run coverage        # Cobertura de código
npm run lint            # Linting de Solidity
npm run gas-report      # Reporte de gas

# Despliegue
npm run deploy:testnet  # Desplegar en BSC testnet
npm run deploy:mainnet  # Desplegar en BSC mainnet
npm run verify:testnet  # Verificar en testnet
npm run verify:mainnet  # Verificar en mainnet

# Utilidades
npm run console        # Consola de Hardhat
npm run flatten       # Flatten contratos
npm run size          # Tamaño de contratos
```

### 📖 Documentación para Desarrolladores

- **[🏗️ Arquitectura](./docs/ARCHITECTURE.md)** - Diseño técnico detallado
- **[🚀 Despliegue](./docs/DEPLOYMENT.md)** - Guía de despliegue completa
- **[📚 API Reference](./docs/API_REFERENCE.md)** - Referencia de funciones
- **[🛡️ Seguridad](./docs/SECURITY.md)** - Medidas de seguridad

### 🔌 Integración

```javascript
// Ejemplo con ethers.js
const contract = new ethers.Contract(CGATO_ADDRESS, CGATO_ABI, provider);

// Obtener balance
const balance = await contract.balanceOf(userAddress);

// Transferir tokens
await contract.transfer(recipientAddress, amount);

// Verificar información de categoría
const categoryInfo = await contract.getCategoryInfo(1);
```

---

## 📚 Documentación Completa

| 📄 Documento | 📝 Descripción | 👥 Audiencia |
|---------------|----------------|--------------|
| **[📖 User Guide](./docs/USER_GUIDE.md)** | Guía completa para usuarios | 👤 Usuarios finales |
| **[🏗️ Architecture](./docs/ARCHITECTURE.md)** | Arquitectura técnica detallada | 👨‍💻 Desarrolladores |
| **[🚀 Deployment](./docs/DEPLOYMENT.md)** | Guía de despliegue profesional | 🔧 DevOps |
| **[📚 API Reference](./docs/API_REFERENCE.md)** | Referencia de API completa | 👨‍💻 Integradores |
| **[🛡️ Security](./docs/SECURITY.md)** | Medidas de seguridad | 🔒 Auditores |

---

## 🌐 Comunidad y Soporte

### 🤝 Únete a Nuestra Comunidad

- **💬 Telegram:** [Grupo oficial](#) - Soporte y discusiones
- **🐦 Twitter:** [Handle oficial](#) - Noticias y actualizaciones
- **🎮 Discord:** [Servidor oficial](#) - Comunidad de desarrolladores
- **📧 Email:** team@cryptogato.io - Contacto directo

### 🆘 Obtener Ayuda

1. **📖 Consulta la documentación** en `/docs/`
2. **🔍 Busca en issues** de GitHub
3. **💬 Pregunta en Telegram/Discord**
4. **🐛 Reporta bugs** en GitHub Issues

### 🤝 Contribuir

¡Las contribuciones son bienvenidas! Por favor:

1. **🍴 Fork** el repositorio
2. **🌟 Crea una rama** para tu feature
3. **✅ Añade tests** para nueva funcionalidad
4. **📝 Actualiza documentación** si es necesario
5. **🔄 Envía un Pull Request**

---

## 📋 Roadmap

### 🎯 Fase 1: Lanzamiento (Q1 2024)
- ✅ Desarrollo de contratos
- ✅ Testing y auditoría interna
- ✅ Documentación completa
- 🟡 Preventa y distribución inicial
- 🟡 Listado en DEXs principales

### 🎯 Fase 2: Expansión (Q2 2024)
- 🔲 Staking y recompensas
- 🔲 Listado en exchanges centralizados
- 🔲 Partnerships estratégicas
- 🔲 Auditoría externa profesional

### 🎯 Fase 3: Ecosistema (Q3-Q4 2024)
- 🔲 NFT Collection exclusiva
- 🔲 Governance token y DAO
- 🔲 Cross-chain bridges
- 🔲 Productos DeFi adicionales

---

## ⚖️ Información Legal

### 📋 Descargo de Responsabilidad

- **⚠️ Riesgo de Inversión:** Las criptomonedas son altamente volátiles
- **🔍 Investigación:** Haz tu propia investigación antes de invertir
- **💰 Responsabilidad:** No inviertas más de lo que puedas permitirte perder
- **📊 No es asesoría:** Esta no es asesoría financiera

### 📜 Licencia

Este proyecto está licenciado bajo la [Licencia MIT](./LICENSE).

### 🌍 Cumplimiento

Los usuarios son responsables del cumplimiento de las leyes locales en su jurisdicción.

---

## 📞 Contacto

**🏢 Equipo CryptoGato**
- **📧 Email:** team@cryptogato.io
- **🌐 Website:** [cryptogato.io](#)
- **📱 Telegram:** [CryptoGatoOfficial](#)
- **🐦 Twitter:** [@CryptoGato_BSC](#)

---

<div align="center">

**🐱 ¡Únete a la revolución CryptoGato! 🐱**

[![Telegram](https://img.shields.io/badge/Telegram-Join-blue?logo=telegram)](# "Únete a nuestro Telegram")
[![Twitter](https://img.shields.io/badge/Twitter-Follow-1da1f2?logo=twitter)](# "Síguenos en Twitter")
[![Website](https://img.shields.io/badge/Website-Visit-green)](# "Visita nuestro sitio web")

*Construyendo el futuro de DeFi, un token a la vez* 🚀

</div>

---

<div align="center">
<sub>© 2024 CryptoGato. Todos los derechos reservados.</sub>
</div>