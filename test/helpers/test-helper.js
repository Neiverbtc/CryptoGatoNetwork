const { ethers } = require("hardhat");
const { expect } = require("chai");

/**
 * Helper function to parse tokens with 18 decimals
 * @param {string} amount - Amount as string
 * @returns {BigNumber} Parsed amount
 */
function parseTokens(amount) {
    return ethers.parseEther(amount);
}

/**
 * Helper function to format tokens from BigNumber
 * @param {BigNumber} amount - Amount as BigNumber
 * @returns {string} Formatted amount
 */
function formatTokens(amount) {
    return ethers.formatEther(amount);
}

/**
 * Helper function to parse BNB with 18 decimals
 * @param {string} amount - Amount as string
 * @returns {BigNumber} Parsed amount
 */
function parseBNB(amount) {
    return ethers.parseEther(amount);
}

/**
 * Helper function to expect a revert with custom error
 * @param {Promise} promise - Promise that should revert
 * @param {string} errorName - Expected error name
 */
async function expectRevert(promise, errorName) {
    try {
        await promise;
        expect.fail("Expected transaction to revert");
    } catch (error) {
        if (errorName) {
            expect(error.message).to.include(errorName);
        }
    }
}

/**
 * Helper function to increase time in the blockchain
 * @param {number} seconds - Seconds to increase
 */
async function increaseTime(seconds) {
    await ethers.provider.send("evm_increaseTime", [seconds]);
    await ethers.provider.send("evm_mine");
}

/**
 * Helper function to get the latest block timestamp
 * @returns {number} Latest block timestamp
 */
async function getLatestBlockTimestamp() {
    const block = await ethers.provider.getBlock("latest");
    return block.timestamp;
}

/**
 * Helper function to mine blocks
 * @param {number} blocks - Number of blocks to mine
 */
async function mineBlocks(blocks) {
    for (let i = 0; i < blocks; i++) {
        await ethers.provider.send("evm_mine");
    }
}

/**
 * Mock ERC20 contract for testing
 */
const MockERC20Source = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20 {
    uint8 private _decimals;
    
    constructor(string memory name, string memory symbol, uint8 decimals_) ERC20(name, symbol) {
        _decimals = decimals_;
        _mint(msg.sender, 1000000 * 10**decimals_);
    }
    
    function decimals() public view virtual override returns (uint8) {
        return _decimals;
    }
    
    function mint(address to, uint256 amount) external {
        _mint(to, amount);
    }
}
`;

/**
 * Mock PancakeRouter contract for testing
 */
const MockPancakeRouterSource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPancakeRouter {
    address public factory;
    address public WETH;
    
    constructor(address _factory, address _weth) {
        factory = _factory;
        WETH = _weth;
    }
    
    function addLiquidityETH(
        address token,
        uint amountTokenDesired,
        uint amountTokenMin,
        uint amountETHMin,
        address to,
        uint deadline
    ) external payable returns (uint amountToken, uint amountETH, uint liquidity) {
        // Mock implementation
        return (amountTokenDesired, msg.value, msg.value + amountTokenDesired);
    }
    
    function getAmountsOut(uint amountIn, address[] calldata path)
        external pure returns (uint[] memory amounts) {
        amounts = new uint[](path.length);
        amounts[0] = amountIn;
        for (uint i = 1; i < path.length; i++) {
            amounts[i] = amountIn * 1000; // Mock 1000x return
        }
    }
    
    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external payable {
        // Mock implementation
    }
    
    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint amountIn,
        uint amountOutMin,
        address[] calldata path,
        address to,
        uint deadline
    ) external {
        // Mock implementation
    }
}
`;

/**
 * Mock PancakeFactory contract for testing
 */
const MockPancakeFactorySource = `
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MockPancakeFactory {
    mapping(address => mapping(address => address)) public getPair;
    address[] public allPairs;
    
    function createPair(address tokenA, address tokenB) external returns (address pair) {
        // Create a mock pair address
        pair = address(uint160(uint256(keccak256(abi.encodePacked(tokenA, tokenB, block.timestamp)))));
        getPair[tokenA][tokenB] = pair;
        getPair[tokenB][tokenA] = pair;
        allPairs.push(pair);
        return pair;
    }
    
    function allPairsLength() external view returns (uint) {
        return allPairs.length;
    }
}
`;

/**
 * Deploy test fixture with all necessary contracts
 */
async function deployTestFixture() {
    const [owner, treasury, addr1, addr2, addr3] = await ethers.getSigners();

    // Deploy mock contracts
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const MockPancakeRouter = await ethers.getContractFactory("MockPancakeRouter");
    const MockPancakeFactory = await ethers.getContractFactory("MockPancakeFactory");

    const mockFactory = await MockPancakeFactory.deploy();
    await mockFactory.waitForDeployment();
    
    const wbnb = await MockERC20.deploy("Wrapped BNB", "WBNB", 18);
    await wbnb.waitForDeployment();
    
    const mockRouter = await MockPancakeRouter.deploy(await mockFactory.getAddress(), await wbnb.getAddress());
    await mockRouter.waitForDeployment();

    // Deploy CryptoGato token
    const CryptoGato = await ethers.getContractFactory("CryptoGato");
    const cryptoGato = await CryptoGato.deploy(await mockRouter.getAddress());
    await cryptoGato.waitForDeployment();

    return {
        cryptoGato,
        mockRouter,
        mockFactory,
        wbnb,
        owner,
        treasury,
        addr1,
        addr2,
        addr3
    };
}

/**
 * Create a snapshot of the current blockchain state
 * @returns {string} Snapshot ID
 */
async function takeSnapshot() {
    return await ethers.provider.send("evm_snapshot");
}

/**
 * Restore blockchain state to a snapshot
 * @param {string} snapshotId - Snapshot ID to restore
 */
async function restoreSnapshot(snapshotId) {
    await ethers.provider.send("evm_revert", [snapshotId]);
}

/**
 * Helper to calculate gas used by a transaction
 * @param {Object} tx - Transaction object
 * @returns {BigNumber} Gas used
 */
async function getGasUsed(tx) {
    const receipt = await tx.wait();
    return receipt.gasUsed;
}

/**
 * Helper to get balance change after a transaction
 * @param {Object} account - Account to check
 * @param {Function} transaction - Transaction function
 * @returns {BigNumber} Balance change
 */
async function getBalanceChange(account, transaction) {
    const balanceBefore = await account.getBalance();
    await transaction();
    const balanceAfter = await account.getBalance();
    return balanceAfter.sub(balanceBefore);
}

/**
 * Helper to calculate percentage
 * @param {BigNumber} amount - Amount
 * @param {number} percentage - Percentage (e.g., 5 for 5%)
 * @returns {BigNumber} Calculated amount
 */
function calculatePercentage(amount, percentage) {
    return amount.mul(percentage).div(100);
}

/**
 * Helper to check if two BigNumbers are approximately equal (within 1% difference)
 * @param {BigNumber} actual - Actual value
 * @param {BigNumber} expected - Expected value
 * @param {number} tolerance - Tolerance percentage (default 1%)
 * @returns {boolean} True if approximately equal
 */
function isApproximatelyEqual(actual, expected, tolerance = 1) {
    const diff = actual.sub(expected).abs();
    const maxDiff = expected.mul(tolerance).div(100);
    return diff.lte(maxDiff);
}

/**
 * Helper to create test addresses
 * @param {number} count - Number of addresses to create
 * @returns {Array} Array of test addresses
 */
function createTestAddresses(count) {
    const addresses = [];
    for (let i = 0; i < count; i++) {
        addresses.push(ethers.Wallet.createRandom().address);
    }
    return addresses;
}

/**
 * Helper to setup token balances for testing
 * @param {Object} token - Token contract
 * @param {Array} accounts - Array of accounts
 * @param {string} amount - Amount to mint per account
 */
async function setupTokenBalances(token, accounts, amount) {
    for (const account of accounts) {
        await token.mint(account.address, parseTokens(amount), 1);
    }
}

/**
 * Constants for testing
 */
const TEST_CONSTANTS = {
    ZERO_ADDRESS: ethers.ZeroAddress,
    MAX_UINT256: ethers.MaxUint256,
    ONE_ETHER: ethers.parseEther("1"),
    ONE_TOKEN: parseTokens("1"),
    ONE_DAY: 24 * 60 * 60,
    ONE_WEEK: 7 * 24 * 60 * 60,
    ONE_MONTH: 30 * 24 * 60 * 60,
    ONE_YEAR: 365 * 24 * 60 * 60
};

module.exports = {
    parseTokens,
    formatTokens,
    parseBNB,
    expectRevert,
    increaseTime,
    getLatestBlockTimestamp,
    mineBlocks,
    deployTestFixture,
    takeSnapshot,
    restoreSnapshot,
    getGasUsed,
    getBalanceChange,
    calculatePercentage,
    isApproximatelyEqual,
    createTestAddresses,
    setupTokenBalances,
    TEST_CONSTANTS
};
