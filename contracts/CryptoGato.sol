// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "./interfaces/IPancakeRouter.sol";
import "./interfaces/IPancakeFactory.sol";
import "./interfaces/IPancakePair.sol";
import "./libraries/CryptoGatoUtils.sol";
import "./libraries/CGErrors.sol";

/**
 * @title CryptoGato Token
 * @dev Implementación de token BEP-20/ERC-20 avanzado con sistema de distribución por categorías,
 * protección anti-whale, fees automáticos para liquidez y otras características avanzadas.
 * @author CryptoGato Team
 */
contract CryptoGato is ERC20, Ownable, Pausable, ReentrancyGuard {
    // ================= CONSTANTES Y VARIABLES DE ESTADO =================

    /// @notice Decimales del token
    uint8 private constant _decimals = 18;

    /// @notice Suministro máximo del token (10 mil millones)
    uint256 public constant MAX_SUPPLY = 10_000_000_000 * 10**_decimals;

    /// @notice Categorías de distribución del token
    uint8 public constant CATEGORY_NONE = 0;
    uint8 public constant CATEGORY_PRESALE = 1;        // 30% - Preventa
    uint8 public constant CATEGORY_LIQUIDITY = 2;      // 25% - Liquidez
    uint8 public constant CATEGORY_TEAM_MARKETING = 3; // 20% - Equipo/Marketing
    uint8 public constant CATEGORY_EXCHANGES = 4;      // 15% - Exchanges
    uint8 public constant CATEGORY_ECOSYSTEM = 5;      // 5%  - Recompensas Ecosistema
    uint8 public constant CATEGORY_STRATEGIC = 6;      // 5%  - Reserva Estratégica

    /// @notice Porcentajes de cada categoría (en base 1000 para evitar decimales)
    mapping(uint8 => uint256) public categoryPercentages;

    /// @notice Cantidad acuñada por categoría
    mapping(uint8 => uint256) public categoryMinted;

    /// @notice Direcciones autorizadas para acuñar tokens
    mapping(address => bool) public isMinter;

    /// @notice Direcciones exentas de límites de transacción
    mapping(address => bool) public isExemptFromLimits;

    /// @notice Direcciones exentas de fees
    mapping(address => bool) public isExemptFromFees;

    /// @notice Límite máximo por transacción (0.5% del suministro)
    uint256 public maxTxAmount = MAX_SUPPLY * 5 / 1000; // 0.5%

    /// @notice Límite máximo por wallet (2% del suministro)
    uint256 public maxWalletAmount = MAX_SUPPLY * 20 / 1000; // 2%

    /// @notice Fee de liquidez (5% por defecto, expresado en base 10000)
    uint256 public liquidityFee = 500; // 5%

    /// @notice Umbral para ejecutar swap a liquidez
    uint256 public swapThreshold = 5_000_000 * 10**_decimals;

    /// @notice Flag para habilitar o deshabilitar el trading
    bool public tradingEnabled = false;

    /// @notice Tokens acumulados para liquidez
    uint256 private tokensForLiquidity = 0;

    /// @notice Router de PancakeSwap
    IPancakeRouter02 public pancakeRouter;

    /// @notice Par de liquidez en PancakeSwap
    address public pancakePair;

    /// @notice Flag para evitar swaps múltiples
    bool private inSwap = false;

    /// @notice Slippage mínimo aceptable para swaps (en base 10000, 1% por defecto)
    uint256 public minSlippage = 100; // 1%

    /// @notice Timelock para funciones críticas (24 horas por defecto)
    uint256 public constant TIMELOCK_DURATION = 24 hours;

    /// @notice Mapeo de operaciones pendientes con timelock
    mapping(bytes32 => uint256) public timelockOperations;

    /// @notice Modificador para evitar reentrancia en swaps
    modifier lockTheSwap {
        inSwap = true;
        _;
        inSwap = false;
    }

    // ================= EVENTOS =================

    /// @notice Evento emitido cuando se añade un minter
    event MinterAdded(address indexed minter);

    /// @notice Evento emitido cuando se elimina un minter
    event MinterRemoved(address indexed minter);

    /// @notice Evento emitido cuando se acuñan tokens
    event TokensMinted(address indexed to, uint256 amount, uint8 category);

    /// @notice Evento emitido cuando se queman tokens
    event TokensBurned(address indexed from, uint256 amount);

    /// @notice Evento emitido cuando se actualiza el límite por transacción
    event MaxTxAmountUpdated(uint256 newAmount);

    /// @notice Evento emitido cuando se actualiza el límite por wallet
    event MaxWalletAmountUpdated(uint256 newAmount);

    /// @notice Evento emitido cuando se actualiza el fee de liquidez
    event LiquidityFeeUpdated(uint256 newFee);

    /// @notice Evento emitido cuando se actualiza el umbral de swap
    event SwapThresholdUpdated(uint256 newThreshold);

    /// @notice Evento emitido cuando se actualiza el estado del trading
    event TradingStatusUpdated(bool enabled);

    /// @notice Evento emitido específicamente cuando se habilita el trading
    event TradingEnabled(uint256 timestamp);

    /// @notice Evento emitido cuando se actualiza el router de PancakeSwap
    event PancakeRouterUpdated(address indexed newRouter);

    /// @notice Evento emitido cuando se añade liquidez
    event LiquidityAdded(uint256 tokensAmount, uint256 bnbAmount);

    /// @notice Evento emitido cuando una dirección es excluida de límites
    event AddressExemptedFromLimits(address indexed account, bool status);

    /// @notice Evento emitido cuando una dirección es excluida de fees
    event AddressExemptedFromFees(address indexed account, bool status);

    /// @notice Evento emitido cuando se programa una operación con timelock
    event TimelockOperationScheduled(bytes32 indexed operationId, uint256 executionTime);

    /// @notice Evento emitido cuando se ejecuta una operación con timelock
    event TimelockOperationExecuted(bytes32 indexed operationId);

    /// @notice Evento emitido cuando falla un swap
    event SwapFailed(uint256 tokenAmount);

    /// @notice Evento emitido cuando falla la adición de liquidez
    event LiquidityAdditionFailed(uint256 tokenAmount, uint256 bnbAmount);

    /// @notice Evento emitido cuando se rescatan tokens
    event TokensRescued(address indexed tokenAddress, address indexed recipient, uint256 amount);

    /// @notice Evento emitido cuando se rescata BNB
    event BNBRescued(address indexed recipient, uint256 amount);

    /// @notice Evento emitido cuando se actualiza el slippage mínimo
    event MinSlippageUpdated(uint256 newSlippage);

    /// @notice Evento emitido cuando se pausa el contrato
    event ContractPaused(address indexed by);

    /// @notice Evento emitido cuando se reanuda el contrato
    event ContractUnpaused(address indexed by);

    /// @notice Evento emitido cuando se cancela una operación con timelock
    event TimelockOperationCancelled(bytes32 indexed operationId);

    // ================= CONSTRUCTOR =================

    /**
     * @dev Constructor que inicializa el token CGATO
     * @param router La dirección del router de PancakeSwap
     */
    constructor(address router) ERC20("CryptoGato", "CGATO") Ownable(msg.sender) {
        // Configuración de porcentajes de categorías (base 1000)
        categoryPercentages[CATEGORY_PRESALE] = 300;         // 30%
        categoryPercentages[CATEGORY_LIQUIDITY] = 250;       // 25%
        categoryPercentages[CATEGORY_TEAM_MARKETING] = 200;  // 20%
        categoryPercentages[CATEGORY_EXCHANGES] = 150;       // 15%
        categoryPercentages[CATEGORY_ECOSYSTEM] = 50;        // 5%
        categoryPercentages[CATEGORY_STRATEGIC] = 50;        // 5%

        // Configurar router de PancakeSwap
        require(router != address(0), "CryptoGato: zero router address");
        IPancakeRouter02 _pancakeRouter = IPancakeRouter02(router);
        pancakeRouter = _pancakeRouter;

        // Crear par en PancakeSwap
        address _pancakeFactory = _pancakeRouter.factory();
        pancakePair = IPancakeFactory(_pancakeFactory).createPair(
            address(this),
            _pancakeRouter.WETH()
        );

        // Añadir excepciones para direcciones especiales
        isExemptFromLimits[msg.sender] = true;
        isExemptFromLimits[address(this)] = true;
        isExemptFromFees[msg.sender] = true;
        isExemptFromFees[address(this)] = true;

        // Owner es minter por defecto
        isMinter[msg.sender] = true;
    }

    // ================= FUNCIONES DE ACUÑACIÓN Y DISTRIBUCIÓN =================

    /**
     * @dev Acuña tokens para una dirección específica dentro de una categoría.
     * Solo puede ser llamado por minters autorizados.
     * @param to Dirección a la que se acuñarán los tokens
     * @param amount Cantidad de tokens a acuñar
     * @param category Categoría a la que se asignará esta acuñación
     */
    function mint(address to, uint256 amount, uint8 category) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        if (!isMinter[msg.sender]) revert CGErrors.NotMinter(msg.sender);
        if (category == CATEGORY_NONE) revert CGErrors.InvalidCategory(category);
        if (to == address(0)) revert CGErrors.ZeroAddress();

        // Validar que no se exceda el suministro máximo
        uint256 totalSupplyAfterMint = totalSupply() + amount;
        if (totalSupplyAfterMint > MAX_SUPPLY) 
            revert CGErrors.ExceedsMaxSupply(totalSupplyAfterMint, MAX_SUPPLY);

        // Validar que no se exceda el límite de categoría usando la biblioteca
        uint256 categoryLimit = CryptoGatoUtils.calculateCategoryLimit(MAX_SUPPLY, categoryPercentages[category]);
        uint256 categoryTotalAfterMint = categoryMinted[category] + amount;
        if (categoryTotalAfterMint > categoryLimit) 
            revert CGErrors.ExceedsCategoryLimit(category, categoryTotalAfterMint, categoryLimit);

        // Actualizar categoría y acuñar tokens
        categoryMinted[category] += amount;
        _mint(to, amount);

        emit TokensMinted(to, amount, category);
    }

    /**
     * @dev Quema tokens de la dirección del remitente
     * @param amount Cantidad de tokens a quemar
     */
    function burn(uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        if (amount == 0) revert CGErrors.InvalidAmount();

        // Verificar que el remitente tenga suficientes tokens
        if (balanceOf(msg.sender) < amount) 
            revert CGErrors.InsufficientBalance(amount, balanceOf(msg.sender));

        // Quemar los tokens
        _burn(msg.sender, amount);

        emit TokensBurned(msg.sender, amount);
    }

    /**
     * @dev Quema tokens desde una dirección específica (requiere aprobación)
     * @param account Dirección de la cual quemar tokens
     * @param amount Cantidad de tokens a quemar
     */
    function burnFrom(address account, uint256 amount) 
        external 
        whenNotPaused 
        nonReentrant 
    {
        if (amount == 0) revert CGErrors.InvalidAmount();
        if (account == address(0)) revert CGErrors.ZeroAddress();

        // Verificar que el remitente tenga suficiente allowance
        uint256 currentAllowance = allowance(account, msg.sender);
        if (currentAllowance < amount) 
            revert("CryptoGato: burn amount exceeds allowance");

        // Quemar los tokens
        _spendAllowance(account, msg.sender, amount);
        _burn(account, amount);

        emit TokensBurned(account, amount);
    }

    /**
     * @dev Retorna el límite de tokens para una categoría
     * @param category Categoría a consultar
     * @return Cantidad máxima de tokens permitidos para la categoría
     */
    function getCategoryLimit(uint8 category) external view returns (uint256) {
        return CryptoGatoUtils.calculateCategoryLimit(MAX_SUPPLY, categoryPercentages[category]);
    }

    /**
     * @dev Retorna la cantidad disponible para acuñar en una categoría
     * @param category Categoría a consultar
     * @return Cantidad disponible para acuñar
     */
    function getCategoryAvailable(uint8 category) external view returns (uint256) {
        uint256 categoryLimit = MAX_SUPPLY * categoryPercentages[category] / 1000;
        return categoryLimit - categoryMinted[category];
    }

    // ================= GESTIÓN DE MINTERS =================

    /**
     * @dev Programa la adición de un minter con timelock
     * @param minter Dirección a añadir como minter
     */
    function scheduleAddMinter(address minter) external onlyOwner {
        require(minter != address(0), "CryptoGato: invalid minter address");
        require(!isMinter[minter], "CryptoGato: address is already a minter");

        bytes32 operationId = keccak256(abi.encode("addMinter", minter));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la adición de un minter después del timelock
     * @param minter Dirección a añadir como minter
     */
    function executeAddMinter(address minter) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("addMinter", minter));
        require(timelockOperations[operationId] > 0, "CryptoGato: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGato: timelock not expired");

        delete timelockOperations[operationId];

        isMinter[minter] = true;
        emit MinterAdded(minter);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Elimina una dirección de la lista de minters autorizados
     * @param minter Dirección a eliminar como minter
     */
    function removeMinter(address minter) external onlyOwner {
        require(isMinter[minter], "CryptoGato: not a minter");

        isMinter[minter] = false;
        emit MinterRemoved(minter);
    }

    // ================= GESTIÓN DE LÍMITES Y EXCLUSIONES =================

    /**
     * @dev Programa la actualización del límite máximo por transacción con timelock
     * @param amount Nuevo límite máximo por transacción
     */
    function scheduleSetMaxTxAmount(uint256 amount) external onlyOwner {
        require(amount >= MAX_SUPPLY * 1 / 1000, "CryptoGato: amount too low");
        require(amount <= MAX_SUPPLY * 50 / 1000, "CryptoGato: amount too high");

        bytes32 operationId = keccak256(abi.encode("setMaxTxAmount", amount));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del límite máximo por transacción después del timelock
     * @param amount Nuevo límite máximo por transacción
     */
    function executeSetMaxTxAmount(uint256 amount) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("setMaxTxAmount", amount));
        require(timelockOperations[operationId] > 0, "CryptoGato: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGato: timelock not expired");

        delete timelockOperations[operationId];

        maxTxAmount = amount;
        emit MaxTxAmountUpdated(amount);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Programa la actualización del límite máximo por wallet con timelock
     * @param amount Nuevo límite máximo por wallet
     */
    function scheduleSetMaxWalletAmount(uint256 amount) external onlyOwner {
        require(amount >= MAX_SUPPLY * 5 / 1000, "CryptoGato: amount too low");
        require(amount <= MAX_SUPPLY * 100 / 1000, "CryptoGato: amount too high");

        bytes32 operationId = keccak256(abi.encode("setMaxWalletAmount", amount));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del límite máximo por wallet después del timelock
     * @param amount Nuevo límite máximo por wallet
     */
    function executeSetMaxWalletAmount(uint256 amount) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("setMaxWalletAmount", amount));
        require(timelockOperations[operationId] > 0, "CryptoGato: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGato: timelock not expired");

        delete timelockOperations[operationId];

        maxWalletAmount = amount;
        emit MaxWalletAmountUpdated(amount);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Excluye o incluye una dirección en los límites de transacción y wallet
     * @param account Dirección a excluir/incluir
     * @param exempt True para excluir, false para incluir
     */
    function setExemptFromLimits(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert CGErrors.ZeroAddress();

        isExemptFromLimits[account] = exempt;
        emit AddressExemptedFromLimits(account, exempt);
    }

    /**
     * @dev Excluye o incluye una dirección en los fees
     * @param account Dirección a excluir/incluir
     * @param exempt True para excluir, false para incluir
     */
    function setExemptFromFees(address account, bool exempt) external onlyOwner {
        if (account == address(0)) revert CGErrors.ZeroAddress();

        isExemptFromFees[account] = exempt;
        emit AddressExemptedFromFees(account, exempt);
    }

    // ================= GESTIÓN DE FEES Y LIQUIDEZ =================

    /**
     * @dev Programa la actualización del fee de liquidez con timelock
     * @param newFee Nuevo fee de liquidez (base 10000)
     */
    function scheduleSetLiquidityFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert CGErrors.FeeExceedsMax(newFee);

        bytes32 operationId = keccak256(abi.encode("setLiquidityFee", newFee));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del fee de liquidez después del timelock
     * @param newFee Nuevo fee de liquidez (base 10000)
     */
    function executeSetLiquidityFee(uint256 newFee) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("setLiquidityFee", newFee));
        if (timelockOperations[operationId] == 0) 
            revert CGErrors.OperationNotScheduled(operationId);
        if (block.timestamp < timelockOperations[operationId]) 
            revert CGErrors.TimelockNotExpired(operationId, timelockOperations[operationId]);

        delete timelockOperations[operationId];

        liquidityFee = newFee;
        emit LiquidityFeeUpdated(newFee);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Actualiza el umbral para ejecutar swap a liquidez
     * @param newThreshold Nuevo umbral
     */
    function setSwapThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold == 0) revert CGErrors.ThresholdTooLow();

        swapThreshold = newThreshold;
        emit SwapThresholdUpdated(newThreshold);
    }

    /**
     * @dev Actualiza el slippage mínimo aceptable para swaps
     * @param newSlippage Nuevo slippage mínimo (base 10000)
     */
    function setMinSlippage(uint256 newSlippage) external onlyOwner {
        if (newSlippage == 0 || newSlippage > 1000) revert CGErrors.InvalidSlippage(newSlippage);

        minSlippage = newSlippage;
        emit MinSlippageUpdated(newSlippage);
    }

    /**
     * @dev Programa la actualización del router de PancakeSwap con timelock
     * @param newRouter Dirección del nuevo router
     */
    function scheduleUpdatePancakeRouter(address newRouter) external onlyOwner {
        if (newRouter == address(0)) revert CGErrors.ZeroAddress();

        bytes32 operationId = keccak256(abi.encode("updatePancakeRouter", newRouter));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del router de PancakeSwap después del timelock
     * @param newRouter Dirección del nuevo router
     */
    function executeUpdatePancakeRouter(address newRouter) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("updatePancakeRouter", newRouter));
        if (timelockOperations[operationId] == 0)
            revert CGErrors.OperationNotScheduled(operationId);
        if (block.timestamp < timelockOperations[operationId])
            revert CGErrors.TimelockNotExpired(operationId, timelockOperations[operationId]);

        delete timelockOperations[operationId];

        IPancakeRouter02 _pancakeRouter = IPancakeRouter02(newRouter);
        pancakeRouter = _pancakeRouter;

        // Actualizar par de liquidez
        address _pancakeFactory = _pancakeRouter.factory();
        pancakePair = IPancakeFactory(_pancakeFactory).createPair(
            address(this),
            _pancakeRouter.WETH()
        );

        emit PancakeRouterUpdated(newRouter);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Programa la actualización del estado del trading con timelock
     * @param enabled True para habilitar, false para deshabilitar
     */
    function scheduleSetTradingEnabled(bool enabled) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("setTradingEnabled", enabled));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del estado del trading después del timelock
     * @param enabled True para habilitar, false para deshabilitar
     */
    function executeSetTradingEnabled(bool enabled) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("setTradingEnabled", enabled));
        require(timelockOperations[operationId] > 0, "CryptoGato: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGato: timelock not expired");

        delete timelockOperations[operationId];

        tradingEnabled = enabled;
        emit TradingStatusUpdated(enabled);

        // Emitir evento específico cuando se habilita el trading por primera vez
        if (enabled) {
            emit TradingEnabled(block.timestamp);
        }

        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Ejecuta manualmente el swap a liquidez
     */
    function swapAndLiquify() external whenNotPaused nonReentrant {
        require(tokensForLiquidity >= swapThreshold, "CryptoGato: below threshold");
        _swapAndLiquify(tokensForLiquidity);
    }

    /**
     * @dev Implementación interna del swap a liquidez con manejo de errores
     * @param tokenAmount Cantidad de tokens a swappear
     */
    function _swapAndLiquify(uint256 tokenAmount) private lockTheSwap {
        // Dividir el balance en dos partes: una para swap a BNB, otra para añadir liquidez
        uint256 half = tokenAmount / 2;
        uint256 otherHalf = tokenAmount - half;

        // Calcular BNB esperado para la mitad de los tokens
        uint256 initialBalance = address(this).balance;

        // Intentar hacer swap de tokens a BNB con manejo de errores
        try this._safeSwapTokensForBNB(half) {
            // Calcular cuánto BNB hemos recibido
            uint256 newBalance = address(this).balance - initialBalance;

            if (newBalance > 0) {
                // Intentar añadir liquidez con la otra mitad
                try this._safeAddLiquidity(otherHalf, newBalance) {
                    emit LiquidityAdded(otherHalf, newBalance);
                    // Resetear contador de tokens para liquidez solo si todo fue exitoso
                    tokensForLiquidity = 0;
                } catch {
                    // Si falla al añadir liquidez, emitir evento de error
                    emit LiquidityAdditionFailed(otherHalf, newBalance);
                }
            } else {
                // Si no recibimos BNB del swap, mantener los tokens para el próximo intento
                emit SwapFailed(half);
            }
        } catch {
            // Si falla el swap, emitir evento de error
            emit SwapFailed(half);
        }
    }

    /**
     * @dev Función externa para permitir el uso de try/catch
     * @param tokenAmount Cantidad de tokens a swappear
     */
    function _safeSwapTokensForBNB(uint256 tokenAmount) external onlyThis {
        _swapTokensForBNB(tokenAmount);
    }

    /**
     * @dev Función externa para permitir el uso de try/catch
     * @param tokenAmount Cantidad de tokens a añadir
     * @param bnbAmount Cantidad de BNB a añadir
     */
    function _safeAddLiquidity(uint256 tokenAmount, uint256 bnbAmount) external onlyThis {
        _addLiquidity(tokenAmount, bnbAmount);
    }

    /**
     * @dev Modificador que solo permite que el contrato se llame a sí mismo
     */
    modifier onlyThis() {
        if (msg.sender != address(this)) revert CGErrors.NotThisContract();
        _;
    }

    /**
     * @dev Swap de tokens a BNB con protección contra manipulación de precio
     * @param tokenAmount Cantidad de tokens a swappear
     */
    function _swapTokensForBNB(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();

        _approve(address(this), address(pancakeRouter), tokenAmount);

        // Obtener estimación de BNB a recibir
        uint256[] memory amountsOut = pancakeRouter.getAmountsOut(tokenAmount, path);
        uint256 expectedBnb = amountsOut[1];

        // Calcular mínimo aceptable con slippage usando la biblioteca
        uint256 minBnb = CryptoGatoUtils.calculateMinAmountWithSlippage(expectedBnb, minSlippage);

        pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            minBnb, // Mínimo BNB a recibir con slippage
            path,
            address(this),
            block.timestamp
        );
    }

        /**
     * @dev Añade liquidez al par token-BNB
     * @param tokenAmount Cantidad de tokens a añadir
     * @param bnbAmount Cantidad de BNB a añadir
     */
    function _addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(pancakeRouter), tokenAmount);

        // Calcular mínimos aceptables con slippage usando la biblioteca
        uint256 minTokens = CryptoGatoUtils.calculateMinAmountWithSlippage(tokenAmount, minSlippage);
        uint256 minBnb = CryptoGatoUtils.calculateMinAmountWithSlippage(bnbAmount, minSlippage);

        // Añadir liquidez a PancakeSwap
        pancakeRouter.addLiquidityETH{value: bnbAmount}(
            address(this),
            tokenAmount,
            minTokens, // Mínimo de tokens con slippage
            minBnb,    // Mínimo de BNB con slippage
            owner(),   // LP tokens van al owner
            block.timestamp
        );
    }

    // ================= TRANSFERENCIA Y FUNCIONES OVERRIDE =================

    /**
     * @dev Sobrecarga la función _update para implementar fees y límites
     */
    function _update(address from, address to, uint256 amount) internal override whenNotPaused {
        if (
            from != address(0) && // No es mint
            to != address(0) &&   // No es burn
            !inSwap               // No estamos en proceso de swap
        ) {
            // Aplicar restricciones y fees solo si trading está habilitado 
            // o si ambas direcciones están exentas
            bool applyRestrictions = tradingEnabled || 
                (isExemptFromLimits[from] && isExemptFromLimits[to]);

            if (applyRestrictions) {
                // Comprobar límites de transacción y wallet
                if (!isExemptFromLimits[from] && !isExemptFromLimits[to]) {
                    require(amount <= maxTxAmount, "CryptoGato: exceeds max tx amount");

                    // Comprobar límite de wallet solo para recipientes (no para ventas)
                    if (to != pancakePair) {
                        uint256 recipientBalance = balanceOf(to);
                        require(
                            recipientBalance + amount <= maxWalletAmount,
                            "CryptoGato: exceeds max wallet amount"
                        );
                    }
                }

                // Comprobar si debemos aplicar fee
                if (
                    !isExemptFromFees[from] && 
                    !isExemptFromFees[to] && 
                    liquidityFee > 0
                ) {
                    uint256 feeAmount = amount * liquidityFee / 10000;

                    if (feeAmount > 0) {
                        // Transferir fee al contrato para liquidez
                        super._update(from, address(this), feeAmount);
                        tokensForLiquidity += feeAmount;

                        // Reducir la cantidad que llegará al destinatario
                        amount = amount - feeAmount;
                    }

                    // Comprobar si debemos swappear
                    if (
                        to == pancakePair && // Solo en ventas
                        tokensForLiquidity >= swapThreshold && 
                        !inSwap
                    ) {
                        _swapAndLiquify(tokensForLiquidity);
                    }
                }
            } else {
                // Si trading no está habilitado, solo permitir transferencias a/desde direcciones exentas
                require(
                    isExemptFromLimits[from] || isExemptFromLimits[to],
                    "CryptoGato: trading not enabled yet"
                );
            }
        }

        super._update(from, to, amount);
    }

    // ================= FUNCIONES DE PAUSA =================

    /**
     * @dev Pausa el contrato (suspende las transferencias)
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @dev Reanuda el contrato (permite transferencias)
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // ================= FUNCIONES DE RESCATE =================

    /**
     * @dev Rescata tokens ERC20 enviados por error al contrato
     * @param tokenAddress Dirección del token a rescatar
     * @param to Dirección a la que enviar los tokens
     * @param amount Cantidad de tokens a rescatar
     */
    function rescueTokens(address tokenAddress, address to, uint256 amount) external onlyOwner {
        if (tokenAddress == address(this)) revert CGErrors.Unauthorized();
        if (to == address(0)) revert CGErrors.ZeroAddress();

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        if (amount > balance) revert CGErrors.InsufficientBalance(amount, balance);

        bool success = token.transfer(to, amount);
        if (!success) revert CGErrors.TransferFailed(tokenAddress, to, amount);

        emit TokensRescued(tokenAddress, to, amount);
    }

    /**
     * @dev Rescata BNB enviado por error al contrato
     * @param to Dirección a la que enviar el BNB
     * @param amount Cantidad de BNB a rescatar
     */
    function rescueBNB(address payable to, uint256 amount) external onlyOwner {
        if (to == address(0)) revert CGErrors.ZeroAddress();

        uint256 balance = address(this).balance;
        if (amount > balance) revert CGErrors.InsufficientBalance(amount, balance);

        (bool success, ) = to.call{value: amount}("");
        if (!success) revert CGErrors.FailedToSendBNB(to, amount);

        emit BNBRescued(to, amount);
    }

    // ================= FUNCIONES DE TIMELOCK =================

    /**
     * @dev Cancela una operación programada con timelock
     * @param operationId ID de la operación a cancelar
     */
    function cancelTimelockOperation(bytes32 operationId) external onlyOwner {
        if (timelockOperations[operationId] == 0) 
            revert CGErrors.OperationNotScheduled(operationId);

        delete timelockOperations[operationId];
        emit TimelockOperationCancelled(operationId);
    }

    // ================= FUNCIONES UTILITARIAS =================

    /**
     * @dev Retorna los decimales del token
     */
    function decimals() public pure override returns (uint8) {
        return _decimals;
    }

    /**
     * @dev Permite recibir BNB (necesario para recibir BNB del swap)
     */
    receive() external payable {}
}