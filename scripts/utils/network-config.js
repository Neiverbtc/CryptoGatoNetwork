/**
 * Configuración de redes para el proyecto CryptoGato
 */

const networkConfigs = {
    // BSC Mainnet
    56: {
        name: "bsc",
        chainId: 56,
        rpcUrl: "https://bsc-dataseed.binance.org/",
        pancakeRouter: "0x10ED43C718714eb63d5aA57B78B54704E256024E",
        pancakeFactory: "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73",
        wbnb: "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
        multicall: "0x41263cBA59EB80dC200F3E2544eda4ed6A90E76C",
        confirmations: 3,
        gasPrice: "5000000000", // 5 gwei
        blockTime: 3, // 3 segundos
        explorerUrl: "https://bscscan.com",
        additionalDEXs: [
            {
                name: "Biswap",
                router: "0x3a6d8cA21D1CF76F653A67577FA0D27453350dD8",
                factory: "0x858E3312ed3A876947EA49d572A7C42DE08af7EE",
                liquidityShare: 2000 // 20%
            },
            {
                name: "ApeSwap",
                router: "0xcF0feBd3f17CEf5b47b0cD257aCf6025c5BFf3b7",
                factory: "0x0841BD0B734E4F5853f0dD8d7Ea041c241fb0Da6",
                liquidityShare: 1000 // 10%
            }
        ]
    },

    // BSC Testnet
    97: {
        name: "bsc-testnet",
        chainId: 97,
        rpcUrl: "https://data-seed-prebsc-1-s1.binance.org:8545/",
        pancakeRouter: "0xD99D1c33F9fC3444f8101754aBC46c52416550D1",
        pancakeFactory: "0x6725F303b657a9451d8BA641348b6761A6CC7a17",
        wbnb: "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        multicall: "0xae11C5B5f29A6a25e955F0CB8ddCc416f522AF5C",
        confirmations: 3,
        gasPrice: "20000000000", // 20 gwei
        blockTime: 3,
        explorerUrl: "https://testnet.bscscan.com",
        additionalDEXs: [
            // En testnet solo usamos PancakeSwap normalmente
        ]
    },

    // Ethereum Mainnet
    1: {
        name: "ethereum",
        chainId: 1,
        rpcUrl: "https://mainnet.infura.io/v3/YOUR_INFURA_KEY",
        uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        uniswapFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        weth: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        multicall: "0xeefBa1e63905eF1D7ACbA5a8513c70307C1cE441",
        confirmations: 2,
        gasPrice: "20000000000", // 20 gwei
        blockTime: 13,
        explorerUrl: "https://etherscan.io"
    },

    // Ethereum Goerli Testnet
    5: {
        name: "goerli",
        chainId: 5,
        rpcUrl: "https://goerli.infura.io/v3/YOUR_INFURA_KEY",
        uniswapRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        uniswapFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
        multicall: "0x77dCa2C955b15e9dE4dbBCf1246B4B85b651e50e",
        confirmations: 2,
        gasPrice: "20000000000",
        blockTime: 13,
        explorerUrl: "https://goerli.etherscan.io"
    },

    // Polygon Mainnet
    137: {
        name: "polygon",
        chainId: 137,
        rpcUrl: "https://polygon-rpc.com/",
        quickSwapRouter: "0xa5E0829CaCEd8fFDD4De3c43696c57F7D7A678ff",
        quickSwapFactory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
        wmatic: "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270",
        multicall: "0x11ce4B23bD875D7F5C6a31084f55fDe1e9A87507",
        confirmations: 3,
        gasPrice: "30000000000", // 30 gwei
        blockTime: 2,
        explorerUrl: "https://polygonscan.com"
    },

    // Polygon Mumbai Testnet
    80001: {
        name: "mumbai",
        chainId: 80001,
        rpcUrl: "https://rpc-mumbai.maticvigil.com/",
        quickSwapRouter: "0x8954AfA98594b838bda56FE4C12a09D7739D179b",
        quickSwapFactory: "0x5757371414417b8C6CAad45bAeF941aBc7d3Ab32",
        wmatic: "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889",
        multicall: "0x08411ADd0b5AA8ee47563b146743C13b3556c9Cc",
        confirmations: 3,
        gasPrice: "30000000000",
        blockTime: 2,
        explorerUrl: "https://mumbai.polygonscan.com"
    },

    // Hardhat Local Network
    31337: {
        name: "hardhat",
        chainId: 31337,
        rpcUrl: "http://127.0.0.1:8545/",
        // Para testing local, usamos direcciones mock
        pancakeRouter: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D",
        pancakeFactory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f",
        wbnb: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
        confirmations: 1,
        gasPrice: "20000000000",
        blockTime: 2,
        explorerUrl: "http://localhost:8545"
    }
};

/**
 * Obtiene la configuración de red para un chainId específico
 * @param {number} chainId - ID de la cadena
 * @returns {object|null} Configuración de la red o null si no se encuentra
 */
function getNetworkConfig(chainId) {
    const config = networkConfigs[chainId];
    if (!config) {
        return null;
    }

    // Aplicar overrides desde variables de entorno
    return {
        ...config,
        rpcUrl: process.env[`${config.name.toUpperCase()}_RPC`] || config.rpcUrl,
        gasPrice: process.env.GAS_PRICE || config.gasPrice,
        confirmations: parseInt(process.env.CONFIRMATIONS) || config.confirmations
    };
}

/**
 * Obtiene todas las configuraciones de red disponibles
 * @returns {object} Todas las configuraciones de red
 */
function getAllNetworkConfigs() {
    return networkConfigs;
}

/**
 * Verifica si una red está soportada
 * @param {number} chainId - ID de la cadena
 * @returns {boolean} True si la red está soportada
 */
function isNetworkSupported(chainId) {
    return chainId in networkConfigs;
}

/**
 * Obtiene la configuración específica para pruebas
 * @param {number} chainId - ID de la cadena
 * @returns {object} Configuración de pruebas
 */
function getTestConfig(chainId) {
    const baseConfig = getNetworkConfig(chainId);
    if (!baseConfig) {
        return null;
    }

    return {
        ...baseConfig,
        // Configuración específica para pruebas
        gasLimit: 8000000,
        timeout: 60000,
        retries: 3,
        // Direcciones de prueba comunes
        testAddresses: {
            alice: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
            bob: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
            charlie: "0x90F79bf6EB2c4f870365E785982E1f101E93b906"
        }
    };
}

/**
 * Formatea la configuración de red para mostrar
 * @param {number} chainId - ID de la cadena
 * @returns {string} Configuración formateada
 */
function formatNetworkConfig(chainId) {
    const config = getNetworkConfig(chainId);
    if (!config) {
        return `Red no soportada (ChainID: ${chainId})`;
    }

    return `
Red: ${config.name} (ChainID: ${config.chainId})
RPC: ${config.rpcUrl}
Explorador: ${config.explorerUrl}
Confirmaciones: ${config.confirmations}
Tiempo de bloque: ${config.blockTime}s
Gas Price: ${config.gasPrice} wei
`.trim();
}

module.exports = {
    getNetworkConfig,
    getAllNetworkConfigs,
    isNetworkSupported,
    getTestConfig,
    formatNetworkConfig,
    networkConfigs
};
