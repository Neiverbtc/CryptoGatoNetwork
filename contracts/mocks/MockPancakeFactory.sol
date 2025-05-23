// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MockPancakeFactory
 * @dev Mock PancakeSwap Factory for testing purposes
 */
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