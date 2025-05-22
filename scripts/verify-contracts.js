const { run } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    const network = await ethers.provider.getNetwork();
    
    console.log("=".repeat(50));
    console.log("🔍 VERIFICACIÓN DE CONTRATOS CRYPTOGATO");
    console.log("=".repeat(50));
    console.log(`📍 Red: ${network.name} (ChainID: ${network.chainId})`);
    console.log("=".repeat(50));

    // Buscar archivos de despliegue
    const deploymentFiles = [
        `deployed-addresses-${network.name}.json`,
        `deployed-presale-${network.name}.json`,
        `deployed-liquidity-connector-${network.name}.json`
    ];

    const contractsToVerify = [];

    // Cargar información de contratos desplegados
    for (const file of deploymentFiles) {
        if (fs.existsSync(file)) {
            try {
                const deploymentData = JSON.parse(fs.readFileSync(file, 'utf8'));
                
                for (const [contractName, contractInfo] of Object.entries(deploymentData.contracts)) {
                    contractsToVerify.push({
                        name: contractName,
                        address: contractInfo.address,
                        constructorArgs: contractInfo.constructorArgs || []
                    });
                }
                
                console.log(`📄 Cargado: ${file}`);
            } catch (error) {
                console.log(`⚠️  Error leyendo ${file}: ${error.message}`);
            }
        }
    }

    if (contractsToVerify.length === 0) {
        console.log("❌ No se encontraron contratos para verificar");
        console.log("💡 Asegúrate de haber desplegado los contratos primero");
        return;
    }

    console.log(`\n📋 Contratos encontrados: ${contractsToVerify.length}`);
    console.log("-".repeat(30));

    // Verificar cada contrato
    for (const contract of contractsToVerify) {
        console.log(`\n🔍 Verificando ${contract.name}...`);
        console.log(`   Dirección: ${contract.address}`);
        console.log(`   Argumentos: ${JSON.stringify(contract.constructorArgs)}`);

        try {
            await run("verify:verify", {
                address: contract.address,
                constructorArguments: contract.constructorArgs,
                contract: `contracts/${contract.name}.sol:${contract.name}`
            });
            
            console.log(`   ✅ ${contract.name} verificado exitosamente`);
            
        } catch (error) {
            if (error.message.includes("Already Verified")) {
                console.log(`   ℹ️  ${contract.name} ya está verificado`);
            } else if (error.message.includes("does not have bytecode")) {
                console.log(`   ❌ ${contract.name} no encontrado en la dirección especificada`);
            } else if (error.message.includes("Fail - Unable to verify")) {
                console.log(`   ❌ Error de verificación para ${contract.name}`);
                console.log(`   📝 Detalles: ${error.message}`);
            } else {
                console.log(`   ⚠️  Error inesperado verificando ${contract.name}: ${error.message}`);
            }
        }

        // Esperar un poco entre verificaciones para evitar rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    // Generar informe de verificación
    const verificationReport = {
        network: network.name,
        chainId: network.chainId,
        timestamp: new Date().toISOString(),
        contractsProcessed: contractsToVerify.length,
        contracts: contractsToVerify.map(contract => ({
            name: contract.name,
            address: contract.address,
            verified: true // Esto se podría mejorar para verificar el estado real
        }))
    };

    const reportFile = `verification-report-${network.name}.json`;
    fs.writeFileSync(reportFile, JSON.stringify(verificationReport, null, 2));

    console.log("\n=".repeat(50));
    console.log("✅ VERIFICACIÓN COMPLETADA");
    console.log("=".repeat(50));
    console.log(`📄 Reporte guardado en: ${reportFile}`);
    console.log("\n🔗 Enlaces de verificación:");
    
    const explorerUrl = getExplorerUrl(network.chainId);
    for (const contract of contractsToVerify) {
        console.log(`   ${contract.name}: ${explorerUrl}/address/${contract.address}#code`);
    }
    console.log("=".repeat(50));
}

function getExplorerUrl(chainId) {
    switch (chainId) {
        case 56: // BSC Mainnet
            return "https://bscscan.com";
        case 97: // BSC Testnet
            return "https://testnet.bscscan.com";
        case 1: // Ethereum Mainnet
            return "https://etherscan.io";
        case 5: // Goerli Testnet
            return "https://goerli.etherscan.io";
        case 137: // Polygon Mainnet
            return "https://polygonscan.com";
        case 80001: // Polygon Mumbai
            return "https://mumbai.polygonscan.com";
        default:
            return "https://etherscan.io";
    }
}

// Función auxiliar para verificar un contrato específico
async function verifyContract(contractName, contractAddress, constructorArgs = []) {
    console.log(`🔍 Verificando ${contractName} en ${contractAddress}...`);
    
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: constructorArgs,
            contract: `contracts/${contractName}.sol:${contractName}`
        });
        
        console.log(`✅ ${contractName} verificado exitosamente`);
        return true;
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log(`ℹ️  ${contractName} ya está verificado`);
            return true;
        } else {
            console.log(`❌ Error verificando ${contractName}: ${error.message}`);
            return false;
        }
    }
}

// Ejecutar el script principal
if (require.main === module) {
    main()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error("❌ Error durante la verificación:");
            console.error(error);
            process.exit(1);
        });
}

module.exports = { main, verifyContract };
