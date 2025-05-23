const { ethers } = require("hardhat");
const { getNetworkConfig } = require("./utils/network-config");

async function main() {
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const networkConfig = getNetworkConfig(network.chainId);

    console.log("=".repeat(50));
    console.log("🚀 DESPLIEGUE DE CRYPTOGATO PREVENTA");
    console.log("=".repeat(50));
    console.log(`📍 Red: ${network.name} (ChainID: ${network.chainId})`);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.formatEther(await deployer.provider.getBalance(deployer.address))} BNB`);
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

    // Verificar que tenemos la dirección del treasury wallet
    const treasuryWallet = process.env.TREASURY_WALLET || deployer.address;
    
    console.log("📋 Configuración:");
    console.log(`   Token CryptoGato: ${cryptoGatoAddress}`);
    console.log(`   Treasury Wallet: ${treasuryWallet}`);
    console.log("");

    // 1. Desplegar CryptoGatoPresale
    console.log("1️⃣  Desplegando CryptoGatoPresale...");
    const CryptoGatoPresale = await ethers.getContractFactory("CryptoGatoPresale");
    const presale = await CryptoGatoPresale.deploy(treasuryWallet);
    await presale.waitForDeployment();
    
    console.log(`✅ CryptoGatoPresale desplegado en: ${await presale.getAddress()}`);
    console.log(`   TX Hash: ${presale.deploymentTransaction().hash}`);

    // Esperar confirmaciones
    console.log("⏳ Esperando confirmaciones...");
    await presale.deploymentTransaction().wait(networkConfig.confirmations || 5);

    // 2. Configurar el token CryptoGato para añadir el contrato de preventa como minter
    console.log("\n2️⃣  Configurando permisos de minter...");
    const cryptoGato = await ethers.getContractAt("CryptoGato", cryptoGatoAddress);
    
    // Verificar si ya es minter
    const isMinter = await cryptoGato.isMinter(presale.address);
    if (!isMinter) {
        console.log("   Programando adición de minter con timelock...");
        const addMinterTx = await cryptoGato.scheduleAddMinter(presale.address);
        await addMinterTx.wait();
        console.log(`   ✅ Minter programado. TX: ${addMinterTx.hash}`);
        console.log(`   ⏰ Ejecutar después de 24 horas con: executeAddMinter("${presale.address}")`);
    } else {
        console.log("   ✅ El contrato de preventa ya es minter");
    }

    // 3. Inicializar la preventa (si se proporcionan parámetros)
    const shouldInitialize = process.env.INITIALIZE_PRESALE === "true";
    if (shouldInitialize) {
        console.log("\n3️⃣  Inicializando preventa...");
        
        // Parámetros de preventa desde variables de entorno
        const maxTokens = process.env.PRESALE_MAX_TOKENS || ethers.utils.parseEther("3000000000"); // 3B tokens por defecto
        const startTime = process.env.PRESALE_START_TIME || Math.floor(Date.now() / 1000) + 86400; // 24 horas desde ahora
        const endTime = process.env.PRESALE_END_TIME || Math.floor(Date.now() / 1000) + (30 * 86400); // 30 días desde ahora
        const whitelistPrice = process.env.PRESALE_WHITELIST_PRICE || "100000000000000"; // 0.0001 BNB por token
        const publicPrice = process.env.PRESALE_PUBLIC_PRICE || "120000000000000"; // 0.00012 BNB por token
        const minPurchase = process.env.PRESALE_MIN_PURCHASE || ethers.utils.parseEther("1000"); // 1000 tokens mínimo
        const maxPurchase = process.env.PRESALE_MAX_PURCHASE || ethers.utils.parseEther("50000"); // 50000 tokens máximo

        try {
            const initTx = await presale.initialize(
                cryptoGatoAddress,
                maxTokens,
                startTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            );
            await initTx.wait();
            console.log(`   ✅ Preventa inicializada. TX: ${initTx.hash}`);
        } catch (error) {
            console.log(`   ⚠️  Error inicializando preventa: ${error.message}`);
            console.log("   💡 Puede inicializar manualmente más tarde");
        }
    }

    // Obtener información de la preventa
    console.log("\n📊 Información de la Preventa:");
    try {
        const presaleInfo = await presale.getPresaleInfo();
        console.log(`   Estado: ${presaleInfo._isInitialized ? 'Inicializada' : 'No inicializada'}`);
        console.log(`   Fase actual: ${presaleInfo._currentPhase}`);
        console.log(`   Tokens máximos: ${ethers.utils.formatEther(presaleInfo._maxTokensToSell)} CGATO`);
        console.log(`   Tokens vendidos: ${ethers.utils.formatEther(presaleInfo._totalTokensSold)} CGATO`);
        if (presaleInfo._isInitialized) {
            console.log(`   Inicio: ${new Date(presaleInfo._startTime * 1000).toLocaleString()}`);
            console.log(`   Fin: ${new Date(presaleInfo._endTime * 1000).toLocaleString()}`);
            console.log(`   Precio Whitelist: ${ethers.utils.formatEther(presaleInfo._whitelistPrice)} BNB/token`);
            console.log(`   Precio Público: ${ethers.utils.formatEther(presaleInfo._publicPrice)} BNB/token`);
        }
    } catch (error) {
        console.log("   ℹ️  Información no disponible (preventa no inicializada)");
    }

    // Guardar direcciones de despliegue
    const deploymentInfo = {
        network: network.name,
        chainId: network.chainId,
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        contracts: {
            CryptoGatoPresale: {
                address: presale.address,
                txHash: presale.deployTransaction.hash,
                constructorArgs: [treasuryWallet]
            }
        },
        configuration: {
            cryptoGatoAddress,
            treasuryWallet,
            initialized: shouldInitialize
        },
        verification: {
            CryptoGatoPresale: `npx hardhat verify --network ${network.name} ${presale.address} "${treasuryWallet}"`
        }
    };

    // Guardar en archivo JSON
    const fs = require("fs");
    const deploymentFile = `deployed-presale-${network.name}.json`;
    fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

    console.log("\n=".repeat(50));
    console.log("✅ DESPLIEGUE DE PREVENTA COMPLETADO");
    console.log("=".repeat(50));
    console.log(`📄 Información guardada en: ${deploymentFile}`);
    console.log("\n🔍 Para verificar el contrato, ejecuta:");
    console.log(`   ${deploymentInfo.verification.CryptoGatoPresale}`);
    console.log("\n📝 Próximos pasos:");
    console.log("   1. Verificar el contrato en BSCScan");
    if (!isMinter) {
        console.log("   2. Ejecutar executeAddMinter después de 24 horas");
    }
    if (!shouldInitialize) {
        console.log("   3. Inicializar la preventa con initialize()");
    }
    console.log("   4. Configurar whitelist de participantes");
    console.log("   5. Cambiar fase a WHITELIST para comenzar");
    console.log("=".repeat(50));

    return {
        presale: presale.address,
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
            console.error("❌ Error durante el despliegue de la preventa:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = main;
