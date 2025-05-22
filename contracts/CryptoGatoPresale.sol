// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./libraries/CGErrors.sol";
import "./CryptoGato.sol";


/**
 * @title Contrato de Preventa de CryptoGato
 * @dev Este contrato gestiona la preventa del token CryptoGato (CGATO),
 * permitiendo a los participantes comprar tokens a una tasa preferencial.
 * Incluye funcionalidades de fases de preventa, límites de compra, y vesting.
 * @author CryptoGato Team
 */
contract CryptoGatoPresale is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ================= CONSTANTES Y VARIABLES DE ESTADO =================

    /// @notice Token CryptoGato
    address public cryptoGatoAddress;

    /// @notice Categoría de asignación a usar para la preventa
    uint8 private constant PRESALE_CATEGORY = 1; // Corresponde a CryptoGato.CATEGORY_PRESALE

    /// @notice Dirección del wallet de tesorería donde se depositarán los BNB recaudados
    address public treasuryWallet;

    /// @notice Fases de la preventa
    enum Phase {
        SETUP,      // Configuración inicial
        WHITELIST,  // Solo direcciones en whitelist
        PUBLIC,     // Abierto a todos
        ENDED       // Preventa finalizada
    }

    /// @notice Fase actual de la preventa
    Phase public currentPhase = Phase.SETUP;

    /// @notice Precio en BNB por token en cada fase (en wei, multiplicado por 10^18)
    mapping(Phase => uint256) public phasePrice;

    /// @notice Whitelist de direcciones autorizadas para participar en la fase WHITELIST
    mapping(address => bool) public whitelist;

    /// @notice Máximo de tokens que se pueden vender en total
    uint256 public maxTokensToSell;

    /// @notice Tokens vendidos hasta el momento
    uint256 public totalTokensSold;

    /// @notice Tokens comprados por cada dirección
    mapping(address => uint256) public tokensPurchased;

    /// @notice Límite mínimo de compra por participante (en tokens)
    uint256 public minPurchaseAmount;

    /// @notice Límite máximo de compra por participante (en tokens)
    uint256 public maxPurchaseAmount;

    /// @notice Timestamp de inicio de la preventa
    uint256 public startTime;

    /// @notice Timestamp de fin de la preventa
    uint256 public endTime;

    /// @notice Configuración de vesting (liberación progresiva)
    struct VestingConfig {
        bool enabled;            // Si el vesting está habilitado
        uint256 initialRelease;  // Porcentaje de liberación inicial (base 10000)
        uint256 cliffPeriod;     // Período de espera antes de empezar a liberar tokens (en segundos)
        uint256 vestingPeriod;   // Período total de vesting (en segundos)
    }

    /// @notice Configuración de vesting actual
    VestingConfig public vestingConfig;

    /// @notice Configuraciones de vesting por usuario
    mapping(address => VestingConfig) public userVestingConfig;

    /// @notice Detalles de vesting para cada participante
    struct VestingDetails {
        uint256 totalAmount;      // Cantidad total comprada
        uint256 claimedAmount;    // Cantidad ya reclamada
        uint256 purchaseTime;     // Timestamp de la compra
    }

    /// @notice Vesting de cada participante
    mapping(address => VestingDetails) public vestingDetails;

    /// @notice Flag para indicar si el contrato está listo para ventas
    bool public isInitialized = false;

    /// @notice Timelock para funciones críticas (24 horas por defecto)
    uint256 public constant TIMELOCK_DURATION = 24 hours;

    /// @notice Mapeo de operaciones pendientes con timelock
    mapping(bytes32 => uint256) public timelockOperations;

    // ================= EVENTOS =================

    /// @notice Evento emitido cuando se compran tokens
    event TokensPurchased(address indexed buyer, uint256 bnbAmount, uint256 tokenAmount, Phase phase);

    /// @notice Evento emitido cuando se reclaman tokens (después del vesting)
    event TokensClaimed(address indexed claimer, uint256 amount);

    /// @notice Evento emitido cuando se actualiza la configuración de vesting
    event VestingConfigUpdated(bool enabled, uint256 initialRelease, uint256 cliffPeriod, uint256 vestingPeriod);

    /// @notice Evento emitido cuando se actualiza la configuración de vesting de un usuario
    event UserVestingConfigUpdated(address indexed user, bool enabled, uint256 initialRelease, uint256 cliffPeriod, uint256 vestingPeriod);

    /// @notice Evento emitido cuando se cambia la fase de la preventa
    event PhaseChanged(Phase newPhase);

    /// @notice Evento emitido cuando se añade una dirección a la whitelist
    event AddedToWhitelist(address indexed account);

    /// @notice Evento emitido cuando se elimina una dirección de la whitelist
    event RemovedFromWhitelist(address indexed account);

    /// @notice Evento emitido cuando se actualiza el precio de una fase
    event PriceUpdated(Phase phase, uint256 newPrice);

    /// @notice Evento emitido cuando se finaliza la preventa anticipadamente
    event PresaleEnded();

    /// @notice Evento emitido cuando se retiran los fondos recaudados
    event FundsWithdrawn(address indexed to, uint256 amount);

    /// @notice Evento emitido cuando se devuelven tokens no vendidos
    event UnsoldTokensReturned(uint256 amount);

    /// @notice Evento emitido cuando se inicializa el contrato
    event PresaleInitialized(
        address tokenAddress,
        uint256 maxTokens,
        uint256 startTime,
        uint256 endTime,
        uint256 whitelistPrice,
        uint256 publicPrice
    );

    /// @notice Evento emitido cuando se programa una operación con timelock
    event TimelockOperationScheduled(bytes32 indexed operationId, uint256 executeTime);

    /// @notice Evento emitido cuando se ejecuta una operación con timelock
    event TimelockOperationExecuted(bytes32 indexed operationId);

    /// @notice Evento emitido cuando se cancela una operación con timelock
    event TimelockOperationCancelled(bytes32 indexed operationId);

    // ================= MODIFIER =================

    /**
     * @dev Verifica que el contrato esté inicializado
     */
    modifier whenInitialized() {
        require(isInitialized, "CryptoGatoPresale: not initialized");
        _;
    }

    /**
     * @dev Verifica que la preventa esté activa
     */
    modifier whenPresaleActive() {
        require(currentPhase == Phase.WHITELIST || currentPhase == Phase.PUBLIC, "CryptoGatoPresale: not active");
        require(block.timestamp >= startTime, "CryptoGatoPresale: not started");
        require(block.timestamp <= endTime, "CryptoGatoPresale: ended");
        require(totalTokensSold < maxTokensToSell, "CryptoGatoPresale: sold out");
        _;
    }

    /**
     * @dev Verifica que el remitente está en whitelist (para fase WHITELIST)
     */
    modifier onlyWhitelisted() {
        if (currentPhase == Phase.WHITELIST) {
            require(whitelist[msg.sender], "CryptoGatoPresale: not whitelisted");
        }
        _;
    }

    // ================= CONSTRUCTOR =================

    /**
     * @dev Constructor que inicializa el contrato de preventa
     * @param _treasuryWallet Dirección donde se depositarán los BNB recaudados
     */
    constructor(address _treasuryWallet) Ownable(msg.sender) {
        require(_treasuryWallet != address(0), "CryptoGatoPresale: zero address");
        treasuryWallet = _treasuryWallet;

        // Valores por defecto para el vesting
        vestingConfig = VestingConfig({
            enabled: true,
            initialRelease: 2000,   // 20% liberación inicial
            cliffPeriod: 30 days,   // 30 días de cliff
            vestingPeriod: 180 days // 180 días de vesting total
        });
    }

    // ================= FUNCIONES DE INICIALIZACIÓN =================

    /**
     * @dev Inicializa el contrato con los parámetros de la preventa
     * @param _token Dirección del contrato CryptoGato
     * @param _maxTokens Cantidad máxima de tokens a vender
     * @param _startTime Timestamp de inicio
     * @param _endTime Timestamp de fin
     * @param _whitelistPrice Precio en fase whitelist (en wei por token)
     * @param _publicPrice Precio en fase pública (en wei por token)
     * @param _minPurchase Cantidad mínima de compra (en tokens)
     * @param _maxPurchase Cantidad máxima de compra (en tokens)
     */
    function initialize(
        address _token,
        uint256 _maxTokens,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _whitelistPrice,
        uint256 _publicPrice,
        uint256 _minPurchase,
        uint256 _maxPurchase
    ) external onlyOwner {
        require(!isInitialized, "CryptoGatoPresale: already initialized");
        require(_token != address(0), "CryptoGatoPresale: zero token address");
        require(_maxTokens > 0, "CryptoGatoPresale: invalid max tokens");
        require(_startTime > block.timestamp, "CryptoGatoPresale: invalid start time");
        require(_endTime > _startTime, "CryptoGatoPresale: invalid end time");
        require(_whitelistPrice > 0, "CryptoGatoPresale: invalid whitelist price");
        require(_publicPrice > 0, "CryptoGatoPresale: invalid public price");
        require(_minPurchase > 0, "CryptoGatoPresale: invalid min purchase");
        require(_maxPurchase >= _minPurchase, "CryptoGatoPresale: invalid max purchase");

        // Validar que los precios sean razonables (no demasiado bajos ni altos)
        require(_whitelistPrice >= 1e8, "CryptoGatoPresale: whitelist price too low");
        require(_publicPrice >= 1e8, "CryptoGatoPresale: public price too low");
        require(_whitelistPrice <= 1e18, "CryptoGatoPresale: whitelist price too high");
        require(_publicPrice <= 1e18, "CryptoGatoPresale: public price too high");

        cryptoGatoAddress = _token;
        maxTokensToSell = _maxTokens;
        startTime = _startTime;
        endTime = _endTime;

        phasePrice[Phase.WHITELIST] = _whitelistPrice;
        phasePrice[Phase.PUBLIC] = _publicPrice;

        minPurchaseAmount = _minPurchase;
        maxPurchaseAmount = _maxPurchase;

        // Verificar que este contrato es minter para CryptoGato
        CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
        require(token.isMinter(address(this)), "CryptoGatoPresale: not a minter");

        // Verificar que hay suficientes tokens disponibles en la categoría PRESALE
        uint256 availablePresaleTokens = token.getCategoryAvailable(PRESALE_CATEGORY);
        require(_maxTokens <= availablePresaleTokens, "CryptoGatoPresale: exceeds available presale tokens");

        isInitialized = true;

        emit PresaleInitialized(
            _token,
            _maxTokens,
            _startTime,
            _endTime,
            _whitelistPrice,
            _publicPrice
        );
    }

    // ================= FUNCIONES DE COMPRA Y RECLAMO =================

    /**
     * @dev Permite a un usuario comprar tokens con BNB
     */
    function buyTokens() external payable nonReentrant whenNotPaused whenInitialized whenPresaleActive onlyWhitelisted {
        if (msg.value == 0) revert CGErrors.InvalidAmount();

        // Calcular tokens a recibir según la fase actual
        uint256 tokenPrice = phasePrice[currentPhase];
        uint256 tokenAmount = msg.value * 10**18 / tokenPrice;

        if (tokenAmount < minPurchaseAmount) 
            revert CGErrors.InvalidPurchaseLimit(tokenAmount, minPurchaseAmount);

        // Verificar límite por usuario
        uint256 newTotalPurchased = tokensPurchased[msg.sender] + tokenAmount;
        if (newTotalPurchased > maxPurchaseAmount) 
            revert CGErrors.InvalidPurchaseLimit(newTotalPurchased, maxPurchaseAmount);

        // Verificar que no exceda el máximo total
        uint256 newTotalSold = totalTokensSold + tokenAmount;
        uint256 refundAmount = 0;

        if (newTotalSold > maxTokensToSell) {
            // Ajustar la cantidad para no exceder el máximo
            tokenAmount = maxTokensToSell - totalTokensSold;
            // Calcular el BNB a devolver
            refundAmount = msg.value - (tokenAmount * tokenPrice / 10**18);
        }

        // Actualizar contadores
        tokensPurchased[msg.sender] = newTotalPurchased;
        totalTokensSold = totalTokensSold + tokenAmount;

        // Obtener la configuración de vesting para este usuario
        VestingConfig memory userConfig;
        if (userVestingConfig[msg.sender].enabled || (!userVestingConfig[msg.sender].enabled && vestingConfig.enabled)) {
            userConfig = userVestingConfig[msg.sender].enabled ? userVestingConfig[msg.sender] : vestingConfig;
        } else {
            userConfig = VestingConfig(false, 10000, 0, 0); // Sin vesting
        }

        // Configurar o actualizar vesting para el usuario
        if (vestingDetails[msg.sender].totalAmount == 0) {
            // Primera compra
            vestingDetails[msg.sender] = VestingDetails({
                totalAmount: tokenAmount,
                claimedAmount: 0,
                purchaseTime: block.timestamp
            });
        } else {
            // Compra adicional
            vestingDetails[msg.sender].totalAmount += tokenAmount;
        }

        // Si el vesting está deshabilitado o es liberación inicial completa, transferir tokens inmediatamente
        if (!userConfig.enabled || userConfig.initialRelease == 10000) {
            // Acuñar tokens directamente al comprador
            CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
            token.mint(msg.sender, tokenAmount, PRESALE_CATEGORY);
            
            // Actualizar cantidad reclamada
            vestingDetails[msg.sender].claimedAmount += tokenAmount;
        } else {
            // Calcular liberación inicial si aplica
            if (userConfig.initialRelease > 0) {
                uint256 initialAmount = tokenAmount * userConfig.initialRelease / 10000;
                if (initialAmount > 0) {
                    CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
                    token.mint(msg.sender, initialAmount, PRESALE_CATEGORY);
                    vestingDetails[msg.sender].claimedAmount += initialAmount;
                }
            }
        }

        // Transferir BNB a tesorería
        uint256 bnbToTransfer = msg.value - refundAmount;
        if (bnbToTransfer > 0) {
            (bool success, ) = treasuryWallet.call{value: bnbToTransfer}("");
            if (!success) revert CGErrors.FailedToSendBNB(treasuryWallet, bnbToTransfer);
        }

        // Devolver exceso de BNB si es necesario
        if (refundAmount > 0) {
            (bool success, ) = msg.sender.call{value: refundAmount}("");
            if (!success) revert CGErrors.RefundFailed(msg.sender, refundAmount);
        }

        emit TokensPurchased(msg.sender, msg.value - refundAmount, tokenAmount, currentPhase);
    }

    /**
     * @dev Permite a un usuario reclamar tokens después del vesting
     */
    function claimTokens() external nonReentrant whenNotPaused {
        VestingDetails storage userVesting = vestingDetails[msg.sender];
        
        if (userVesting.totalAmount == 0) revert CGErrors.NoTokensToClaim();
        if (userVesting.claimedAmount >= userVesting.totalAmount) revert CGErrors.AllTokensClaimed();

        // Obtener configuración de vesting del usuario
        VestingConfig memory userConfig = userVestingConfig[msg.sender].enabled ? 
            userVestingConfig[msg.sender] : vestingConfig;

        if (!userConfig.enabled) revert CGErrors.NoTokensToClaimNow();

        // Verificar cliff period
        uint256 cliffEnd = userVesting.purchaseTime + userConfig.cliffPeriod;
        if (block.timestamp < cliffEnd) 
            revert CGErrors.CliffPeriodNotPassed(userVesting.purchaseTime, cliffEnd);

        // Calcular tokens disponibles para reclamar
        uint256 tokensToRelease = calculateVestedAmount(msg.sender);
        uint256 tokensToMint = tokensToRelease - userVesting.claimedAmount;

        if (tokensToMint == 0) revert CGErrors.NoTokensToClaimNow();

        // Actualizar cantidad reclamada
        userVesting.claimedAmount += tokensToMint;

        // Acuñar tokens
        CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
        token.mint(msg.sender, tokensToMint, PRESALE_CATEGORY);

        emit TokensClaimed(msg.sender, tokensToMint);
    }

    /**
     * @dev Calcula la cantidad de tokens que han sido vestidos para un usuario
     * @param user Dirección del usuario
     * @return Cantidad de tokens vestidos
     */
    function calculateVestedAmount(address user) public view returns (uint256) {
        VestingDetails memory userVesting = vestingDetails[user];
        if (userVesting.totalAmount == 0) return 0;

        VestingConfig memory userConfig = userVestingConfig[user].enabled ? 
            userVestingConfig[user] : vestingConfig;

        if (!userConfig.enabled) return userVesting.totalAmount;

        uint256 cliffEnd = userVesting.purchaseTime + userConfig.cliffPeriod;
        if (block.timestamp < cliffEnd) {
            // Solo liberación inicial antes del cliff
            return userVesting.totalAmount * userConfig.initialRelease / 10000;
        }

        uint256 vestingEnd = userVesting.purchaseTime + userConfig.cliffPeriod + userConfig.vestingPeriod;
        if (block.timestamp >= vestingEnd) {
            // Vesting completado
            return userVesting.totalAmount;
        }

        // Calcular vesting progresivo
        uint256 initialAmount = userVesting.totalAmount * userConfig.initialRelease / 10000;
        uint256 remainingAmount = userVesting.totalAmount - initialAmount;
        uint256 timePassedSinceCliff = block.timestamp - cliffEnd;
        uint256 vestedFromRemaining = remainingAmount * timePassedSinceCliff / userConfig.vestingPeriod;

        return initialAmount + vestedFromRemaining;
    }

    // ================= GESTIÓN DE WHITELIST =================

    /**
     * @dev Añade una dirección a la whitelist
     * @param account Dirección a añadir
     */
    function addToWhitelist(address account) external onlyOwner {
        require(account != address(0), "CryptoGatoPresale: zero address");
        require(!whitelist[account], "CryptoGatoPresale: already whitelisted");

        whitelist[account] = true;
        emit AddedToWhitelist(account);
    }

    /**
     * @dev Añade múltiples direcciones a la whitelist
     * @param accounts Array de direcciones a añadir
     */
    function addMultipleToWhitelist(address[] calldata accounts) external onlyOwner {
        if (accounts.length > 100) revert CGErrors.BatchTooLarge(accounts.length, 100);

        for (uint256 i = 0; i < accounts.length; i++) {
            if (accounts[i] != address(0) && !whitelist[accounts[i]]) {
                whitelist[accounts[i]] = true;
                emit AddedToWhitelist(accounts[i]);
            }
        }
    }

    /**
     * @dev Elimina una dirección de la whitelist
     * @param account Dirección a eliminar
     */
    function removeFromWhitelist(address account) external onlyOwner {
        require(whitelist[account], "CryptoGatoPresale: not whitelisted");

        whitelist[account] = false;
        emit RemovedFromWhitelist(account);
    }

    // ================= GESTIÓN DE FASES =================

    /**
     * @dev Cambia la fase de la preventa
     * @param newPhase Nueva fase
     */
    function setPhase(Phase newPhase) external onlyOwner {
        if (newPhase == Phase.SETUP && currentPhase != Phase.SETUP) 
            revert CGErrors.CannotGoBackToSetup();
        if (currentPhase == Phase.ENDED) 
            revert CGErrors.AlreadyEnded();

        currentPhase = newPhase;
        emit PhaseChanged(newPhase);
    }

    /**
     * @dev Finaliza la preventa anticipadamente
     */
    function endPresale() external onlyOwner {
        require(currentPhase != Phase.ENDED, "CryptoGatoPresale: already ended");
        require(currentPhase != Phase.SETUP, "CryptoGatoPresale: not started");

        currentPhase = Phase.ENDED;
        emit PresaleEnded();
    }

    // ================= GESTIÓN DE PRECIOS =================

    /**
     * @dev Actualiza el precio de una fase
     * @param phase Fase a actualizar
     * @param newPrice Nuevo precio (en wei por token)
     */
    function updatePhasePrice(Phase phase, uint256 newPrice) external onlyOwner {
        require(phase == Phase.WHITELIST || phase == Phase.PUBLIC, "CryptoGatoPresale: invalid phase");
        require(newPrice > 0, "CryptoGatoPresale: invalid price");
        require(newPrice >= 1e8, "CryptoGatoPresale: price too low");
        require(newPrice <= 1e18, "CryptoGatoPresale: price too high");

        phasePrice[phase] = newPrice;
        emit PriceUpdated(phase, newPrice);
    }

    // ================= GESTIÓN DE VESTING =================

    /**
     * @dev Actualiza la configuración de vesting global
     * @param enabled Si el vesting está habilitado
     * @param initialRelease Porcentaje de liberación inicial (base 10000)
     * @param cliffPeriod Período de cliff en segundos
     * @param vestingPeriod Período de vesting en segundos
     */
    function updateVestingConfig(
        bool enabled,
        uint256 initialRelease,
        uint256 cliffPeriod,
        uint256 vestingPeriod
    ) external onlyOwner {
        if (enabled) {
            require(initialRelease <= 10000, "CryptoGatoPresale: invalid initial release");
            require(vestingPeriod > 0, "CryptoGatoPresale: invalid vesting period");
        }

        vestingConfig = VestingConfig({
            enabled: enabled,
            initialRelease: initialRelease,
            cliffPeriod: cliffPeriod,
            vestingPeriod: vestingPeriod
        });

        emit VestingConfigUpdated(enabled, initialRelease, cliffPeriod, vestingPeriod);
    }

    /**
     * @dev Configura vesting personalizado para un usuario específico
     * @param user Usuario para configurar
     * @param enabled Si el vesting está habilitado
     * @param initialRelease Porcentaje de liberación inicial (base 10000)
     * @param cliffPeriod Período de cliff en segundos
     * @param vestingPeriod Período de vesting en segundos
     */
    function setUserVestingConfig(
        address user,
        bool enabled,
        uint256 initialRelease,
        uint256 cliffPeriod,
        uint256 vestingPeriod
    ) external onlyOwner {
        require(user != address(0), "CryptoGatoPresale: zero address");
        
        if (enabled) {
            require(initialRelease <= 10000, "CryptoGatoPresale: invalid initial release");
            require(vestingPeriod > 0, "CryptoGatoPresale: invalid vesting period");
        }

        userVestingConfig[user] = VestingConfig({
            enabled: enabled,
            initialRelease: initialRelease,
            cliffPeriod: cliffPeriod,
            vestingPeriod: vestingPeriod
        });

        emit UserVestingConfigUpdated(user, enabled, initialRelease, cliffPeriod, vestingPeriod);
    }

    // ================= FUNCIONES ADMINISTRATIVAS =================

    /**
     * @dev Retira fondos BNB del contrato
     * @param to Dirección destino
     * @param amount Cantidad a retirar (0 para todo)
     */
    function withdrawFunds(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "CryptoGatoPresale: zero address");

        uint256 balance = address(this).balance;
        require(balance > 0, "CryptoGatoPresale: no funds");

        uint256 toWithdraw = amount == 0 ? balance : amount;
        require(toWithdraw <= balance, "CryptoGatoPresale: insufficient balance");

        (bool success, ) = to.call{value: toWithdraw}("");
        require(success, "CryptoGatoPresale: withdrawal failed");

        emit FundsWithdrawn(to, toWithdraw);
    }

    /**
     * @dev Permite al propietario pausar el contrato
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Permite al propietario despausar el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ================= FUNCIONES DE VISTA =================

    /**
     * @dev Retorna información general de la preventa
     */
    function getPresaleInfo() external view returns (
        Phase _currentPhase,
        uint256 _totalTokensSold,
        uint256 _maxTokensToSell,
        uint256 _startTime,
        uint256 _endTime,
        uint256 _whitelistPrice,
        uint256 _publicPrice,
        bool _isInitialized
    ) {
        return (
            currentPhase,
            totalTokensSold,
            maxTokensToSell,
            startTime,
            endTime,
            phasePrice[Phase.WHITELIST],
            phasePrice[Phase.PUBLIC],
            isInitialized
        );
    }

    /**
     * @dev Retorna información de compra de un usuario
     * @param user Dirección del usuario
     */
    function getUserInfo(address user) external view returns (
        uint256 purchased,
        uint256 totalVested,
        uint256 claimed,
        uint256 claimable,
        bool isWhitelisted
    ) {
        VestingDetails memory userVesting = vestingDetails[user];
        return (
            tokensPurchased[user],
            userVesting.totalAmount,
            userVesting.claimedAmount,
            calculateVestedAmount(user) - userVesting.claimedAmount,
            whitelist[user]
        );
    }

    /**
     * @dev Verifica si la preventa está activa
     */
    function isPresaleActive() external view returns (bool) {
        return (currentPhase == Phase.WHITELIST || currentPhase == Phase.PUBLIC) &&
               block.timestamp >= startTime &&
               block.timestamp <= endTime &&
               totalTokensSold < maxTokensToSell;
    }

    /**
     * @dev Calcula el precio actual según la fase
     */
    function getCurrentPrice() external view returns (uint256) {
        return phasePrice[currentPhase];
    }

    /**
     * @dev Calcula cuántos tokens se pueden comprar con una cantidad de BNB
     * @param bnbAmount Cantidad de BNB
     */
    function calculateTokenAmount(uint256 bnbAmount) external view returns (uint256) {
        if (bnbAmount == 0) return 0;
        uint256 price = phasePrice[currentPhase];
        if (price == 0) return 0;
        return bnbAmount * 10**18 / price;
    }

    /**
     * @dev Calcula cuánto BNB se necesita para comprar una cantidad de tokens
     * @param tokenAmount Cantidad de tokens
     */
    function calculateBNBAmount(uint256 tokenAmount) external view returns (uint256) {
        if (tokenAmount == 0) return 0;
        uint256 price = phasePrice[currentPhase];
        return tokenAmount * price / 10**18;
    }

    // ================= FUNCIONES DE RESCATE =================

    /**
     * @dev Rescata tokens enviados por error al contrato
     * @param tokenAddress Dirección del token a rescatar
     */
    function rescueTokens(address tokenAddress) external onlyOwner {
        require(tokenAddress != address(0), "CryptoGatoPresale: zero address");
        require(tokenAddress != cryptoGatoAddress, "CryptoGatoPresale: cannot rescue main token");

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        
        if (balance > 0) {
            token.safeTransfer(owner(), balance);
        }
    }

    // ================= FUNCIÓN PARA RECIBIR BNB =================

    /**
     * @dev Permite al contrato recibir BNB
     */
    receive() external payable {}
}
