# Referencia de API - CryptoGato

## 📋 Visión General

Esta documentación describe todas las funciones públicas y eventos de los contratos inteligentes CryptoGato. Cada contrato expone una API específica para interacciones externas.

## 🎯 CryptoGato Token Contract

### Información Básica

```solidity
contract CryptoGato is ERC20, Ownable, Pausable, ReentrancyGuard
```

**Dirección del Contrato:**
- **BSC Mainnet:** `TBD` (Por desplegar)
- **BSC Testnet:** `TBD` (Por desplegar)

### Funciones Públicas

#### Funciones ERC20 Estándar

```solidity
function name() public view returns (string)
```
**Descripción:** Devuelve el nombre del token  
**Retorna:** `"CryptoGato"`

```solidity
function symbol() public view returns (string)
```
**Descripción:** Devuelve el símbolo del token  
**Retorna:** `"CGATO"`

```solidity
function decimals() public view returns (uint8)
```
**Descripción:** Devuelve el número de decimales  
**Retorna:** `18`

```solidity
function totalSupply() public view returns (uint256)
```
**Descripción:** Devuelve el suministro total actual  
**Retorna:** Suministro total en wei (máximo 10,000,000,000 tokens)

```solidity
function balanceOf(address account) public view returns (uint256)
```
**Descripción:** Devuelve el balance de una dirección  
**Parámetros:**
- `account`: Dirección a consultar
**Retorna:** Balance en wei

```solidity
function transfer(address to, uint256 amount) public returns (bool)
```
**Descripción:** Transfiere tokens a otra dirección  
**Parámetros:**
- `to`: Dirección destino
- `amount`: Cantidad en wei
**Retorna:** `true` si exitoso

```solidity
function approve(address spender, uint256 amount) public returns (bool)
```
**Descripción:** Aprueba a un spender gastar tokens  
**Parámetros:**
- `spender`: Dirección autorizada
- `amount`: Cantidad máxima en wei
**Retorna:** `true` si exitoso

```solidity
function transferFrom(address from, address to, uint256 amount) public returns (bool)
```
**Descripción:** Transfiere tokens de una dirección a otra (requiere aprobación)  
**Parámetros:**
- `from`: Dirección origen
- `to`: Dirección destino
- `amount`: Cantidad en wei
**Retorna:** `true` si exitoso

#### Funciones de Gestión de Categorías

```solidity
function mint(address to, uint256 amount, uint8 category) public onlyMinter nonReentrant
```
**Descripción:** Acuña tokens para una categoría específica  
**Parámetros:**
- `to`: Dirección receptora
- `amount`: Cantidad en wei
- `category`: ID de categoría (1-6)
**Restricciones:** Solo minters autorizados

```solidity
function getCategoryInfo(uint8 category) public view returns (uint256, uint256)
```
**Descripción:** Obtiene información de una categoría  
**Parámetros:**
- `category`: ID de categoría
**Retorna:** (porcentaje asignado, cantidad acuñada)

```solidity
function getRemainingSupplyForCategory(uint8 category) public view returns (uint256)
```
**Descripción:** Obtiene la cantidad restante disponible para una categoría  
**Parámetros:**
- `category`: ID de categoría
**Retorna:** Cantidad restante en wei

#### Funciones de Gestión de Fees

```solidity
function setLiquidityFeePercent(uint256 _liquidityFee) external onlyOwner
```
**Descripción:** Establece el porcentaje de fee de liquidez  
**Parámetros:**
- `_liquidityFee`: Porcentaje (0-1000, donde 1000 = 10%)
**Restricciones:** Solo owner, máximo 10%

```solidity
function setSwapAndLiquifyEnabled(bool _enabled) external onlyOwner
```
**Descripción:** Activa/desactiva el swap automático a liquidez  
**Parámetros:**
- `_enabled`: true para activar, false para desactivar
**Restricciones:** Solo owner

```solidity
function swapAndLiquify(uint256 tokenAmount) external onlyOwner
```
**Descripción:** Convierte tokens a liquidez manualmente  
**Parámetros:**
- `tokenAmount`: Cantidad de tokens a convertir
**Restricciones:** Solo owner

#### Funciones Anti-Whale

```solidity
function setMaxTransactionAmount(uint256 _maxTxAmount) external onlyOwner
```
**Descripción:** Establece el límite máximo por transacción  
**Parámetros:**
- `_maxTxAmount`: Cantidad máxima en wei
**Restricciones:** Solo owner

```solidity
function setMaxWalletAmount(uint256 _maxWalletAmount) external onlyOwner
```
**Descripción:** Establece el límite máximo por wallet  
**Parámetros:**
- `_maxWalletAmount`: Cantidad máxima en wei
**Restricciones:** Solo owner

```solidity
function exemptFromLimits(address account, bool exempt) external onlyOwner
```
**Descripción:** Exenta una dirección de los límites anti-whale  
**Parámetros:**
- `account`: Dirección a exentar
- `exempt`: true para exentar, false para aplicar límites
**Restricciones:** Solo owner

#### Funciones de Control de Acceso

```solidity
function addMinter(address account) external onlyOwner
```
**Descripción:** Añade un minter autorizado  
**Parámetros:**
- `account`: Dirección a autorizar
**Restricciones:** Solo owner

```solidity
function removeMinter(address account) external onlyOwner
```
**Descripción:** Remueve un minter autorizado  
**Parámetros:**
- `account`: Dirección a desautorizar
**Restricciones:** Solo owner

```solidity
function pause() external onlyOwner
```
**Descripción:** Pausa todas las operaciones del contrato  
**Restricciones:** Solo owner

```solidity
function unpause() external onlyOwner
```
**Descripción:** Reanuda las operaciones del contrato  
**Restricciones:** Solo owner

### Eventos

```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```
**Descripción:** Emitido cuando se transfieren tokens

```solidity
event Approval(address indexed owner, address indexed spender, uint256 value)
```
**Descripción:** Emitido cuando se aprueba un spender

```solidity
event MinterAdded(address indexed account)
```
**Descripción:** Emitido cuando se añade un minter

```solidity
event MinterRemoved(address indexed account)
```
**Descripción:** Emitido cuando se remueve un minter

```solidity
event TokensMinted(address indexed to, uint256 amount, uint8 category)
```
**Descripción:** Emitido cuando se acuñan tokens

```solidity
event LiquidityFeeUpdated(uint256 oldFee, uint256 newFee)
```
**Descripción:** Emitido cuando se actualiza el fee de liquidez

```solidity
event SwapAndLiquifyEnabledUpdated(bool enabled)
```
**Descripción:** Emitido cuando se cambia el estado de swap automático

```solidity
event SwapAndLiquify(uint256 tokensSwapped, uint256 bnbReceived, uint256 tokensIntoLiquidity)
```
**Descripción:** Emitido cuando se ejecuta swap y liquify

## 💰 CryptoGatoPresale Contract

### Información Básica

```solidity
contract CryptoGatoPresale is Ownable, ReentrancyGuard, Pausable
```

### Enums y Estructuras

```solidity
enum PresalePhase { SETUP, WHITELIST, PUBLIC, ENDED }

struct UserPurchase {
    uint256 totalPurchased;
    uint256 tokensReleased;
    uint256 lastReleaseTime;
}

struct VestingConfig {
    uint256 immediateReleasePercent;
    uint256 cliffPeriod;
    uint256 vestingDuration;
}
```

### Funciones Públicas

#### Información de Presale

```solidity
function getCurrentPhase() public view returns (PresalePhase)
```
**Descripción:** Devuelve la fase actual de la presale  
**Retorna:** Enum PresalePhase

```solidity
function getPresaleInfo() public view returns (uint256, uint256, uint256, uint256, uint256)
```
**Descripción:** Obtiene información general de la presale  
**Retorna:** (precio, mínCompra, máxCompra, totalVendido, límiteTotal)

```solidity
function getUserPurchaseInfo(address user) public view returns (uint256, uint256, uint256)
```
**Descripción:** Obtiene información de compra de un usuario  
**Parámetros:**
- `user`: Dirección del usuario
**Retorna:** (totalComprado, tokensLiberados, últimaLiberación)

```solidity
function getVestingConfig() public view returns (uint256, uint256, uint256)
```
**Descripción:** Obtiene la configuración de vesting  
**Retorna:** (porcentajeInmediato, períodoCliff, duraciónVesting)

#### Funciones de Compra

```solidity
function buyTokens() external payable nonReentrant whenNotPaused
```
**Descripción:** Compra tokens enviando BNB  
**Restricciones:** Solo en fases WHITELIST o PUBLIC

```solidity
function calculateTokensForBNB(uint256 bnbAmount) public view returns (uint256)
```
**Descripción:** Calcula tokens por cantidad de BNB  
**Parámetros:**
- `bnbAmount`: Cantidad de BNB en wei
**Retorna:** Cantidad de tokens en wei

#### Funciones de Vesting

```solidity
function claimTokens() external nonReentrant
```
**Descripción:** Reclama tokens disponibles del vesting  

```solidity
function getClaimableTokens(address user) public view returns (uint256)
```
**Descripción:** Obtiene la cantidad de tokens reclamables  
**Parámetros:**
- `user`: Dirección del usuario
**Retorna:** Cantidad reclamable en wei

```solidity
function getVestedAmount(address user) public view returns (uint256)
```
**Descripción:** Obtiene el total de tokens vested hasta la fecha  
**Parámetros:**
- `user`: Dirección del usuario
**Retorna:** Cantidad vested en wei

#### Funciones de Whitelist

```solidity
function isWhitelisted(address account) public view returns (bool)
```
**Descripción:** Verifica si una dirección está en whitelist  
**Parámetros:**
- `account`: Dirección a verificar
**Retorna:** true si está en whitelist

#### Funciones de Administración (Solo Owner)

```solidity
function addToWhitelist(address[] calldata accounts) external onlyOwner
```
**Descripción:** Añade direcciones a la whitelist  
**Parámetros:**
- `accounts`: Array de direcciones

```solidity
function removeFromWhitelist(address[] calldata accounts) external onlyOwner
```
**Descripción:** Remueve direcciones de la whitelist  
**Parámetros:**
- `accounts`: Array de direcciones

```solidity
function setPresalePhase(PresalePhase _phase) external onlyOwner
```
**Descripción:** Cambia la fase de la presale  
**Parámetros:**
- `_phase`: Nueva fase

```solidity
function setPresalePrice(uint256 _pricePerToken) external onlyOwner
```
**Descripción:** Establece el precio por token  
**Parámetros:**
- `_pricePerToken`: Precio en wei de BNB por token

```solidity
function setPurchaseLimits(uint256 _minPurchase, uint256 _maxPurchase) external onlyOwner
```
**Descripción:** Establece límites de compra  
**Parámetros:**
- `_minPurchase`: Mínima compra en wei BNB
- `_maxPurchase`: Máxima compra en wei BNB

```solidity
function setVestingConfig(uint256 _immediatePercent, uint256 _cliffPeriod, uint256 _vestingDuration) external onlyOwner
```
**Descripción:** Configura parámetros de vesting  
**Parámetros:**
- `_immediatePercent`: Porcentaje liberado inmediatamente (0-10000)
- `_cliffPeriod`: Período de cliff en segundos
- `_vestingDuration`: Duración total de vesting en segundos

```solidity
function withdrawBNB() external onlyOwner
```
**Descripción:** Retira BNB acumulado en la presale  

### Eventos

```solidity
event TokensPurchased(address indexed buyer, uint256 bnbAmount, uint256 tokenAmount)
```
**Descripción:** Emitido cuando se compran tokens

```solidity
event TokensClaimed(address indexed claimer, uint256 amount)
```
**Descripción:** Emitido cuando se reclaman tokens

```solidity
event WhitelistAdded(address indexed account)
```
**Descripción:** Emitido cuando se añade a whitelist

```solidity
event WhitelistRemoved(address indexed account)
```
**Descripción:** Emitido cuando se remueve de whitelist

```solidity
event PresalePhaseChanged(PresalePhase oldPhase, PresalePhase newPhase)
```
**Descripción:** Emitido cuando cambia la fase

```solidity
event PresalePriceUpdated(uint256 oldPrice, uint256 newPrice)
```
**Descripción:** Emitido cuando se actualiza el precio

```solidity
event VestingConfigUpdated(uint256 immediatePercent, uint256 cliffPeriod, uint256 vestingDuration)
```
**Descripción:** Emitido cuando se actualiza configuración de vesting

## 🔗 CGATOLiquidityConnector Contract

### Información Básica

```solidity
contract CGATOLiquidityConnector is Ownable, ReentrancyGuard
```

### Estructuras

```solidity
struct DEXInfo {
    address router;
    address factory;
    string name;
    bool active;
    uint256 liquidityShare; // Porcentaje en base 10000 (100% = 10000)
}

struct RouteInfo {
    address router;
    uint256 outputAmount;
    address[] path;
}
```

### Funciones Públicas

#### Gestión de DEXs

```solidity
function addDEX(address _router, address _factory, string memory _name, uint256 _liquidityShare) external onlyOwner
```
**Descripción:** Añade un nuevo DEX  
**Parámetros:**
- `_router`: Dirección del router del DEX
- `_factory`: Dirección de la factory del DEX
- `_name`: Nombre del DEX
- `_liquidityShare`: Porcentaje de liquidez (0-10000)

```solidity
function removeDEX(address _router) external onlyOwner
```
**Descripción:** Remueve un DEX  
**Parámetros:**
- `_router`: Dirección del router a remover

```solidity
function updateDEXLiquidityShare(address _router, uint256 _newShare) external onlyOwner
```
**Descripción:** Actualiza el porcentaje de liquidez de un DEX  
**Parámetros:**
- `_router`: Dirección del router
- `_newShare`: Nuevo porcentaje (0-10000)

```solidity
function setDEXActive(address _router, bool _active) external onlyOwner
```
**Descripción:** Activa/desactiva un DEX  
**Parámetros:**
- `_router`: Dirección del router
- `_active`: true para activar, false para desactivar

#### Distribución de Liquidez

```solidity
function distributeInitialLiquidity(uint256 tokenAmount) external payable onlyOwner nonReentrant
```
**Descripción:** Distribuye liquidez inicial entre los DEXs  
**Parámetros:**
- `tokenAmount`: Cantidad de tokens a distribuir
**Requiere:** BNB enviado con la transacción

```solidity
function addLiquidityToDEX(address router, uint256 tokenAmount) external payable onlyOwner nonReentrant
```
**Descripción:** Añade liquidez a un DEX específico  
**Parámetros:**
- `router`: Dirección del router del DEX
- `tokenAmount`: Cantidad de tokens

#### Optimización de Rutas

```solidity
function getBestBuyRoute(uint256 bnbAmount) external view returns (RouteInfo memory)
```
**Descripción:** Encuentra la mejor ruta para comprar tokens  
**Parámetros:**
- `bnbAmount`: Cantidad de BNB en wei
**Retorna:** Información de la mejor ruta

```solidity
function getBestSellRoute(uint256 tokenAmount) external view returns (RouteInfo memory)
```
**Descripción:** Encuentra la mejor ruta para vender tokens  
**Parámetros:**
- `tokenAmount`: Cantidad de tokens en wei
**Retorna:** Información de la mejor ruta

```solidity
function compareAllRoutes(uint256 inputAmount, bool isBuy) external view returns (RouteInfo[] memory)
```
**Descripción:** Compara todas las rutas disponibles  
**Parámetros:**
- `inputAmount`: Cantidad de entrada
- `isBuy`: true para compra, false para venta
**Retorna:** Array con información de todas las rutas

#### Funciones de Información

```solidity
function getAllDEXsInfo() external view returns (address[] memory routers, string[] memory names, bool[] memory activeStatus, uint256[] memory liquidityShares)
```
**Descripción:** Obtiene información de todos los DEXs  
**Retorna:** (routers, nombres, estados, porcentajes)

```solidity
function getTotalLiquidityShare() external view returns (uint256)
```
**Descripción:** Obtiene el porcentaje total de liquidez asignado  
**Retorna:** Porcentaje total (0-10000)

```solidity
function getDEXInfo(address router) external view returns (DEXInfo memory)
```
**Descripción:** Obtiene información de un DEX específico  
**Parámetros:**
- `router`: Dirección del router
**Retorna:** Estructura DEXInfo

```solidity
function isValidDEX(address router) external view returns (bool)
```
**Descripción:** Verifica si un router es un DEX válido y activo  
**Parámetros:**
- `router`: Dirección del router
**Retorna:** true si es válido y activo

#### Funciones de Rescate

```solidity
function rescueTokens(address tokenAddress) external onlyOwner
```
**Descripción:** Rescata tokens atrapados en el contrato  
**Parámetros:**
- `tokenAddress`: Dirección del token a rescatar

```solidity
function rescueBNB() external onlyOwner
```
**Descripción:** Rescata BNB atrapado en el contrato  

### Eventos

```solidity
event DEXAdded(address indexed router, string name, uint256 liquidityShare)
```
**Descripción:** Emitido cuando se añade un DEX

```solidity
event DEXRemoved(address indexed router)
```
**Descripción:** Emitido cuando se remueve un DEX

```solidity
event DEXLiquidityShareUpdated(address indexed router, uint256 newShare)
```
**Descripción:** Emitido cuando se actualiza el porcentaje de liquidez

```solidity
event DEXStatusChanged(address indexed router, bool active)
```
**Descripción:** Emitido cuando se cambia el estado de un DEX

```solidity
event LiquidityDistributed(uint256 totalTokens, uint256 totalBNB, uint256 dexCount)
```
**Descripción:** Emitido cuando se distribuye liquidez

```solidity
event LiquidityAdded(address indexed router, uint256 tokenAmount, uint256 bnbAmount, uint256 liquidity)
```
**Descripción:** Emitido cuando se añade liquidez a un DEX

## 🔧 Utilidades y Librerías

### CryptoGatoUtils Library

```solidity
library CryptoGatoUtils {
    function calculatePercentage(uint256 amount, uint256 percentage) internal pure returns (uint256)
    function isValidPercentage(uint256 percentage) internal pure returns (bool)
    function calculateVestingAmount(uint256 totalAmount, uint256 timeElapsed, uint256 vestingDuration, uint256 immediatePercent, uint256 cliffPeriod) internal pure returns (uint256)
}
```

### CGErrors Library

```solidity
library CGErrors {
    // Errores personalizados para mejor debugging
    error ZeroAddress();
    error InvalidAmount();
    error ExceedsMaxSupply();
    error CategoryLimitExceeded();
    error UnauthorizedMinter();
    error InvalidCategory();
    error TransferAmountExceedsBalance();
    error ApprovalToCurrentOwner();
    error TransferToZeroAddress();
    error TransferFromZeroAddress();
    error InsufficientAllowance();
    error MaxTransactionAmountExceeded();
    error MaxWalletAmountExceeded();
    error ContractPaused();
    error PresaleNotActive();
    error PresaleEnded();
    error NotWhitelisted();
    error InsufficientPayment();
    error PurchaseLimitExceeded();
    error NoTokensToVest();
    error CliffPeriodNotMet();
    error DEXNotRegistered();
    error DEXAlreadyRegistered();
    error InvalidLiquidityShare();
    error NoDEXRegistered();
    error NoValidRouteFound();
    error InsufficientLiquidity();
}
```

## 📊 Códigos de Error

| Error | Descripción | Solución |
|-------|-------------|----------|
| `ZeroAddress()` | Se pasó dirección cero donde no está permitida | Usar dirección válida |
| `InvalidAmount()` | Cantidad inválida (cero o negativa) | Usar cantidad positiva |
| `ExceedsMaxSupply()` | Intento de acuñar más del suministro máximo | Verificar límites |
| `CategoryLimitExceeded()` | Excede el límite de una categoría | Verificar categoría disponible |
| `UnauthorizedMinter()` | Dirección no autorizada para acuñar | Solicitar permisos de minter |
| `MaxTransactionAmountExceeded()` | Transacción excede límite anti-whale | Reducir cantidad |
| `MaxWalletAmountExceeded()` | Wallet excedería límite | Distribir en múltiples wallets |
| `PresaleNotActive()` | Presale no está en fase activa | Esperar fase correcta |
| `NotWhitelisted()` | Usuario no está en whitelist | Añadir a whitelist |
| `DEXNotRegistered()` | DEX no está registrado | Registrar DEX primero |

## 🌐 Endpoints de Red

### BSC Mainnet
- **RPC:** `https://bsc-dataseed1.binance.org/`
- **Chain ID:** `56`
- **Explorer:** `https://bscscan.com/`

### BSC Testnet
- **RPC:** `https://data-seed-prebsc-1-s1.binance.org:8545/`
- **Chain ID:** `97`
- **Explorer:** `https://testnet.bscscan.com/`

## 📚 Ejemplos de Uso

### Interacción con Web3.js

```javascript
// Conectar al contrato CryptoGato
const contract = new web3.eth.Contract(CGATO_ABI, CGATO_ADDRESS);

// Obtener balance
const balance = await contract.methods.balanceOf(userAddress).call();

// Transferir tokens
await contract.methods.transfer(recipientAddress, amount).send({
    from: userAddress,
    gas: 100000
});

// Verificar información de categoría
const categoryInfo = await contract.methods.getCategoryInfo(1).call();
console.log(`Porcentaje: ${categoryInfo[0]}, Acuñado: ${categoryInfo[1]}`);
```

### Interacción con Ethers.js

```javascript
// Conectar al contrato
const contract = new ethers.Contract(CGATO_ADDRESS, CGATO_ABI, signer);

// Comprar en presale
const presaleContract = new ethers.Contract(PRESALE_ADDRESS, PRESALE_ABI, signer);
await presaleContract.buyTokens({
    value: ethers.utils.parseEther("1.0") // 1 BNB
});

// Reclamar tokens vested
await presaleContract.claimTokens();

// Verificar tokens reclamables
const claimable = await presaleContract.getClaimableTokens(userAddress);
```

Esta documentación proporciona una referencia completa para desarrolladores que deseen integrar con el ecosistema CryptoGato.