// Script directo para inicializar el contrato de preventa
const { ethers } = require('ethers');

async function main() {
    console.log("🚀 INICIALIZANDO CONTRATO DE PREVENTA");
    console.log("=====================================");
    
    // Configuración
    const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const PRESALE_ADDRESS = "0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D";
    const CRYPTOGATO_TOKEN = "0x487A001ce10215F5B9aC8827823e821C6E70CB66";
    
    if (!PRIVATE_KEY) {
        console.log("❌ Error: PRIVATE_KEY no encontrada en variables de entorno");
        return;
    }
    
    // Conectar a BSC Testnet
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`👤 Wallet: ${wallet.address}`);
    console.log(`📍 Preventa: ${PRESALE_ADDRESS}`);
    
    // ABI de la función initialize
    const presaleABI = [
        {
            "inputs": [
                {"type": "address", "name": "_token"},
                {"type": "uint256", "name": "_maxTokens"},
                {"type": "uint256", "name": "_startTime"},
                {"type": "uint256", "name": "_endTime"},
                {"type": "uint256", "name": "_whitelistPrice"},
                {"type": "uint256", "name": "_publicPrice"},
                {"type": "uint256", "name": "_minPurchase"},
                {"type": "uint256", "name": "_maxPurchase"}
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
    // Crear contrato
    const presale = new ethers.Contract(PRESALE_ADDRESS, presaleABI, wallet);
    
    // Parámetros
    const params = {
        tokenAddress: CRYPTOGATO_TOKEN,
        maxTokens: ethers.parseUnits("1000000", 18), // 1M tokens
        startTime: Math.floor(Date.now() / 1000) + 300, // 5 min
        endTime: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 días  
        whitelistPrice: ethers.parseEther("0.001"), // 0.001 BNB/token
        publicPrice: ethers.parseEther("0.002"), // 0.002 BNB/token
        minPurchase: ethers.parseUnits("100", 18), // 100 tokens mín
        maxPurchase: ethers.parseUnits("5000", 18) // 5000 tokens máx
    };
    
    console.log("\n📋 Parámetros:");
    console.log(`   💰 Precio Whitelist: 0.001 BNB/token (1000 tokens/BNB)`);
    console.log(`   💰 Precio Público: 0.002 BNB/token (500 tokens/BNB)`);
    console.log(`   🎯 Tokens máximos: 1,000,000 CGATO`);
    console.log(`   💎 Límites: 100 - 5,000 tokens por compra`);
    
    try {
        console.log("\n⏳ Enviando transacción...");
        
        const tx = await presale.initialize(
            params.tokenAddress,
            params.maxTokens,
            params.startTime,
            params.endTime,
            params.whitelistPrice,
            params.publicPrice,
            params.minPurchase,
            params.maxPurchase,
            { gasLimit: 300000 }
        );
        
        console.log(`📤 TX Hash: ${tx.hash}`);
        console.log("⏳ Esperando confirmación...");
        
        await tx.wait();
        
        console.log("✅ ¡PREVENTA INICIALIZADA EXITOSAMENTE!");
        console.log("\n🎉 ¡Tu contrato está listo para recibir compras!");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
        if (error.message.includes("already initialized")) {
            console.log("ℹ️  El contrato ya está inicializado");
        }
    }
}

main().catch(console.error);