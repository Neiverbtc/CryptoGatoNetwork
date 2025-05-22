const { ethers } = require("hardhat");
const { getNetworkConfig } = require("./utils/network-config");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const networkConfig = getNetworkConfig(network.chainId);

    console.log("=".repeat(50));
    console.log("🚀 DESPLIEGUE DE CGATO LIQUIDITY CONNECTOR");
    console.log("=".repeat(50));
    console.log(`📍 Red: ${network.name} (ChainID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} BNB`);
    console.log("=".repeat(50));

    // Verificar que tenemos la configuración de red
    if (!networkConfig) {
        throw new Error(`Configuración de red no encontrada para chainId: ${network.chainId}`);
    }

    // Verificar que tenemos la dirección del token CryptoGato
    const cryptoGatoAddress = process.env.CRYPTOGATO_ADDRESS;
    if (!cryptoGatoAddress) {
        throw new Error("CRYPTOGATO_ADDRESS no está definida en las variables de entorno");
    }

    console.log("📋 Configuración:");
    console.log(`   Token CryptoGato: ${cryptoGatoAddress}`);
    console.log(`   WBNB: ${networkConfig.wbnb}`);
    console.log(`   Router Principal: ${networkConfig.pancakeRouter}`);
    console.log("");

    // 1. Desplegar CGATOLiquidityConnector
    console.log("1️⃣  Desplegando CGATOLiquidityConnector...");
    const CGATOLiquidityConnector = await ethers.getContractFactory("CGATOLiquidityConnector");
    const liquidityConnector = await CGATOLiquidityConnector.deploy(
        cryptoGatoAddress,
        networkConfig.wbnb
    );
    await liquidityConnector.deployed();
    
    console.log(`✅ CGATOLiquidityConnector desplegado en: ${liquidityConnector.address}`);
    console.log(`   TX Hash: ${liquidityConnector.deployTransaction.hash}`);

    // Esperar confirmaciones
    console.log("⏳ Esperando confirmaciones...");
    await liquidityConnector.deployTransaction.wait(networkConfig.confirmations || 5);

    // 2. Configurar DEXs por defecto
    console.log("\n2️⃣  Configurando DEXs...");
    
    // PancakeSwap como DEX principal
    try {
        const addPancakeSwapTx = await liquidityConnector.addDEX(
            networkConfig.pancakeRouter,
            networkConfig.pancakeFactory,
            "PancakeSwap V2",
            7000 // 70% de la liquidez
        );
        await addPancakeSwapTx.wait();
        console.log(`   ✅ PancakeSwap V2 añadido. TX: ${addPancakeSwapTx.hash}`);
    } catch (error) {
        console.log(`   ⚠️  Error añadiendo PancakeSwap: ${error.message}`);
    }

    // Configurar DEXs adicionales si están disponibles en la red
    if (networkConfig.additionalDEXs) {
        for (const dex of networkConfig.additionalDEXs) {
            try {
                const addDEXTx = await liquidityConnector.addDEX(
                    dex.router,
                    dex.factory,
                    dex.name,
                    dex.liquidityShare
                );
                await addDEXTx.wait();
                console.log(`   ✅ ${dex.name} añadido. TX: ${addDEXTx.hash}`);
            } catch (error) {
                console.log(`   ⚠️  Error añadiendo ${dex.name}: ${error.message}`);
            }
        }
    }

    // 3. Obtener información de DEXs configurados
    console.log("\n📊 DEXs Configurados:");
    try {
        const dexsInfo = await liquidityConnector.getAllDEXsInfo();
        const totalShare = await liquidityConnector.getTotalLiquidityShare();
        
        console.log(`   Total de DEXs: ${dexsInfo.routers.length}`);
        console.log(`   Porcentaje total asignado: ${totalShare / 100}%`);
        
        for (let i = 0; i < dexsInfo.routers.length; i++) {
            console.log(`   ${dexsInfo.names[i]}:`);
            console.log(`     Router: ${dexsInfo.routers[i]}`);
            console.log(`     Activo: ${dexsInfo.activeStatus[i]}`);
            console.log(`     Liquidez: ${dexsInfo.liquidityShares[i] / 100}%`);
        }
    } catch (error) {
        console.log("   ℹ️  Error obteniendo información de DEXs");
    }

    // 4. Probar funcionalidad de rutas (solo en testnet)
    if (network.chainId === 97) { // BSC Testnet
        console.log("\n3️⃣  Probando funcionalidad de rutas...");
        try {
            // Probar ruta de compra con 0.1 BNB
            const testBNBAmount = ethers.utils.parseEther("0.1");
            const buyRoute = await liquidityConnector.getBestBuyRoute(testBNBAmount);
            console.log(`   Mejor ruta de compra con ${ethers.utils.formatEther(testBNBAmount)} BNB:`);
            console.log(`     Router: ${buyRoute.router}`);
            console.log(`     Tokens estimados: ${ethers.utils.formatEther(buyRoute.outputAmount)} CGATO`);
        } catch (error) {
            console.log("   ℹ️  No se pudo probar rutas (liquidez no disponible aún)");
        }
    }

    // Guardar direcciones de despliegue
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            CGATOLiquidityConnector: {
                address: liquidityConnector.address,
                txHash: liquidityConnector.deployTransaction.hash,
                constructorArgs: [cryptoGatoAddress, networkConfig.wbnb]
            }
        },
        configuration: {
            cryptoGatoAddress,
            wbnb: networkConfig.wbnb,
            dexsConfigured: networkConfig.additionalDEXs ? networkConfig.additionalDEXs.length + 1 : 1
        },
        verification: {
            CGATOLiquidityConnector: `npx hardhat verify --network ${network.name} ${liquidityConnector.address} "${cryptoGatoAddress}" "${networkConfig.wbnb}"`
        }
    };

    // Guardar en archivo JSON
    const fs = require("fs");
    const deploymentFile = `deployed-liquidity-connector-${network.name}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n=".repeat(50));
    console.log("✅ DESPLIEGUE DE LIQUIDITY CONNECTOR COMPLETADO");
    console.log("=".repeat(50));
    console.log(`📄 Información guardada en: ${deploymentFile}`);
    console.log("\n🔍 Para verificar el contrato, ejecuta:");
    console.log(`   ${deploymentInfo.verification.CGATOLiquidityConnector}`);
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Verificar el contrato en BSCScan");
    console.log("   2. Configurar DEXs adicionales si es necesario");
    console.log("   3. Distribuir liquidez inicial con distributeInitialLiquidity()");
    console.log("   4. Probar rutas de intercambio");
    console.log("=".repeat(50));

    return {
        liquidityConnector: liquidityConnector.address,
        deployer: deployer.address,
        network: network.name,
        chainId: network.chainId
    };
}

// Ejecutar el script principal
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Error durante el despliegue del liquidity connector:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
