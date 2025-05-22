// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
        uint256 executeTime = block.timestamp + TIMELOCK_DURATION;
        timelockOperations[operationId] = executeTime;

        emit TimelockOperationScheduled(operationId, executeTime);
    }

    /**
     * @dev Ejecuta la adición de un minter programada
     * @param minter Dirección a añadir como minter
     */
    function executeAddMinter(address minter) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("addMinter", minter));
        uint256 executeTime = timelockOperations[operationId];

        if (executeTime == 0) 
            revert CGErrors.OperationNotScheduled(operationId);
        if (block.timestamp < executeTime) 
            revert CGErrors.TimelockNotExpired(operationId, executeTime);

        delete timelockOperations[operationId];
        isMinter[minter] = true;

        emit MinterAdded(minter);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Elimina un minter (sin timelock para mayor flexibilidad de seguridad)
     * @param minter Dirección a eliminar como minter
     */
    function removeMinter(address minter) external onlyOwner {
        require(minter != address(0), "CryptoGato: invalid minter address");
        require(isMinter[minter], "CryptoGato: address is not a minter");
        require(minter != owner(), "CryptoGato: cannot remove owner as minter");

        isMinter[minter] = false;
        emit MinterRemoved(minter);
    }

    // ================= GESTIÓN DE LÍMITES Y FEES =================

    /**
     * @dev Actualiza el límite máximo por transacción
     * @param newAmount Nuevo límite (debe ser mayor a 0.1% del suministro total)
     */
    function updateMaxTxAmount(uint256 newAmount) external onlyOwner {
        require(newAmount >= totalSupply() / 1000, "CryptoGato: amount too low"); // Mínimo 0.1%
        require(newAmount <= totalSupply() / 100, "CryptoGato: amount too high"); // Máximo 1%

        maxTxAmount = newAmount;
        emit MaxTxAmountUpdated(newAmount);
    }

    /**
     * @dev Actualiza el límite máximo por wallet
     * @param newAmount Nuevo límite (debe ser mayor a 0.5% del suministro total)
     */
    function updateMaxWalletAmount(uint256 newAmount) external onlyOwner {
        require(newAmount >= totalSupply() * 5 / 1000, "CryptoGato: amount too low"); // Mínimo 0.5%
        require(newAmount <= totalSupply() / 50, "CryptoGato: amount too high"); // Máximo 2%

        maxWalletAmount = newAmount;
        emit MaxWalletAmountUpdated(newAmount);
    }

    /**
     * @dev Actualiza el fee de liquidez
     * @param newFee Nuevo fee (en base 10000, máximo 10%)
     */
    function updateLiquidityFee(uint256 newFee) external onlyOwner {
        if (newFee > 1000) revert CGErrors.FeeExceedsMax(newFee); // Máximo 10%

        liquidityFee = newFee;
        emit LiquidityFeeUpdated(newFee);
    }

    /**
     * @dev Actualiza el umbral para swap automático
     * @param newThreshold Nuevo umbral
     */
    function updateSwapThreshold(uint256 newThreshold) external onlyOwner {
        if (newThreshold < 1000 * 10**_decimals) revert CGErrors.ThresholdTooLow();

        swapThreshold = newThreshold;
        emit SwapThresholdUpdated(newThreshold);
    }

    // ================= GESTIÓN DE EXENCIONES =================

    /**
     * @dev Excluye o incluye una dirección de los límites de transacción
     * @param account Dirección a configurar
     * @param status true para exentar, false para incluir
     */
    function setExemptFromLimits(address account, bool status) external onlyOwner {
        if (account == address(0)) revert CGErrors.ZeroAddress();

        isExemptFromLimits[account] = status;
        emit AddressExemptedFromLimits(account, status);
    }

    /**
     * @dev Excluye o incluye una dirección de los fees
     * @param account Dirección a configurar
     * @param status true para exentar, false para incluir
     */
    function setExemptFromFees(address account, bool status) external onlyOwner {
        if (account == address(0)) revert CGErrors.ZeroAddress();

        isExemptFromFees[account] = status;
        emit AddressExemptedFromFees(account, status);
    }

    // ================= GESTIÓN DE TRADING =================

    /**
     * @dev Habilita el trading (solo una vez)
     */
    function enableTrading() external onlyOwner {
        require(!tradingEnabled, "CryptoGato: trading already enabled");

        tradingEnabled = true;
        emit TradingEnabled(block.timestamp);
        emit TradingStatusUpdated(true);
    }

    /**
     * @dev Actualiza el router de PancakeSwap
     * @param newRouter Nueva dirección del router
     */
    function updatePancakeRouter(address newRouter) external onlyOwner {
        require(newRouter != address(0), "CryptoGato: zero router address");

        pancakeRouter = IPancakeRouter02(newRouter);
        
        // Crear nuevo par si no existe
        address newPair = IPancakeFactory(pancakeRouter.factory()).getPair(
            address(this),
            pancakeRouter.WETH()
        );
        
        if (newPair == address(0)) {
            newPair = IPancakeFactory(pancakeRouter.factory()).createPair(
                address(this),
                pancakeRouter.WETH()
            );
        }
        
        pancakePair = newPair;
        emit PancakeRouterUpdated(newRouter);
    }

    // ================= FUNCIONES DE TRANSFERENCIA =================

    /**
     * @dev Sobrescribe la función de transferencia para implementar fees y límites
     */
    function _transfer(address from, address to, uint256 amount) internal override {
        if (from == address(0)) revert CGErrors.ZeroAddress();
        if (to == address(0)) revert CGErrors.ZeroAddress();
        if (amount == 0) {
            super._transfer(from, to, 0);
            return;
        }

        // Verificar si el trading está habilitado
        if (!tradingEnabled) {
            require(
                isExemptFromLimits[from] || isExemptFromLimits[to],
                "CryptoGato: trading not enabled"
            );
        }

        // Verificar límites de transacción
        if (!isExemptFromLimits[from] && !isExemptFromLimits[to]) {
            if (amount > maxTxAmount) 
                revert CGErrors.MaxTxAmountExceeded(amount, maxTxAmount);

            // Verificar límite de wallet (solo para compras)
            if (to != pancakePair && balanceOf(to) + amount > maxWalletAmount) 
                revert CGErrors.MaxWalletAmountExceeded(balanceOf(to) + amount, maxWalletAmount);
        }

        // Ejecutar swap si es necesario
        if (!inSwap && to == pancakePair && balanceOf(address(this)) >= swapThreshold) {
            swapAndLiquify();
        }

        // Calcular y aplicar fees
        bool takeFee = !inSwap && 
                       !isExemptFromFees[from] && 
                       !isExemptFromFees[to] &&
                       (from == pancakePair || to == pancakePair);

        if (takeFee && liquidityFee > 0) {
            uint256 feeAmount = CryptoGatoUtils.calculateBps(amount, liquidityFee);
            tokensForLiquidity += feeAmount;
            
            super._transfer(from, address(this), feeAmount);
            amount -= feeAmount;
        }

        super._transfer(from, to, amount);
    }

    /**
     * @dev Convierte tokens acumulados en BNB y añade liquidez
     */
    function swapAndLiquify() private lockTheSwap {
        uint256 contractTokenBalance = balanceOf(address(this));
        
        if (contractTokenBalance < swapThreshold) return;

        // Dividir tokens: la mitad para swap, la mitad para liquidez
        uint256 half = contractTokenBalance / 2;
        uint256 otherHalf = contractTokenBalance - half;

        uint256 initialBNBBalance = address(this).balance;

        // Swap de la primera mitad por BNB
        swapTokensForBNB(half);

        uint256 newBNBBalance = address(this).balance - initialBNBBalance;

        // Añadir liquidez con la segunda mitad de tokens y el BNB obtenido
        if (newBNBBalance > 0 && otherHalf > 0) {
            addLiquidity(otherHalf, newBNBBalance);
        }

        // Resetear contador de tokens para liquidez
        tokensForLiquidity = 0;
    }

    /**
     * @dev Intercambia tokens por BNB
     * @param tokenAmount Cantidad de tokens a intercambiar
     */
    function swapTokensForBNB(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = pancakeRouter.WETH();

        _approve(address(this), address(pancakeRouter), tokenAmount);

        try pancakeRouter.swapExactTokensForETHSupportingFeeOnTransferTokens(
            tokenAmount,
            0, // Aceptar cualquier cantidad de BNB
            path,
            address(this),
            block.timestamp
        ) {} catch {
            emit SwapFailed(tokenAmount);
        }
    }

    /**
     * @dev Añade liquidez al par CGATO/BNB
     * @param tokenAmount Cantidad de tokens
     * @param bnbAmount Cantidad de BNB
     */
    function addLiquidity(uint256 tokenAmount, uint256 bnbAmount) private {
        _approve(address(this), address(pancakeRouter), tokenAmount);

        try pancakeRouter.addLiquidityETH{value: bnbAmount}(
            address(this),
            tokenAmount,
            0, // Acepta cualquier cantidad de tokens
            0, // Acepta cualquier cantidad de BNB
            owner(),
            block.timestamp
        ) {
            emit LiquidityAdded(tokenAmount, bnbAmount);
        } catch {
            emit LiquidityAdditionFailed(tokenAmount, bnbAmount);
        }
    }

    // ================= FUNCIONES DE PAUSA =================

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyOwner {
        _pause();
        emit ContractPaused(msg.sender);
    }

    /**
     * @dev Reanuda el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
        emit ContractUnpaused(msg.sender);
    }

    // ================= FUNCIONES DE RESCATE =================

    /**
     * @dev Rescata tokens enviados por error al contrato
     * @param tokenAddress Dirección del token a rescatar
     * @param recipient Dirección que recibirá los tokens
     */
    function rescueTokens(address tokenAddress, address recipient) external onlyOwner {
        if (tokenAddress == address(0)) revert CGErrors.ZeroAddress();
        if (recipient == address(0)) revert CGErrors.ZeroAddress();
        if (tokenAddress == address(this)) revert CGErrors.NotThisContract();

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        if (balance > 0) {
            token.transfer(recipient, balance);
            emit TokensRescued(tokenAddress, recipient, balance);
        }
    }

    /**
     * @dev Rescata BNB enviados por error al contrato
     * @param recipient Dirección que recibirá el BNB
     */
    function rescueBNB(address payable recipient) external onlyOwner {
        if (recipient == address(0)) revert CGErrors.ZeroAddress();

        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = recipient.call{value: balance}("");
            require(success, "CryptoGato: BNB transfer failed");
            emit BNBRescued(recipient, balance);
        }
    }

    // ================= FUNCIONES DE VISTA =================

    /**
     * @dev Retorna información completa del contrato
     */
    function getContractInfo() external view returns (
        uint256 _totalSupply,
        uint256 _maxSupply,
        uint256 _maxTxAmount,
        uint256 _maxWalletAmount,
        uint256 _liquidityFee,
        uint256 _swapThreshold,
        bool _tradingEnabled,
        address _pancakeRouter,
        address _pancakePair
    ) {
        return (
            totalSupply(),
            MAX_SUPPLY,
            maxTxAmount,
            maxWalletAmount,
            liquidityFee,
            swapThreshold,
            tradingEnabled,
            address(pancakeRouter),
            pancakePair
        );
    }

    /**
     * @dev Retorna información de todas las categorías
     */
    function getAllCategoriesInfo() external view returns (
        uint8[] memory categories,
        uint256[] memory percentages,
        uint256[] memory limits,
        uint256[] memory minted,
        uint256[] memory available
    ) {
        categories = new uint8[](6);
        percentages = new uint256[](6);
        limits = new uint256[](6);
        minted = new uint256[](6);
        available = new uint256[](6);

        for (uint8 i = 1; i <= 6; i++) {
            categories[i-1] = i;
            percentages[i-1] = categoryPercentages[i];
            limits[i-1] = CryptoGatoUtils.calculateCategoryLimit(MAX_SUPPLY, categoryPercentages[i]);
            minted[i-1] = categoryMinted[i];
            available[i-1] = limits[i-1] - minted[i-1];
        }
    }

    // ================= FUNCIONES DE CANCELACIÓN DE TIMELOCK =================

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

    // ================= FUNCIONES PARA RECIBIR BNB =================

    /**
     * @dev Permite al contrato recibir BNB
     */
    receive() external payable {}

    /**
     * @dev Función fallback para recibir BNB
     */
    fallback() external payable {}
}
