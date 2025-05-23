const { ethers } = require("hardhat");
const { getNetworkConfig } = require("./utils/network-config");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const networkConfig = getNetworkConfig(network.chainId);

    console.log("=".repeat(50));
    console.log("🚀 DESPLIEGUE DE CRYPTOGATO TOKEN");
    console.log("=".repeat(50));
    console.log(`📍 Red: ${network.name} (ChainID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} BNB`);
    console.log("=".repeat(50));

    // Verificar que tenemos la configuración de red
    if (!networkConfig) {
        throw new Error(`Configuración de red no encontrada para chainId: ${network.chainId}`);
    }

    console.log("📋 Configuración de Red:");
    console.log(`   Router PancakeSwap: ${networkConfig.pancakeRouter}`);
    console.log(`   WBNB: ${networkConfig.wbnb}`);
    console.log("");

    // 1. Desplegar CryptoGato Token
    console.log("1️⃣  Desplegando CryptoGato Token...");
    const CryptoGato = await ethers.getContractFactory("CryptoGato");
    const cryptoGato = await CryptoGato.deploy(networkConfig.pancakeRouter);
    await cryptoGato.waitForDeployment();
    
    console.log(`✅ CryptoGato desplegado en: ${await cryptoGato.getAddress()}`);
    console.log(`   TX Hash: ${cryptoGato.deploymentTransaction().hash}`);

    // Esperar confirmaciones
    console.log("⏳ Esperando confirmaciones...");
    await cryptoGato.deploymentTransaction().wait(networkConfig.confirmations || 5);

    // Verificar información del contrato
    console.log("\n📊 Información del Token:");
    const tokenInfo = await cryptoGato.getContractInfo();
    console.log(`   Nombre: ${await cryptoGato.name()}`);
    console.log(`   Símbolo: ${await cryptoGato.symbol()}`);
    console.log(`   Decimales: ${await cryptoGato.decimals()}`);
    console.log(`   Suministro Total: ${ethers.utils.formatEther(tokenInfo._totalSupply)} CGATO`);
    console.log(`   Suministro Máximo: ${ethers.utils.formatEther(tokenInfo._maxSupply)} CGATO`);
    console.log(`   Par PancakeSwap: ${tokenInfo._pancakePair}`);

    // Verificar categorías
    console.log("\n📈 Información de Categorías:");
    const categoriesInfo = await cryptoGato.getAllCategoriesInfo();
    const categoryNames = [
        "Preventa", "Liquidez", "Equipo/Marketing", 
        "Exchanges", "Ecosistema", "Estratégica"
    ];
    
    for (let i = 0; i < categoriesInfo.categories.length; i++) {
        const category = categoriesInfo.categories[i];
        const percentage = categoriesInfo.percentages[i];
        const limit = categoriesInfo.limits[i];
        const available = categoriesInfo.available[i];
        
        console.log(`   ${categoryNames[i]} (${category}):`);
        console.log(`     Porcentaje: ${percentage / 10}%`);
        console.log(`     Límite: ${ethers.utils.formatEther(limit)} CGATO`);
        console.log(`     Disponible: ${ethers.utils.formatEther(available)} CGATO`);
    }

    // Guardar direcciones de despliegue
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            CryptoGato: {
                address: cryptoGato.address,
                txHash: cryptoGato.deployTransaction.hash,
                constructorArgs: [networkConfig.pancakeRouter]
            }
        },
        verification: {
            CryptoGato: `npx hardhat verify --network ${network.name} ${cryptoGato.address} "${networkConfig.pancakeRouter}"`
        }
    };

    // Guardar en archivo JSON
    const fs = require("fs");
    const deploymentFile = `deployed-addresses-${network.name}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n=".repeat(50));
    console.log("✅ DESPLIEGUE COMPLETADO EXITOSAMENTE");
    console.log("=".repeat(50));
    console.log(`📄 Información guardada en: ${deploymentFile}`);
    console.log("\n🔍 Para verificar el contrato, ejecuta:");
    console.log(`   ${deploymentInfo.verification.CryptoGato}`);
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Verificar el contrato en BSCScan");
    console.log("   2. Configurar el contrato de preventa");
    console.log("   3. Configurar el conector de liquidez");
    console.log("   4. Habilitar el trading");
    console.log("=".repeat(50));

    return {
        cryptoGato: cryptoGato.address,
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
            console.error("❌ Error durante el despliegue:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
