# Guía de Despliegue - CryptoGato

## 📋 Requisitos Previos

### Herramientas Necesarias:
- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **Git**
- **Visual Studio Code** (recomendado)
- **MetaMask** o billetera compatible
- **Acceso a BSC Testnet/Mainnet**

### Configuración del Entorno de Desarrollo:

```bash
# Clonar el repositorio
git clone <repository-url>
cd cryptogato-contracts

# Instalar dependencias
npm install --legacy-peer-deps

# Copiar archivo de variables de entorno
cp .env.example .env

# Compilar contratos
npm run compile

# Ejecutar tests
npm run test

# Verificar cobertura
npm run coverage
```

## 🔑 Configuración de Variables de Entorno

### Archivo .env (Configuración Requerida):

```bash
# === CLAVES PRIVADAS ===
# ⚠️ NUNCA COMPARTAS ESTAS CLAVES ⚠️
PRIVATE_KEY=tu_clave_privada_aqui
DEPLOYER_PRIVATE_KEY=clave_privada_del_deployer

# === URLs DE RPC ===
# BSC Mainnet
BSC_MAINNET_RPC=https://bsc-dataseed1.binance.org/
# BSC Testnet
BSC_TESTNET_RPC=https://data-seed-prebsc-1-s1.binance.org:8545/
# URLs alternativas (opcional)
INFURA_API_KEY=tu_api_key_de_infura
ALCHEMY_API_KEY=tu_api_key_de_alchemy

# === VERIFICACIÓN DE CONTRATOS ===
# Para verificar automáticamente en BSCScan
BSCSCAN_API_KEY=tu_api_key_de_bscscan

# === CONFIGURACIÓN DE TOKENS ===
# Direcciones de tokens en diferentes redes
WBNB_MAINNET=0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c
WBNB_TESTNET=0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd

# PancakeSwap Router Addresses
PANCAKE_ROUTER_MAINNET=0x10ED43C718714eb63d5aA57B78B54704E256024E
PANCAKE_ROUTER_TESTNET=0xD99D1c33F9fC3444f8101754aBC46c52416550D1

# === CONFIGURACIÓN DE PRECIOS ===
# Precio por token en wei (1 BNB = 10^18 wei)
PRESALE_PRICE_WEI=25000000000000  # 0.000025 BNB por token

# === CONFIGURACIÓN DE LIQUIDEZ ===
# Porcentajes de distribución de liquidez
PANCAKESWAP_SHARE=7000  # 70%
BISWAP_SHARE=2000       # 20%
APESWAP_SHARE=1000      # 10%

# === CONFIGURACIÓN DE FEES ===
LIQUIDITY_FEE=300       # 3%
MARKETING_FEE=200       # 2%
MAX_TRANSACTION_AMOUNT=50000000000000000000000000  # 0.5% del suministro
MAX_WALLET_AMOUNT=200000000000000000000000000      # 2% del suministro

# === TIMELOCK CONFIGURATION ===
TIMELOCK_DELAY=86400    # 24 horas en segundos

# === TESTING ===
HARDHAT_NETWORK=hardhat
REPORT_GAS=true
COINMARKETCAP_API_KEY=tu_api_key_opcional
```

### Obtener las Claves Necesarias:

#### 1. Clave Privada (PRIVATE_KEY):
```bash
# En MetaMask:
# 1. Ir a Configuración → Seguridad y Privacidad
# 2. Revelar Clave Privada
# 3. Copiar la clave (sin el prefijo 0x)

# ⚠️ IMPORTANTE: Usa una wallet separada para desarrollo
# Nunca uses tu wallet principal con fondos reales
```

#### 2. BSCScan API Key:
```bash
# 1. Ir a https://bscscan.com/apis
# 2. Crear cuenta gratuita
# 3. Generar API Key
# 4. Copiar el API Key generado
```

#### 3. Infura/Alchemy (Opcional):
```bash
# Infura: https://infura.io/
# Alchemy: https://www.alchemy.com/
# Útil para mayor confiabilidad de RPC
```

## 🚀 Proceso de Despliegue

### Despliegue en BSC Testnet (Recomendado primero):

```bash
# 1. Asegurarse de tener BNB en testnet
# Faucet: https://testnet.binance.org/faucet-smart

# 2. Desplegar CryptoGato Token
npx hardhat run scripts/deploy.js --network bscTestnet

# 3. Desplegar Presale Contract
npx hardhat run scripts/deploy-presale.js --network bscTestnet

# 4. Desplegar Liquidity Connector
npx hardhat run scripts/deploy-liquidity-connector.js --network bscTestnet

# 5. Verificar contratos automáticamente
npx hardhat run scripts/verify-contracts.js --network bscTestnet
```

### Despliegue en BSC Mainnet (Producción):

```bash
# ⚠️ VERIFICAR TODO EN TESTNET PRIMERO ⚠️

# 1. Asegurar fondos suficientes para gas
# Aproximadamente 0.1 BNB para todo el despliegue

# 2. Desplegar en mainnet
npx hardhat run scripts/deploy.js --network bscMainnet
npx hardhat run scripts/deploy-presale.js --network bscMainnet
npx hardhat run scripts/deploy-liquidity-connector.js --network bscMainnet

# 3. Verificar contratos
npx hardhat run scripts/verify-contracts.js --network bscMainnet

# 4. Configurar permisos iniciales
npx hardhat run scripts/setup-permissions.js --network bscMainnet
```

## 📋 Lista de Verificación Pre-Despliegue

### Antes de Desplegar en Testnet:

- [ ] **Configuración de entorno**
  - [ ] Archivo .env configurado correctamente
  - [ ] Claves privadas válidas (wallet de desarrollo)
  - [ ] BNB suficiente en testnet para gas
  - [ ] BSCScan API key configurado

- [ ] **Compilación y Testing**
  - [ ] `npm run compile` ejecutado sin errores
  - [ ] `npm run test` con 100% de tests pasando
  - [ ] `npm run coverage` con cobertura >90%
  - [ ] Linting sin errores: `npm run lint`

- [ ] **Configuración de Parámetros**
  - [ ] Precios de preventa verificados
  - [ ] Porcentajes de distribución correctos
  - [ ] Límites anti-whale apropiados
  - [ ] Timelock configurado (24 horas)

### Antes de Desplegar en Mainnet:

- [ ] **Testing Completo en Testnet**
  - [ ] Todos los contratos desplegados y verificados en testnet
  - [ ] Funcionalidad de preventa probada
  - [ ] Distribución de liquidez probada
  - [ ] Vesting funcionando correctamente
  - [ ] Limits anti-whale probados

- [ ] **Seguridad**
  - [ ] Auditoría de código completada
  - [ ] Revisión de permisos de contratos
  - [ ] Timelock configurado correctamente
  - [ ] Funciones de pausa probadas

- [ ] **Documentación**
  - [ ] Whitepaper actualizado
  - [ ] Documentación técnica completa
  - [ ] Guías de usuario preparadas
  - [ ] Plan de comunicación listo

## 🔧 Comandos de Utilidad

### Desarrollo Local:

```bash
# Iniciar nodo local de Hardhat
npx hardhat node

# Desplegar en red local
npx hardhat run scripts/deploy.js --network localhost

# Consola interactiva
npx hardhat console --network localhost

# Ejecutar script específico
npx hardhat run scripts/nombre-script.js --network <red>
```

### Testing y Debugging:

```bash
# Tests específicos
npx hardhat test test/CryptoGato.test.js
npx hardhat test test/CryptoGatoPresale.test.js
npx hardhat test test/CGATOLiquidityConnector.test.js

# Test con gas reporting
REPORT_GAS=true npx hardhat test

# Debugging con console.log
npx hardhat test --logs

# Coverage detallado
npx hardhat coverage --solcoverjs .solcover.js
```

### Verificación Manual:

```bash
# Verificar contrato específico
npx hardhat verify --network bscMainnet <CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>

# Ejemplo para CryptoGato
npx hardhat verify --network bscMainnet 0x123... "0xPancakeRouterAddress"

# Verificar con parámetros complejos
npx hardhat verify --network bscMainnet <ADDRESS> --constructor-args arguments.js
```

## 📊 Monitoreo Post-Despliegue

### Métricas Clave a Monitorear:

1. **Contratos Desplegados**
   - Direcciones de contratos verificadas
   - Estado de verificación en BSCScan
   - Gas usado en despliegue

2. **Funcionalidad**
   - Preventa funcionando correctamente
   - Vesting liberando tokens según cronograma
   - Liquidez distribuida apropiadamente

3. **Seguridad**
   - Límites anti-whale activos
   - Timelock funcionando
   - Permisos asignados correctamente

### Herramientas de Monitoreo:

```bash
# Script de monitoreo (crear)
npx hardhat run scripts/monitor-contracts.js --network bscMainnet

# Verificar estado de contratos
npx hardhat run scripts/check-contract-status.js --network bscMainnet

# Verificar balances y distribución
npx hardhat run scripts/check-distribution.js --network bscMainnet
```

## 🚨 Troubleshooting

### Problemas Comunes:

#### Error de Gas Insuficiente:
```bash
# Aumentar gas limit en hardhat.config.js
gas: 8000000,
gasPrice: 20000000000, // 20 gwei
```

#### Error de Verificación:
```bash
# Verificar manualmente con código flattened
npx hardhat flatten contracts/CryptoGato.sol > flattened.sol
# Luego verificar en BSCScan UI
```

#### Error de Dependencias:
```bash
# Limpiar e instalar dependencias
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

#### Error de Red:
```bash
# Verificar conectividad a BSC
curl -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' \
  https://bsc-dataseed1.binance.org/
```

## 🔄 Actualizaciones y Mantenimiento

### Estrategia de Actualizaciones:

1. **Contratos No-Upgradeables**
   - CryptoGato, Presale y LiquidityConnector son inmutables
   - Cambios requieren nuevo despliegue
   - Migración manual de datos si necesario

2. **Configuraciones Modificables**
   - Fees de liquidez
   - Límites anti-whale
   - Lista de DEXs (LiquidityConnector)
   - Whitelist de presale

3. **Procedimiento de Emergencia**
   - Pausar contratos si necesario
   - Timelock para cambios críticos
   - Plan de comunicación a usuarios

### Backup y Seguridad:

```bash
# Backup de configuración
npm run backup-config

# Exportar datos de contratos
npx hardhat run scripts/export-contract-data.js --network bscMainnet

# Verificar integridad
npx hardhat run scripts/verify-integrity.js --network bscMainnet
```

Esta guía proporciona todo lo necesario para un despliegue seguro y exitoso del ecosistema CryptoGato en Binance Smart Chain.
