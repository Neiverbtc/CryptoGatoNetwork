// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
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
        if (userVestingConfig[msg.sender].enabled) {
            // Si el usuario tiene configuración personalizada, usarla
            userConfig = userVestingConfig[msg.sender];
        } else {
            // Si no, usar la configuración global
            userConfig = vestingConfig;
        }

        // Actualizar datos de vesting
        if (userConfig.enabled) {
            VestingDetails storage details = vestingDetails[msg.sender];

            // Si es la primera compra, inicializar
            if (details.purchaseTime == 0) {
                details.purchaseTime = block.timestamp;
            }
            // Si no es la primera compra, calcular el promedio ponderado del tiempo
            else {
                details.purchaseTime = (
                    details.totalAmount * details.purchaseTime + 
                    tokenAmount * block.timestamp
                ) / (details.totalAmount + tokenAmount);
            }

            details.totalAmount = details.totalAmount + tokenAmount;

            // Liberar el porcentaje inicial inmediatamente
            if (userConfig.initialRelease > 0) {
                uint256 initialAmount = tokenAmount * userConfig.initialRelease / 10000;
                if (initialAmount > 0) {
                    details.claimedAmount = details.claimedAmount + initialAmount;
                    CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
                    token.mint(msg.sender, initialAmount, PRESALE_CATEGORY);
                }
            }
        } else {
            // Si no hay vesting, entregar todos los tokens inmediatamente
            CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
            token.mint(msg.sender, tokenAmount, PRESALE_CATEGORY);
        }

        // Devolver exceso de BNB si es necesario
        if (refundAmount > 0) {
            (bool refundSuccess, ) = msg.sender.call{value: refundAmount}("");
            if (!refundSuccess) revert CGErrors.RefundFailed(msg.sender, refundAmount);
        }

        // Enviar BNB a la tesorería (patrón checks-effects-interactions)
        uint256 bnbToSend = address(this).balance;
        if (bnbToSend > 0) {
            (bool sent, ) = treasuryWallet.call{value: bnbToSend}("");
            if (!sent) revert CGErrors.FailedToSendBNB(treasuryWallet, bnbToSend);
        }

        emit TokensPurchased(msg.sender, msg.value - refundAmount, tokenAmount, currentPhase);
    }

    /**
     * @dev Permite a un usuario reclamar sus tokens después del vesting
     */
    function claimVestedTokens() external nonReentrant whenNotPaused whenInitialized {
        // Obtener la configuración de vesting para este usuario
        VestingConfig memory userConfig;
        if (userVestingConfig[msg.sender].enabled) {
            userConfig = userVestingConfig[msg.sender];
        } else {
            userConfig = vestingConfig;
        }

        if (!userConfig.enabled) revert CGErrors.InvalidVestingConfig(0, 0);

        VestingDetails storage details = vestingDetails[msg.sender];
        if (details.totalAmount == 0) revert CGErrors.NoTokensToClaim();
        if (details.claimedAmount >= details.totalAmount) revert CGErrors.AllTokensClaimed();

        // Verificar si ha pasado el período de cliff
        uint256 cliffEnd = details.purchaseTime + userConfig.cliffPeriod;
        if (block.timestamp <= cliffEnd)
            revert CGErrors.CliffPeriodNotPassed(details.purchaseTime, cliffEnd);

        // Calcular tokens disponibles según el vesting lineal
        uint256 totalVestingDuration = userConfig.vestingPeriod;
        uint256 timeSincePurchase = block.timestamp - details.purchaseTime;

        uint256 vestedAmount;

        // Si ya pasó todo el período de vesting, entregar el 100%
        if (timeSincePurchase >= totalVestingDuration) {
            vestedAmount = details.totalAmount;
        } else {
            // Calcular cantidad según el tiempo transcurrido (vesting lineal)
            vestedAmount = details.totalAmount * timeSincePurchase / totalVestingDuration;

            // Asegurarse de incluir la liberación inicial en el cálculo
            if (userConfig.initialRelease > 0) {
                uint256 initialAmount = details.totalAmount * userConfig.initialRelease / 10000;
                uint256 remainingAmount = details.totalAmount - initialAmount;

                vestedAmount = initialAmount + 
                    (remainingAmount * timeSincePurchase / totalVestingDuration);
            }
        }

        // Calcular cuántos tokens se pueden reclamar ahora
        uint256 claimableAmount = vestedAmount - details.claimedAmount;
        require(claimableAmount > 0, "CryptoGatoPresale: no tokens to claim now");

        // Actualizar registros
        details.claimedAmount = details.claimedAmount + claimableAmount;

        // Enviar tokens
        CryptoGato token = CryptoGato(payable(cryptoGatoAddress));
        token.mint(msg.sender, claimableAmount, PRESALE_CATEGORY);

        emit TokensClaimed(msg.sender, claimableAmount);
    }

    // ================= FUNCIONES DE WHITELIST =================

        /**
     * @dev Añade direcciones a la whitelist
     * @param accounts Array de direcciones a añadir
     */
    function addToWhitelist(address[] calldata accounts) external onlyOwner {
        require(accounts.length <= 500, "CryptoGatoPresale: batch too large");

        for (uint256 i = 0; i < accounts.length; i++) {
            require(accounts[i] != address(0), "CryptoGatoPresale: zero address");
            whitelist[accounts[i]] = true;
            emit AddedToWhitelist(accounts[i]);
        }
    }

    /**
     * @dev Elimina direcciones de la whitelist
     * @param accounts Array de direcciones a eliminar
     */
    function removeFromWhitelist(address[] calldata accounts) external onlyOwner {
        require(accounts.length <= 500, "CryptoGatoPresale: batch too large");

        for (uint256 i = 0; i < accounts.length; i++) {
            whitelist[accounts[i]] = false;
            emit RemovedFromWhitelist(accounts[i]);
        }
    }

    // ================= FUNCIONES DE CONFIGURACIÓN Y CONTROL =================

    /**
     * @dev Programa el cambio de fase con timelock
     * @param _phase Nueva fase
     */
    function scheduleSetCurrentPhase(Phase _phase) external onlyOwner whenInitialized {
        require(_phase != Phase.SETUP, "CryptoGatoPresale: cannot go back to setup");

        bytes32 operationId = keccak256(abi.encode("setCurrentPhase", _phase));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta el cambio de fase después del timelock
     * @param _phase Nueva fase
     */
    function executeSetCurrentPhase(Phase _phase) external onlyOwner whenInitialized {
        bytes32 operationId = keccak256(abi.encode("setCurrentPhase", _phase));
        require(timelockOperations[operationId] > 0, "CryptoGatoPresale: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGatoPresale: timelock not expired");

        delete timelockOperations[operationId];

        currentPhase = _phase;
        emit PhaseChanged(_phase);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Programa la actualización del precio de una fase con timelock
     * @param _phase Fase a actualizar
     * @param _price Nuevo precio en wei por token
     */
    function scheduleUpdatePhasePrice(Phase _phase, uint256 _price) external onlyOwner whenInitialized {
        require(_phase != Phase.SETUP && _phase != Phase.ENDED, "CryptoGatoPresale: invalid phase");
        require(_price > 0, "CryptoGatoPresale: invalid price");
        require(_price >= 1e8, "CryptoGatoPresale: price too low");
        require(_price <= 1e18, "CryptoGatoPresale: price too high");

        bytes32 operationId = keccak256(abi.encode("updatePhasePrice", _phase, _price));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización del precio de una fase después del timelock
     * @param _phase Fase a actualizar
     * @param _price Nuevo precio en wei por token
     */
    function executeUpdatePhasePrice(Phase _phase, uint256 _price) external onlyOwner whenInitialized {
        bytes32 operationId = keccak256(abi.encode("updatePhasePrice", _phase, _price));
        require(timelockOperations[operationId] > 0, "CryptoGatoPresale: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGatoPresale: timelock not expired");

        delete timelockOperations[operationId];

        phasePrice[_phase] = _price;
        emit PriceUpdated(_phase, _price);
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Actualiza las fechas de inicio y fin de la preventa
     * @param _startTime Nueva fecha de inicio
     * @param _endTime Nueva fecha de fin
     */
    function updatePresaleDates(uint256 _startTime, uint256 _endTime) external onlyOwner whenInitialized {
        require(_startTime > block.timestamp, "CryptoGatoPresale: invalid start time");
        require(_endTime > _startTime, "CryptoGatoPresale: invalid end time");

        startTime = _startTime;
        endTime = _endTime;
    }

    /**
     * @dev Actualiza los límites de compra
     * @param _minPurchase Nuevo límite mínimo
     * @param _maxPurchase Nuevo límite máximo
     */
    function updatePurchaseLimits(uint256 _minPurchase, uint256 _maxPurchase) external onlyOwner whenInitialized {
        require(_minPurchase > 0, "CryptoGatoPresale: invalid min purchase");
        require(_maxPurchase >= _minPurchase, "CryptoGatoPresale: invalid max purchase");

        minPurchaseAmount = _minPurchase;
        maxPurchaseAmount = _maxPurchase;
    }

    /**
     * @dev Programa la actualización de la dirección de tesorería con timelock
     * @param _treasuryWallet Nueva dirección de tesorería
     */
    function scheduleUpdateTreasuryWallet(address _treasuryWallet) external onlyOwner {
        require(_treasuryWallet != address(0), "CryptoGatoPresale: zero address");

        bytes32 operationId = keccak256(abi.encode("updateTreasuryWallet", _treasuryWallet));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la actualización de la dirección de tesorería después del timelock
     * @param _treasuryWallet Nueva dirección de tesorería
     */
    function executeUpdateTreasuryWallet(address _treasuryWallet) external onlyOwner {
        bytes32 operationId = keccak256(abi.encode("updateTreasuryWallet", _treasuryWallet));
        require(timelockOperations[operationId] > 0, "CryptoGatoPresale: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGatoPresale: timelock not expired");

        delete timelockOperations[operationId];

        treasuryWallet = _treasuryWallet;
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Actualiza la configuración de vesting global
     * @param _enabled Si el vesting está habilitado
     * @param _initialRelease Porcentaje liberado al inicio (base 10000)
     * @param _cliffPeriod Período de cliff en segundos
     * @param _vestingPeriod Período total de vesting en segundos
     */
    function updateVestingConfig(
        bool _enabled,
        uint256 _initialRelease,
        uint256 _cliffPeriod,
        uint256 _vestingPeriod
    ) external onlyOwner whenInitialized {
        require(_initialRelease <= 10000, "CryptoGatoPresale: invalid initial release");
        require(_vestingPeriod > 0, "CryptoGatoPresale: invalid vesting period");

        // Esta actualización solo afecta a nuevas compras, no a las existentes
        vestingConfig.enabled = _enabled;
        vestingConfig.initialRelease = _initialRelease;
        vestingConfig.cliffPeriod = _cliffPeriod;
        vestingConfig.vestingPeriod = _vestingPeriod;

        emit VestingConfigUpdated(_enabled, _initialRelease, _cliffPeriod, _vestingPeriod);
    }

    /**
     * @dev Actualiza la configuración de vesting para un usuario específico
     * @param user Dirección del usuario
     * @param _enabled Si el vesting está habilitado
     * @param _initialRelease Porcentaje liberado al inicio (base 10000)
     * @param _cliffPeriod Período de cliff en segundos
     * @param _vestingPeriod Período total de vesting en segundos
     */
    function updateUserVestingConfig(
        address user,
        bool _enabled,
        uint256 _initialRelease,
        uint256 _cliffPeriod,
        uint256 _vestingPeriod
    ) external onlyOwner whenInitialized {
        require(user != address(0), "CryptoGatoPresale: zero address");
        require(_initialRelease <= 10000, "CryptoGatoPresale: invalid initial release");
        require(_vestingPeriod > 0, "CryptoGatoPresale: invalid vesting period");

        // Configurar vesting personalizado para este usuario
        userVestingConfig[user] = VestingConfig({
            enabled: _enabled,
            initialRelease: _initialRelease,
            cliffPeriod: _cliffPeriod,
            vestingPeriod: _vestingPeriod
        });

        emit UserVestingConfigUpdated(user, _enabled, _initialRelease, _cliffPeriod, _vestingPeriod);
    }

    /**
     * @dev Programa la finalización anticipada de la preventa con timelock
     */
    function scheduleEndPresale() external onlyOwner whenInitialized {
        require(currentPhase != Phase.ENDED, "CryptoGatoPresale: already ended");

        bytes32 operationId = keccak256(abi.encode("endPresale"));
        timelockOperations[operationId] = block.timestamp + TIMELOCK_DURATION;

        emit TimelockOperationScheduled(operationId, timelockOperations[operationId]);
    }

    /**
     * @dev Ejecuta la finalización anticipada de la preventa después del timelock
     */
    function executeEndPresale() external onlyOwner whenInitialized {
        bytes32 operationId = keccak256(abi.encode("endPresale"));
        require(timelockOperations[operationId] > 0, "CryptoGatoPresale: operation not scheduled");
        require(block.timestamp >= timelockOperations[operationId], "CryptoGatoPresale: timelock not expired");

        delete timelockOperations[operationId];

        currentPhase = Phase.ENDED;
        endTime = block.timestamp;

        emit PresaleEnded();
        emit TimelockOperationExecuted(operationId);
    }

    /**
     * @dev Retorna los tokens no vendidos al owner
     */
    function returnUnsoldTokens() external onlyOwner whenInitialized {
        require(currentPhase == Phase.ENDED || block.timestamp > endTime, "CryptoGatoPresale: not ended");

        uint256 unsoldAmount = maxTokensToSell - totalTokensSold;
        if (unsoldAmount > 0) {
            totalTokensSold = maxTokensToSell; // Marcar como vendidos para evitar reclamar más de una vez
            emit UnsoldTokensReturned(unsoldAmount);
        }
    }

    // ================= FUNCIONES DE TIMELOCK =================

    /**
     * @dev Cancela una operación programada con timelock
     * @param operationId ID de la operación a cancelar
     */
    function cancelTimelockOperation(bytes32 operationId) external onlyOwner {
        require(timelockOperations[operationId] > 0, "CryptoGatoPresale: operation not scheduled");

        delete timelockOperations[operationId];
        emit TimelockOperationCancelled(operationId);
    }

    // ================= FUNCIONES DE PAUSA =================

    /**
     * @dev Pausa el contrato
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Despausa el contrato
     */
    function unpause() external onlyOwner {
        _unpause();
    }

    // ================= FUNCIONES DE EMERGENCIA =================

    /**
     * @dev Rescata tokens ERC20 enviados por error al contrato
     * @param tokenAddress Dirección del token a rescatar
     * @param to Dirección a la que enviar los tokens
     * @param amount Cantidad de tokens a rescatar
     */
    function rescueTokens(address tokenAddress, address to, uint256 amount) external onlyOwner {
        require(to != address(0), "CryptoGatoPresale: cannot rescue to zero address");

        IERC20 token = IERC20(tokenAddress);
        uint256 balance = token.balanceOf(address(this));
        require(amount <= balance, "CryptoGatoPresale: insufficient balance");

        token.safeTransfer(to, amount);
    }

    /**
     * @dev Rescata BNB enviado por error al contrato
     * @param to Dirección a la que enviar el BNB
     * @param amount Cantidad de BNB a rescatar
     */
    function rescueBNB(address payable to, uint256 amount) external onlyOwner {
        require(to != address(0), "CryptoGatoPresale: cannot rescue to zero address");
        require(amount <= address(this).balance, "CryptoGatoPresale: insufficient balance");

        (bool success, ) = to.call{value: amount}("");
        require(success, "CryptoGatoPresale: BNB transfer failed");
    }

    // ================= FUNCIONES VIEW =================

    /**
     * @dev Calcula la cantidad de tokens pendientes de reclamar para un usuario
     * @param user Dirección del usuario
     * @return Cantidad de tokens reclamables
     */
    function getClaimableTokens(address user) external view returns (uint256) {
        // Obtener la configuración de vesting para este usuario
        VestingConfig memory userConfig;
        if (userVestingConfig[user].enabled) {
            userConfig = userVestingConfig[user];
        } else {
            userConfig = vestingConfig;
        }

        if (!userConfig.enabled) {
            return 0;
        }

        VestingDetails storage details = vestingDetails[user];
        if (details.totalAmount == 0 || details.claimedAmount >= details.totalAmount) {
            return 0;
        }

        // Verificar si ha pasado el período de cliff
        if (block.timestamp <= details.purchaseTime + userConfig.cliffPeriod) {
            return 0;
        }

        // Calcular tokens disponibles según el vesting lineal
        uint256 totalVestingDuration = userConfig.vestingPeriod;
        uint256 timeSincePurchase = block.timestamp - details.purchaseTime;

        uint256 vestedAmount;

        // Si ya pasó todo el período de vesting, disponible el 100%
        if (timeSincePurchase >= totalVestingDuration) {
            vestedAmount = details.totalAmount;
        } else {
            // Calcular cantidad según el tiempo transcurrido (vesting lineal)
            vestedAmount = details.totalAmount * timeSincePurchase / totalVestingDuration;

            // Asegurarse de incluir la liberación inicial en el cálculo
            if (userConfig.initialRelease > 0) {
                uint256 initialAmount = details.totalAmount * userConfig.initialRelease / 10000;
                uint256 remainingAmount = details.totalAmount - initialAmount;

                vestedAmount = initialAmount + 
                    (remainingAmount * timeSincePurchase / totalVestingDuration);
            }
        }

        // Restar lo que ya se ha reclamado
        uint256 claimableAmount = vestedAmount > details.claimedAmount ? 
                                 vestedAmount - details.claimedAmount : 0;

        return claimableAmount;
    }

    /**
     * @dev Verifica si la preventa está activa
     * @return true si la preventa está activa, false en caso contrario
     */
    function isPresaleActive() external view returns (bool) {
        return (
            (currentPhase == Phase.WHITELIST || currentPhase == Phase.PUBLIC) &&
            block.timestamp >= startTime &&
            block.timestamp <= endTime &&
            totalTokensSold < maxTokensToSell
        );
    }

    /**
     * @dev Permite recibir BNB
     */
    receive() external payable {}
}