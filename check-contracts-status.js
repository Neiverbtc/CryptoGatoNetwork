const { ethers } = require("hardhat");

async function main() {
    console.log("==================================================");
    console.log("🔍 VERIFICACIÓN COMPLETA DE CONTRATOS CRYPTOGATO");
    console.log("==================================================");
    
    // Direcciones de contratos desplegados
    const contracts = {
        "CryptoGato Token": "0x487A001ce10215F5B9aC8827823e821C6E70CB66",
        "CryptoGatoPresale": "0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D",
        "CGATOLiquidityConnector": "0xF308cbA0e89CaEbd325aE09BF9E19d142d9279CE"
    };

    const [deployer] = await ethers.getSigners();
    console.log(`📍 Wallet verificando: ${deployer.address}`);
    console.log(`💰 Balance: ${ethers.utils.formatEther(await deployer.getBalance())} BNB\n`);

    for (const [name, address] of Object.entries(contracts)) {
        console.log(`🔍 ${name}:`);
        console.log(`   📍 Dirección: ${address}`);
        
        try {
            // Verificar si el contrato existe
            const code = await ethers.provider.getCode(address);
            if (code === "0x") {
                console.log(`   ❌ ERROR: No hay código en esta dirección`);
                continue;
            }
            console.log(`   ✅ Contrato encontrado`);

            // Verificaciones específicas por contrato
            if (name === "CryptoGato Token") {
                await checkCryptoGatoToken(address);
            } else if (name === "CryptoGatoPresale") {
                await checkCryptoGatoPresale(address);
            } else if (name === "CGATOLiquidityConnector") {
                await checkLiquidityConnector(address);
            }
            
        } catch (error) {
            console.log(`   ❌ Error verificando: ${error.message}`);
        }
        console.log("");
    }
}

async function checkCryptoGatoToken(address) {
    try {
        const token = await ethers.getContractAt("CryptoGato", address);
        
        const name = await token.name();
        const symbol = await token.symbol();
        const totalSupply = await token.totalSupply();
        const maxSupply = await token.MAX_SUPPLY();
        
        console.log(`   🏷️  Nombre: ${name}`);
        console.log(`   🔖 Símbolo: ${symbol}`);
        console.log(`   📊 Supply actual: ${ethers.utils.formatEther(totalSupply)} CGATO`);
        console.log(`   📈 Supply máximo: ${ethers.utils.formatEther(maxSupply)} CGATO`);
        
        // Verificar si presale es minter
        const presaleAddress = "0x77A0C33A242CC4f4fAaA13A796423b79c25B5a1D";
        const isMinter = await token.isMinter(presaleAddress);
        console.log(`   🔐 Presale es minter: ${isMinter ? "✅ SÍ" : "❌ NO"}`);
        
        // Verificar timelock operations
        const operationId = ethers.utils.keccak256(ethers.utils.defaultAbiCoder.encode(["string", "address"], ["addMinter", presaleAddress]));
        const timelockTime = await token.timelockOperations(operationId);
        
        if (timelockTime.gt(0)) {
            const currentTime = Math.floor(Date.now() / 1000);
            const unlockTime = timelockTime.toNumber();
            const timeLeft = unlockTime - currentTime;
            
            if (timeLeft > 0) {
                const hours = Math.floor(timeLeft / 3600);
                const minutes = Math.floor((timeLeft % 3600) / 60);
                console.log(`   ⏰ Timelock activo: ${hours}h ${minutes}m restantes`);
                console.log(`   🕐 Se desbloquea: ${new Date(unlockTime * 1000).toLocaleString()}`);
            } else {
                console.log(`   ✅ Timelock listo para ejecutar`);
            }
        } else {
            console.log(`   ℹ️  No hay operaciones timelock pendientes`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error verificando token: ${error.message}`);
    }
}

async function checkCryptoGatoPresale(address) {
    try {
        const presale = await ethers.getContractAt("CryptoGatoPresale", address);
        
        const isInitialized = await presale.isInitialized();
        const currentPhase = await presale.currentPhase();
        const treasuryWallet = await presale.treasuryWallet();
        
        console.log(`   🔧 Inicializado: ${isInitialized ? "✅ SÍ" : "❌ NO"}`);
        
        const phases = ["SETUP", "WHITELIST", "PUBLIC", "ENDED"];
        console.log(`   📍 Fase actual: ${phases[currentPhase]} (${currentPhase})`);
        console.log(`   💰 Tesorería: ${treasuryWallet}`);
        
        if (isInitialized) {
            const totalTokensSold = await presale.totalTokensSold();
            const maxTokensToSell = await presale.maxTokensToSell();
            const startTime = await presale.startTime();
            const endTime = await presale.endTime();
            
            console.log(`   📊 Tokens vendidos: ${ethers.utils.formatEther(totalTokensSold)} CGATO`);
            console.log(`   📈 Máximo a vender: ${ethers.utils.formatEther(maxTokensToSell)} CGATO`);
            console.log(`   🕐 Inicio: ${new Date(startTime * 1000).toLocaleString()}`);
            console.log(`   🕐 Fin: ${new Date(endTime * 1000).toLocaleString()}`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error verificando presale: ${error.message}`);
    }
}

async function checkLiquidityConnector(address) {
    try {
        const connector = await ethers.getContractAt("CGATOLiquidityConnector", address);
        
        const tokenAddress = await connector.token();
        const wbnbAddress = await connector.WBNB();
        
        console.log(`   🔗 Token conectado: ${tokenAddress}`);
        console.log(`   💎 WBNB: ${wbnbAddress}`);
        
        // Verificar DEXs configurados
        try {
            const dexsInfo = await connector.getAllDEXsInfo();
            console.log(`   📊 DEXs configurados: ${dexsInfo.routers.length}`);
            
            for (let i = 0; i < dexsInfo.routers.length; i++) {
                console.log(`     • ${dexsInfo.names[i]}: ${dexsInfo.liquidityShares[i] / 100}%`);
            }
        } catch (error) {
            console.log(`   ℹ️  No se pudieron obtener datos de DEXs`);
        }
        
    } catch (error) {
        console.log(`   ❌ Error verificando connector: ${error.message}`);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });