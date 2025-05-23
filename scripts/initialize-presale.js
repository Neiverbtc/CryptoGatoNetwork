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
        tokenPrice: ethers.parseEther("0.02"), // 0.02 BNB por token (50 tokens por BNB)
        fundingGoal: ethers.parseEther("1000"), // Meta de 1000 BNB
        minContribution: ethers.parseEther("0.1"), // Mínimo 0.1 BNB
        maxContribution: ethers.parseEther("10"), // Máximo 10 BNB
        startTime: Math.floor(Date.now() / 1000), // Ahora
        endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días
        vestingConfig: {
            immediateReleasePercent: 2000, // 20% inmediato
            cliffPeriod: 30 * 24 * 60 * 60, // 30 días cliff
            vestingDuration: 150 * 24 * 60 * 60 // 150 días vesting
        }
    };
    
    try {
        console.log("\n📋 Parámetros de inicialización:");
        console.log(`   💰 Precio: ${ethers.formatEther(initParams.tokenPrice)} BNB por token`);
        console.log(`   🎯 Meta: ${ethers.formatEther(initParams.fundingGoal)} BNB`);
        console.log(`   📅 Duración: 30 días`);
        console.log(`   🔄 Vesting: 20% inmediato + 150 días lineales`);
        
        console.log("\n⏳ Enviando transacción de inicialización...");
        
        const tx = await presale.initialize(
            initParams.tokenAddress,
            initParams.tokenPrice,
            initParams.fundingGoal,
            initParams.minContribution,
            initParams.maxContribution,
            initParams.startTime,
            initParams.endTime,
            initParams.vestingConfig
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