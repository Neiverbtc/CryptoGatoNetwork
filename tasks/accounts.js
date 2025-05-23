const { task } = require("hardhat/config");

// Task para listar cuentas disponibles
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (let i = 0; i < accounts.length; i++) {
    const account = accounts[i];
    const balance = await hre.ethers.provider.getBalance(account.address);
    
    console.log(`Account ${i}: ${account.address}`);
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
    console.log("---");
  }
});