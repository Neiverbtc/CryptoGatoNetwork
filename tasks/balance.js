const { task } = require("hardhat/config");

// Task para consultar balance de una dirección específica
task("balance", "Prints an account's balance")
  .addParam("account", "The account's address")
  .setAction(async (taskArgs, hre) => {
    const balance = await hre.ethers.provider.getBalance(taskArgs.account);
    console.log(`Account: ${taskArgs.account}`);
    console.log(`Balance: ${hre.ethers.utils.formatEther(balance)} ETH`);
  });