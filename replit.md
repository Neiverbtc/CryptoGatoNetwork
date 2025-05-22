# CryptoGato Token Project

## Overview

CryptoGato is a comprehensive BEP-20/ERC-20 token ecosystem built on Binance Smart Chain (BSC) featuring advanced DeFi capabilities including category-based token distribution, anti-whale protection, automatic liquidity fees, and presale functionality with vesting mechanisms.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Core Technology Stack
- **Blockchain Platform**: Binance Smart Chain (BSC)
- **Development Framework**: Hardhat
- **Smart Contract Language**: Solidity ^0.8.20
- **Testing Framework**: Chai with Hardhat toolbox
- **Code Quality**: Solhint for linting, Prettier for formatting

### Smart Contract Architecture
The project follows a modular architecture with three main contract components:

1. **CryptoGato.sol** - Main token contract with advanced features
2. **CryptoGatoPresale.sol** - Presale management with phased distribution
3. **CGATOLiquidityConnector.sol** - Multi-DEX liquidity management

## Key Components

### 1. CryptoGato Token Contract
- **Token Standard**: BEP-20/ERC-20 compatible
- **Total Supply**: 10 billion CGATO tokens
- **Decimals**: 18
- **Distribution Categories**:
  - Presale: 30%
  - Liquidity: 25%
  - Team/Marketing: 20%
  - Exchanges: 15%
  - Ecosystem: 5%
  - Strategic Reserve: 5%

### 2. Presale Contract
- **Multi-phase System**: Setup, Whitelist, Public, Ended
- **Vesting Mechanism**: Gradual token release
- **Purchase Limits**: Configurable min/max amounts
- **Access Control**: Whitelist functionality for early phases

### 3. Liquidity Connector
- **Multi-DEX Support**: PancakeSwap, Biswap, ApeSwap integration
- **Liquidity Distribution**: Automated allocation across DEXs
- **Route Optimization**: Best price discovery across platforms

### 4. Security Features
- **Anti-whale Protection**: Maximum transaction and wallet limits
- **Timelock Mechanism**: Delayed execution for critical operations
- **Pausable Functions**: Emergency stop functionality
- **Reentrancy Guards**: Protection against reentrancy attacks

## Data Flow

### Token Distribution Flow
1. **Minting**: Only authorized minters can create tokens within category limits
2. **Category Tracking**: Each mint operation is tracked by category
3. **Supply Validation**: Enforces maximum supply of 10 billion tokens
4. **Limit Enforcement**: Anti-whale limits applied to regular transfers

### Presale Flow
1. **Initialization**: Owner configures presale parameters
2. **Phase Management**: Automatic progression through presale phases
3. **Purchase Processing**: BNB collection and token allocation
4. **Vesting Release**: Gradual token unlock based on schedule

### Liquidity Management Flow
1. **DEX Registration**: Multiple DEX routers registered with allocation percentages
2. **Liquidity Distribution**: Automated splitting across registered DEXs
3. **Route Optimization**: Best price discovery for swaps

## External Dependencies

### Blockchain Infrastructure
- **BSC Mainnet/Testnet**: Primary deployment networks
- **PancakeSwap Router**: 0x10ED43C718714eb63d5aA57B78B54704E256024E (mainnet)
- **WBNB Contract**: Native token wrapping for liquidity pairs

### Development Dependencies
- **OpenZeppelin Contracts**: Security-audited contract libraries
- **Hardhat Toolbox**: Comprehensive development environment
- **Ethers.js**: Blockchain interaction library
- **Solidity Coverage**: Code coverage analysis

### API Integrations
- **BSCScan API**: Contract verification
- **CoinMarketCap API**: Price data (configured but not actively used in contracts)
- **Infura**: Alternative RPC provider

## Deployment Strategy

### Network Configuration
- **Local Development**: Hardhat network with 10 funded accounts
- **Testnet Deployment**: BSC Testnet for testing
- **Mainnet Deployment**: BSC Mainnet for production

### Deployment Sequence
1. **CryptoGato Token**: Deploy main token contract first
2. **Presale Contract**: Deploy and configure presale parameters
3. **Liquidity Connector**: Deploy and register DEX integrations
4. **Permission Setup**: Grant minter rights to presale contract
5. **Contract Verification**: Verify all contracts on BSCScan

### Security Considerations
- **Private Key Management**: Environment variables for secure key storage
- **Timelock Operations**: Critical functions require 24-hour delay
- **Multi-signature Support**: Ready for multi-sig wallet integration
- **Gas Optimization**: Compiler optimization enabled for cost efficiency

### Testing Strategy
- **Unit Tests**: Comprehensive test coverage for all contracts
- **Integration Tests**: Multi-contract interaction testing
- **Gas Reporting**: Automated gas usage analysis
- **Coverage Analysis**: Code coverage tracking for quality assurance

The architecture prioritizes security, modularity, and scalability while maintaining compatibility with the broader BSC DeFi ecosystem. The modular design allows for future upgrades and feature additions without compromising the core token functionality.