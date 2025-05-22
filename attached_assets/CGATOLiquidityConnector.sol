// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "./interfaces/IPancakeRouter.sol";
import "./CryptoGato.sol";
import "./libraries/CGErrors.sol";

/**
 * @title CGATOLiquidityConnector
 * @dev Contrato para gestionar la liquidez de CryptoGato en múltiples DEXs
 * Permite encontrar las mejores rutas de intercambio y distribuir liquidez
 * entre varios proveedores para maximizar la eficiencia y minimizar el impacto
 * de problemas en un solo DEX.
 */
contract CGATOLiquidityConnector is Ownable(msg.sender), ReentrancyGuard {
    // Contrato principal de CryptoGato
    CryptoGato public immutable token;
    
    // WBNB address para los pares de liquidez
    address public immutable WBNB;
    
    // Estructuras de datos para DEXs
    struct DEX {
        string name;
        address router;
        address factory;
        bool active;
        uint256 liquidityShare; // Porcentaje de la liquidez total (base 10000)
    }
    
    // Mapping de DEXs registrados
    mapping(address => DEX) public registeredDEXs;
    address[] public dexList;
    
    // Evento para tracking
    event LiquidityDistributed(
        address indexed dex,
        uint256 tokenAmount,
        uint256 bnbAmount,
        uint256 timestamp
    );
    
    event DEXAdded(
        address indexed router,
        string name,
        uint256 liquidityShare
    );
    
    event DEXRemoved(
        address indexed router
    );
    
    event DEXLiquidityShareUpdated(
        address indexed router,
        uint256 newShare
    );
    
    event LiquidityAdded(
        address indexed dex,
        uint256 tokenAmount,
        uint256 bnbAmount,
        uint256 liquidity
    );
    
    /**
     * @dev Constructor
     * @param _token Dirección del contrato CryptoGato
     * @param _wbnb Dirección del contrato WBNB
     */
    constructor(address _token, address _wbnb) {
        if (_token == address(0) || _wbnb == address(0)) 
            revert CGErrors.ZeroAddress();
        
        token = CryptoGato(payable(_token));
        WBNB = _wbnb;
    }
    
    /**
     * @dev Añade un nuevo DEX al conector
     * @param _router Dirección del router del DEX
     * @param _factory Dirección de la factory del DEX
     * @param _name Nombre del DEX
     * @param _liquidityShare Porcentaje de liquidez asignado (base 10000)
     */
    function addDEX(
        address _router,
        address _factory,
        string memory _name,
        uint256 _liquidityShare
    ) external onlyOwner {
        if (_router == address(0) || _factory == address(0))
            revert CGErrors.ZeroAddress();
        
        if (registeredDEXs[_router].active)
            revert CGErrors.DEXAlreadyRegistered(_router);
        
        // Actualizar el porcentaje de liquidez total
        uint256 totalShare = _liquidityShare;
        for (uint256 i = 0; i < dexList.length; i++) {
            totalShare += registeredDEXs[dexList[i]].liquidityShare;
        }
        
        if (totalShare > 10000)
            revert CGErrors.InvalidLiquidityShare(totalShare);
        
        // Registrar el nuevo DEX
        registeredDEXs[_router] = DEX({
            name: _name,
            router: _router,
            factory: _factory,
            active: true,
            liquidityShare: _liquidityShare
        });
        
        dexList.push(_router);
        
        emit DEXAdded(_router, _name, _liquidityShare);
    }
    
    /**
     * @dev Elimina un DEX del conector
     * @param _router Dirección del router del DEX a eliminar
     */
    function removeDEX(address _router) external onlyOwner {
        if (!registeredDEXs[_router].active)
            revert CGErrors.DEXNotRegistered(_router);
        
        registeredDEXs[_router].active = false;
        
        // Eliminar de la lista
        for (uint256 i = 0; i < dexList.length; i++) {
            if (dexList[i] == _router) {
                dexList[i] = dexList[dexList.length - 1];
                dexList.pop();
                break;
            }
        }
        
        emit DEXRemoved(_router);
    }
    
    /**
     * @dev Actualiza el porcentaje de liquidez de un DEX
     * @param _router Dirección del router del DEX
     * @param _newShare Nuevo porcentaje de liquidez
     */
    function updateDEXLiquidityShare(
        address _router,
        uint256 _newShare
    ) external onlyOwner {
        if (!registeredDEXs[_router].active)
            revert CGErrors.DEXNotRegistered(_router);
        
        // Calcular el nuevo total
        uint256 totalShare = _newShare;
        for (uint256 i = 0; i < dexList.length; i++) {
            if (dexList[i] != _router) {
                totalShare += registeredDEXs[dexList[i]].liquidityShare;
            }
        }
        
        if (totalShare > 10000)
            revert CGErrors.InvalidLiquidityShare(totalShare);
        
        registeredDEXs[_router].liquidityShare = _newShare;
        
        emit DEXLiquidityShareUpdated(_router, _newShare);
    }
    
    /**
     * @dev Distribuye liquidez inicial entre los DEXs registrados
     * @param tokenAmount Cantidad de tokens CGATO a distribuir
     */
    function distributeInitialLiquidity(
        uint256 tokenAmount
    ) external payable onlyOwner nonReentrant {
        if (tokenAmount == 0 || msg.value == 0)
            revert CGErrors.InvalidAmount();
        
        if (dexList.length == 0)
            revert CGErrors.NoDEXRegistered();
        
        // Transferir tokens al contrato
        token.transferFrom(msg.sender, address(this), tokenAmount);
        
        // Distribuir liquidez según los porcentajes
        uint256 totalDistributed = 0;
        uint256 bnbDistributed = 0;
        
        for (uint256 i = 0; i < dexList.length; i++) {
            address routerAddress = dexList[i];
            DEX memory dex = registeredDEXs[routerAddress];
            
            if (dex.active) {
                uint256 dexTokenAmount = tokenAmount * dex.liquidityShare / 10000;
                uint256 dexBnbAmount = msg.value * dex.liquidityShare / 10000;
                
                if (dexTokenAmount > 0 && dexBnbAmount > 0) {
                    // Aprobar tokens para el router
                    token.approve(routerAddress, dexTokenAmount);
                    
                    // Añadir liquidez
                    IPancakeRouter02 router = IPancakeRouter02(routerAddress);
                    // Capturamos los valores retornados y los usamos para emitir evento
                    (uint256 amountTokenAdded, uint256 amountBNBAdded, uint256 liquidity) = router.addLiquidityETH{value: dexBnbAmount}(
                        address(token),
                        dexTokenAmount,
                        0,  // slippage permitido = 100%
                        0,  // slippage permitido = 100%
                        owner(),  // LP tokens al owner
                        block.timestamp + 600  // 10 minutos deadline
                    );
                    
                    totalDistributed += dexTokenAmount;
                    bnbDistributed += dexBnbAmount;
                    
                    // Emitir evento de liquidez añadida
                    emit LiquidityAdded(routerAddress, amountTokenAdded, amountBNBAdded, liquidity);
                    emit LiquidityDistributed(
                        routerAddress,
                        dexTokenAmount,
                        dexBnbAmount,
                        block.timestamp
                    );
                    
                    // Podríamos usar estos valores para estadísticas o verificaciones
                    // aunque no son estrictamente necesarios para esta implementación
                    if (liquidity > 0 && amountTokenAdded > 0 && amountBNBAdded > 0) {
                        // Los valores se usaron en esta condición para evitar warnings
                    }
                }
            }
        }
        
        // Devolver tokens y BNB no utilizados
        uint256 remainingTokens = tokenAmount - totalDistributed;
        uint256 remainingBnb = msg.value - bnbDistributed;
        
        if (remainingTokens > 0) {
            token.transfer(owner(), remainingTokens);
        }
        
        if (remainingBnb > 0) {
            (bool success, ) = owner().call{value: remainingBnb}("");
            if (!success) revert CGErrors.FailedToSendBNB(owner(), remainingBnb);
        }
    }
    
    /**
     * @dev Obtiene la mejor ruta para comprar tokens
     * @return router Dirección del router con mejor precio
     * @return outputAmount Cantidad estimada de tokens a recibir
     */
    function getBestBuyRoute(
        uint256 bnbAmount
    ) public view returns (address router, uint256 outputAmount) {
        if (bnbAmount == 0)
            revert CGErrors.InvalidAmount();
        
        uint256 bestOutput = 0;
        address bestRouter = address(0);
        
        for (uint256 i = 0; i < dexList.length; i++) {
            address routerAddress = dexList[i];
            DEX memory dex = registeredDEXs[routerAddress];
            
            if (dex.active) {
                IPancakeRouter02 dexRouter = IPancakeRouter02(routerAddress);
                address[] memory path = new address[](2);
                path[0] = WBNB;
                path[1] = address(token);
                
                try dexRouter.getAmountsOut(bnbAmount, path) returns (uint256[] memory amounts) {
                    if (amounts[1] > bestOutput) {
                        bestOutput = amounts[1];
                        bestRouter = routerAddress;
                    }
                } catch {
                    // Ignorar si hay errores en la consulta
                }
            }
        }
        
        if (bestRouter == address(0))
            revert CGErrors.NoValidRouteFound();
            
        return (bestRouter, bestOutput);
    }
    
    /**
     * @dev Obtiene la mejor ruta para vender tokens
     * @return router Dirección del router con mejor precio
     * @return outputAmount Cantidad estimada de BNB a recibir
     */
    function getBestSellRoute(
        uint256 tokenAmount
    ) public view returns (address router, uint256 outputAmount) {
        if (tokenAmount == 0)
            revert CGErrors.InvalidAmount();
        
        uint256 bestOutput = 0;
        address bestRouter = address(0);
        
        for (uint256 i = 0; i < dexList.length; i++) {
            address routerAddress = dexList[i];
            DEX memory dex = registeredDEXs[routerAddress];
            
            if (dex.active) {
                IPancakeRouter02 dexRouter = IPancakeRouter02(routerAddress);
                address[] memory path = new address[](2);
                path[0] = address(token);
                path[1] = WBNB;
                
                try dexRouter.getAmountsOut(tokenAmount, path) returns (uint256[] memory amounts) {
                    if (amounts[1] > bestOutput) {
                        bestOutput = amounts[1];
                        bestRouter = routerAddress;
                    }
                } catch {
                    // Ignorar si hay errores en la consulta
                }
            }
        }
        
        if (bestRouter == address(0))
            revert CGErrors.NoValidRouteFound();
            
        return (bestRouter, bestOutput);
    }
    
    /**
     * @dev Permite al propietario rescatar tokens enviados por error
     * @param tokenAddress Dirección del token a rescatar
     */
    function rescueTokens(address tokenAddress) external onlyOwner {
        if (tokenAddress == address(0))
            revert CGErrors.ZeroAddress();
            
        IERC20 tokenToRescue = IERC20(tokenAddress);
        uint256 balance = tokenToRescue.balanceOf(address(this));
        
        if (balance > 0) {
            tokenToRescue.transfer(owner(), balance);
        }
    }
    
    /**
     * @dev Permite al propietario rescatar BNB enviados por error
     */
    function rescueBNB() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance > 0) {
            (bool success, ) = owner().call{value: balance}("");
            if (!success) revert CGErrors.FailedToSendBNB(owner(), balance);
        }
    }
    
    /**
     * @dev Obtiene el número total de DEXs registrados
     * @return Número de DEXs registrados
     */
    function getDEXCount() external view returns (uint256) {
        return dexList.length;
    }
    
    /**
     * @dev Actualiza el porcentaje de liquidez de un DEX específico
     * @param router Dirección del router del DEX
     * @param newShare Nuevo porcentaje de liquidez (base 10000)
     */
    function updateDEXShare(address router, uint256 newShare) external onlyOwner nonReentrant {
        if (router == address(0)) revert CGErrors.ZeroAddress();
        if (newShare > 10000) revert CGErrors.InvalidLiquidityShare(newShare);
        if (!registeredDEXs[router].active) revert CGErrors.DEXNotRegistered(router);
        
        // Actualizar el porcentaje de liquidez
        registeredDEXs[router].liquidityShare = newShare;
        
        // Recalcular los porcentajes totales
        uint256 totalShares = 0;
        for (uint256 i = 0; i < dexList.length; i++) {
            address dexRouter = dexList[i];
            if (registeredDEXs[dexRouter].active) {
                totalShares += registeredDEXs[dexRouter].liquidityShare;
            }
        }
        
        // Verificar que la suma de porcentajes sea 10000 (100%)
        require(totalShares == 10000, "La suma de porcentajes debe ser 100%");
        
        emit DEXLiquidityShareUpdated(router, newShare);
    }
    
    /**
     * @dev Obtiene la distribución actual de liquidez entre los DEXs
     * @return dexAddresses Array con las direcciones de los routers
     * @return dexNames Array con los nombres de los DEXs
     * @return dexShares Array con los porcentajes de liquidez
     */
    function getLiquidityDistribution() external view returns (
        address[] memory dexAddresses,
        string[] memory dexNames,
        uint256[] memory dexShares
    ) {
        uint256 activeDexCount = 0;
        
        // Contar DEXs activos
        for (uint256 i = 0; i < dexList.length; i++) {
            if (registeredDEXs[dexList[i]].active) {
                activeDexCount++;
            }
        }
        
        // Inicializar arrays
        dexAddresses = new address[](activeDexCount);
        dexNames = new string[](activeDexCount);
        dexShares = new uint256[](activeDexCount);
        
        // Llenar arrays
        uint256 index = 0;
        for (uint256 i = 0; i < dexList.length; i++) {
            address dexRouter = dexList[i];
            if (registeredDEXs[dexRouter].active) {
                dexAddresses[index] = dexRouter;
                dexNames[index] = registeredDEXs[dexRouter].name;
                dexShares[index] = registeredDEXs[dexRouter].liquidityShare;
                index++;
            }
        }
        
        return (dexAddresses, dexNames, dexShares);
    }
    
    /**
     * @dev Función para recibir ETH
     */
    receive() external payable {}
}