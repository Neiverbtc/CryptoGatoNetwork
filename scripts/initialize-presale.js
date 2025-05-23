const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    
    console.log("🚀 INICIALIZANDO CONTRATO DE PREVENTA");
    console.log("=====================================");
    console.log(`👤 Account: ${deployer.address}`);
    
    // Direcciones de tus contratos
    const CRYPTOGATO_TOKEN = "0x487A001ce10215F5B9aC8827823e821C6E70CB66";
    const PRESALE_CONTRACT = "0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D";
    
    // Conectar al contrato de preventa
    const presale = await ethers.getContractAt("CryptoGatoPresale", PRESALE_CONTRACT);
    
    console.log(`📍 Contrato Preventa: ${PRESALE_CONTRACT}`);
    console.log(`🪙 Token CGATO: ${CRYPTOGATO_TOKEN}`);
    
    // Parámetros de inicialización
    const initParams = {
        tokenAddress: CRYPTOGATO_TOKEN,
        maxTokens: ethers.parseUnits("1000000", 18), // 1 millón de tokens para testing
        startTime: Math.floor(Date.now() / 1000) + 300, // Inicia en 5 minutos
        endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
        whitelistPrice: ethers.parseEther("0.001"), // 0.001 BNB por token (1,000 tokens por BNB)
        publicPrice: ethers.parseEther("0.002"), // 0.002 BNB por token (500 tokens por BNB)
        minPurchase: ethers.parseUnits("100", 18), // Mínimo 100 tokens
        maxPurchase: ethers.parseUnits("5000", 18) // Máximo 5,000 tokens
    };
    
    try {
        console.log("\n📋 Parámetros de inicialización:");
        console.log(`   💰 Precio Whitelist: ${ethers.formatEther(initParams.whitelistPrice)} BNB por token`);
        console.log(`   💰 Precio Público: ${ethers.formatEther(initParams.publicPrice)} BNB por token`);
        console.log(`   🎯 Tokens máximos: ${ethers.formatUnits(initParams.maxTokens, 18)} CGATO`);
        console.log(`   📅 Duración: 30 días`);
        console.log(`   💎 Límites: ${ethers.formatUnits(initParams.minPurchase, 18)} - ${ethers.formatUnits(initParams.maxPurchase, 18)} tokens`);
        
        console.log("\n⏳ Enviando transacción de inicialización...");
        
        const tx = await presale.initialize(
            initParams.tokenAddress,
            initParams.maxTokens,
            initParams.startTime,
            initParams.endTime,
            initParams.whitelistPrice,
            initParams.publicPrice,
            initParams.minPurchase,
            initParams.maxPurchase
        );
        
        console.log(`📤 TX Hash: ${tx.hash}`);
        console.log("⏳ Esperando confirmación...");
        
        await tx.wait();
        
        console.log("✅ ¡PREVENTA INICIALIZADA EXITOSAMENTE!");
        console.log("\n🎉 ¡Tu preventa está lista para recibir compras!");
        console.log("\n📊 Verificación:");
        
        // Verificar estado
        const currentPhase = await presale.currentPhase();
        const totalRaised = await presale.totalRaised();
        const participantCount = await presale.participantCount();
        
        console.log(`   Fase actual: ${currentPhase}`);
        console.log(`   Total recaudado: ${ethers.formatEther(totalRaised)} BNB`);
        console.log(`   Participantes: ${participantCount}`);
        
    } catch (error) {
        console.error("❌ Error inicializando preventa:", error.message);
        if (error.message.includes("already initialized")) {
            console.log("ℹ️  El contrato ya está inicializado");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });