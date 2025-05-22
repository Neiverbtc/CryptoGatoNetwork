// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title CryptoGatoUtils
 * @dev Biblioteca de utilidades para el token CryptoGato
 */
library CryptoGatoUtils {
    /**
     * @dev Verifica si una dirección es válida (no cero)
     * @param account Dirección a verificar
     * @return true si la dirección es válida
     */
    function isValidAddress(address account) internal pure returns (bool) {
        return account != address(0);
    }

    /**
     * @dev Calcula una cantidad con un porcentaje (base 10000)
     * @param amount Cantidad base
     * @param bps Porcentaje en base 10000 (basis points)
     * @return Cantidad calculada
     */
    function calculateBps(uint256 amount, uint256 bps) internal pure returns (uint256) {
        return amount * bps / 10000;
    }

    /**
     * @dev Calcula el límite de una categoría basado en porcentaje
     * @param maxSupply Suministro máximo
     * @param percentage Porcentaje de la categoría (base 1000)
     * @return Límite de la categoría
     */
    function calculateCategoryLimit(uint256 maxSupply, uint256 percentage) internal pure returns (uint256) {
        return maxSupply * percentage / 1000;
    }

    /**
     * @dev Calcula cuánto recibir considerando slippage
     * @param amount Cantidad original
     * @param slippageBps Porcentaje de slippage (base 10000)
     * @return Cantidad mínima aceptable
     */
    function calculateMinAmountWithSlippage(uint256 amount, uint256 slippageBps) internal pure returns (uint256) {
        return amount * (10000 - slippageBps) / 10000;
    }
}
