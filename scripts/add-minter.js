// Script para añadir minter manualmente
const { ethers } = require('ethers');

async function main() {
    console.log("🔐 AÑADIENDO MINTER AL CONTRATO CRYPTOGATO");
    console.log("==========================================");
    
    const RPC_URL = "https://data-seed-prebsc-1-s1.binance.org:8545";
    const PRIVATE_KEY = process.env.PRIVATE_KEY;
    const CRYPTOGATO_TOKEN = "0x487A001ce10215F5B9aC8827823e821C6E70CB66";
    const PRESALE_ADDRESS = "0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D";
    
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    console.log(`👤 Wallet: ${wallet.address}`);
    console.log(`🪙 Token: ${CRYPTOGATO_TOKEN}`);
    console.log(`💰 Presale: ${PRESALE_ADDRESS}`);
    
    // ABI para addMinter
    const tokenABI = [
        {
            "inputs": [{"type": "address", "name": "account"}],
            "name": "addMinter",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }
    ];
    
    const cryptoGato = new ethers.Contract(CRYPTOGATO_TOKEN, tokenABI, wallet);
    
    try {
        console.log("\n⏳ Añadiendo contrato de preventa como minter...");
        
        const tx = await cryptoGato.addMinter(PRESALE_ADDRESS, { gasLimit: 100000 });
        
        console.log(`📤 TX Hash: ${tx.hash}`);
        await tx.wait();
        
        console.log("✅ ¡MINTER AÑADIDO EXITOSAMENTE!");
        console.log("🎉 Ahora ya puedes inicializar la preventa");
        
    } catch (error) {
        console.error("❌ Error:", error.message);
    }
}

main().catch(console.error);