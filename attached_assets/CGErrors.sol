// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Biblioteca de Errores de CryptoGato
 * @dev Contiene todos los errores personalizados utilizados en los contratos CryptoGato
 */
library CGErrors {
    // ================= ERRORES GENERALES =================
    error Unauthorized();
    error ZeroAddress();
    error InvalidAmount();
    error OperationFailed();
    
    // ================= ERRORES DE TOKEN =================
    error NotMinter(address caller);
    error InvalidCategory(uint8 category);
    error ExceedsMaxSupply(uint256 requested, uint256 maxSupply);
    error ExceedsCategoryLimit(uint8 category, uint256 requested, uint256 limit);
    error MaxTxAmountExceeded(uint256 amount, uint256 maxAmount);
    error MaxWalletAmountExceeded(uint256 newBalance, uint256 maxAmount);
    error TradingNotEnabled();
    error FeeExceedsMax(uint256 fee);
    error ThresholdTooLow();
    error InvalidSlippage(uint256 slippage);
    error OperationNotScheduled(bytes32 operationId);
    error TimelockNotExpired(bytes32 operationId, uint256 unlockTime);
    error SwapFailed(uint256 amount);
    error TransferFailed(address token, address to, uint256 amount);
    error InsufficientBalance(uint256 requested, uint256 available);
    error NotThisContract();
    
    // ================= ERRORES DE PREVENTA =================
    error NotInitialized();
    error AlreadyInitialized();
    error InvalidTokenAddress();
    error InvalidMaxTokens(uint256 tokens);
    error InvalidStartTime(uint256 startTime);
    error InvalidEndTime(uint256 startTime, uint256 endTime);
    error InvalidPrice(uint256 price);
    error PriceTooLow(uint256 price, uint256 minPrice);
    error PriceTooHigh(uint256 price, uint256 maxPrice);
    error InvalidPurchaseLimit(uint256 min, uint256 max);
    error ExceedsAvailableTokens(uint256 requested, uint256 available);
    error PresaleNotActive();
    error PresaleEnded();
    error NotStarted();
    error SoldOut();
    error NotWhitelisted(address user);
    error BatchTooLarge(uint256 size, uint256 maxSize);
    error InvalidPhase(uint8 phase);
    error CannotGoBackToSetup();
    error AlreadyEnded();
    error PresaleNotEnded();
    error InvalidVestingConfig(uint256 initialRelease, uint256 vestingPeriod);
    error NoTokensToClaim();
    error AllTokensClaimed();
    error CliffPeriodNotPassed(uint256 purchaseTime, uint256 cliffEnd);
    error NoTokensToClaimNow();
    error RefundFailed(address user, uint256 amount);
    error FailedToSendBNB(address to, uint256 amount);
    
    // ================= ERRORES DE CONECTOR DE LIQUIDEZ =================
    error DEXAlreadyRegistered(address router);
    error DEXNotRegistered(address router);
    error InvalidLiquidityShare(uint256 totalShare);
    error NoDEXRegistered();
    error NoValidRouteFound();
}