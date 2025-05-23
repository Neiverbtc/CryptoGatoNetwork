const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployTestFixture, parseTokens, expectRevert } = require("./helpers/test-helper");

describe("CryptoGato Token", function () {
    let cryptoGato;
    let owner, addr1, addr2, addr3;
    let mockRouter;

    beforeEach(async function () {
        const fixture = await loadFixture(deployTestFixture);
        cryptoGato = fixture.cryptoGato;
        owner = fixture.owner;
        addr1 = fixture.addr1;
        addr2 = fixture.addr2;
        addr3 = fixture.addr3;
        mockRouter = fixture.mockRouter;
    });

    describe("Deployment", function () {
        it("Should set the correct name and symbol", async function () {
            expect(await cryptoGato.name()).to.equal("CryptoGato");
            expect(await cryptoGato.symbol()).to.equal("CGATO");
        });

        it("Should set the correct decimals", async function () {
            expect(await cryptoGato.decimals()).to.equal(18);
        });

        it("Should set the correct max supply", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            expect(maxSupply).to.equal(parseTokens("10000000000")); // 10 billion
        });

        it("Should set the owner as initial minter", async function () {
            expect(await cryptoGato.isMinter(owner.address)).to.be.true;
        });

        it("Should configure category percentages correctly", async function () {
            expect(await cryptoGato.categoryPercentages(1)).to.equal(300); // 30% Presale
            expect(await cryptoGato.categoryPercentages(2)).to.equal(250); // 25% Liquidity
            expect(await cryptoGato.categoryPercentages(3)).to.equal(200); // 20% Team/Marketing
            expect(await cryptoGato.categoryPercentages(4)).to.equal(150); // 15% Exchanges
            expect(await cryptoGato.categoryPercentages(5)).to.equal(50);  // 5% Ecosystem
            expect(await cryptoGato.categoryPercentages(6)).to.equal(50);  // 5% Strategic
        });

        it("Should set initial limits correctly", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            expect(await cryptoGato.maxTxAmount()).to.equal(maxSupply * 5n / 1000n); // 0.5%
            expect(await cryptoGato.maxWalletAmount()).to.equal(maxSupply * 20n / 1000n); // 2%
        });
    });

    describe("Minting", function () {
        it("Should allow owner to mint tokens in valid category", async function () {
            const amount = parseTokens("1000000"); // 1M tokens
            const category = 1; // Presale

            await expect(cryptoGato.mint(addr1.address, amount, category))
                .to.emit(cryptoGato, "TokensMinted")
                .withArgs(addr1.address, amount, category);

            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(amount);
            expect(await cryptoGato.categoryMinted(category)).to.equal(amount);
        });

        it("Should not allow non-minter to mint", async function () {
            const amount = parseTokens("1000000");
            const category = 1;

            await expectRevert(
                cryptoGato.connect(addr1).mint(addr2.address, amount, category),
                "NotMinter"
            );
        });

        it("Should not allow minting in invalid category", async function () {
            const amount = parseTokens("1000000");
            const category = 0; // CATEGORY_NONE

            await expectRevert(
                cryptoGato.mint(addr1.address, amount, category),
                "InvalidCategory"
            );
        });

        it("Should not exceed category limits", async function () {
            const category = 1; // Presale - 30% of max supply
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            const categoryLimit = maxSupply * 300n / 1000n;
            const excessAmount = categoryLimit + 1n;

            await expectRevert(
                cryptoGato.mint(addr1.address, excessAmount, category),
                "ExceedsCategoryLimit"
            );
        });

        it("Should not exceed max supply", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            const excessAmount = maxSupply + 1n;

            await expectRevert(
                cryptoGato.mint(addr1.address, excessAmount, 1),
                "ExceedsMaxSupply"
            );
        });
    });

    describe("Minter Management", function () {
        it("Should schedule and execute minter addition with timelock", async function () {
            // Schedule minter addition
            await expect(cryptoGato.scheduleAddMinter(addr1.address))
                .to.emit(cryptoGato, "TimelockOperationScheduled");

            // Should not be minter yet
            expect(await cryptoGato.isMinter(addr1.address)).to.be.false;

            // Fast forward time past timelock
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]); // 24 hours + 1 second
            await ethers.provider.send("evm_mine");

            // Execute minter addition
            await expect(cryptoGato.executeAddMinter(addr1.address))
                .to.emit(cryptoGato, "MinterAdded")
                .withArgs(addr1.address);

            expect(await cryptoGato.isMinter(addr1.address)).to.be.true;
        });

        it("Should not allow executing minter addition before timelock", async function () {
            await cryptoGato.scheduleAddMinter(addr1.address);

            await expectRevert(
                cryptoGato.executeAddMinter(addr1.address),
                "TimelockNotExpired"
            );
        });

        it("Should allow immediate minter removal", async function () {
            // First add a minter
            await cryptoGato.scheduleAddMinter(addr1.address);
            await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
            await ethers.provider.send("evm_mine");
            await cryptoGato.executeAddMinter(addr1.address);

            // Remove minter
            await expect(cryptoGato.removeMinter(addr1.address))
                .to.emit(cryptoGato, "MinterRemoved")
                .withArgs(addr1.address);

            expect(await cryptoGato.isMinter(addr1.address)).to.be.false;
        });
    });

    describe("Burning", function () {
        beforeEach(async function () {
            // Mint some tokens first
            await cryptoGato.mint(addr1.address, parseTokens("1000000"), 1);
        });

        it("Should allow token burning", async function () {
            const burnAmount = parseTokens("100000");
            const initialBalance = await cryptoGato.balanceOf(addr1.address);

            await expect(cryptoGato.connect(addr1).burn(burnAmount))
                .to.emit(cryptoGato, "TokensBurned")
                .withArgs(addr1.address, burnAmount);

            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
        });

        it("Should allow burning from with allowance", async function () {
            const burnAmount = parseTokens("100000");
            
            // Approve addr2 to burn tokens from addr1
            await cryptoGato.connect(addr1).approve(addr2.address, burnAmount);

            await expect(cryptoGato.connect(addr2).burnFrom(addr1.address, burnAmount))
                .to.emit(cryptoGato, "TokensBurned")
                .withArgs(addr1.address, burnAmount);
        });

        it("Should not allow burning more than balance", async function () {
            const balance = await cryptoGato.balanceOf(addr1.address);
            const excessAmount = balance + 1n;

            await expectRevert(
                cryptoGato.connect(addr1).burn(excessAmount),
                "InsufficientBalance"
            );
        });
    });

    describe("Token Transfers", function () {
        beforeEach(async function () {
            // Mint some tokens 
            await cryptoGato.mint(owner.address, parseTokens("1000000"), 1);
        });

        it("Should allow basic token transfers", async function () {
            const transferAmount = parseTokens("1000");
            
            await expect(cryptoGato.transfer(addr1.address, transferAmount))
                .to.emit(cryptoGato, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);
                
            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(transferAmount);
        });

        it("Should handle approve and transferFrom", async function () {
            const amount = parseTokens("500");
            
            // Approve
            await expect(cryptoGato.approve(addr1.address, amount))
                .to.emit(cryptoGato, "Approval")
                .withArgs(owner.address, addr1.address, amount);
                
            // TransferFrom
            await expect(cryptoGato.connect(addr1).transferFrom(owner.address, addr2.address, amount))
                .to.emit(cryptoGato, "Transfer")
                .withArgs(owner.address, addr2.address, amount);
                
            expect(await cryptoGato.balanceOf(addr2.address)).to.equal(amount);
        });
    });

    describe("Fees and Liquidity", function () {
        beforeEach(async function () {
            await cryptoGato.mint(owner.address, parseTokens("1000000"), 1);
            await cryptoGato.enableTrading();
        });

        it("Should update liquidity fee", async function () {
            const newFee = 300; // 3%

            await expect(cryptoGato.updateLiquidityFee(newFee))
                .to.emit(cryptoGato, "LiquidityFeeUpdated")
                .withArgs(newFee);

            expect(await cryptoGato.liquidityFee()).to.equal(newFee);
        });

        it("Should not allow fee above maximum", async function () {
            const excessiveFee = 1001; // 10.01%

            await expectRevert(
                cryptoGato.updateLiquidityFee(excessiveFee),
                "FeeExceedsMax"
            );
        });

        it("Should update swap threshold", async function () {
            const newThreshold = parseTokens("10000000");

            await expect(cryptoGato.updateSwapThreshold(newThreshold))
                .to.emit(cryptoGato, "SwapThresholdUpdated")
                .withArgs(newThreshold);

            expect(await cryptoGato.swapThreshold()).to.equal(newThreshold);
        });
    });

    describe("Pause Functionality", function () {
        it("Should allow owner to pause and unpause", async function () {
            await expect(cryptoGato.pause())
                .to.emit(cryptoGato, "ContractPaused")
                .withArgs(owner.address);

            expect(await cryptoGato.paused()).to.be.true;

            await expect(cryptoGato.unpause())
                .to.emit(cryptoGato, "ContractUnpaused")
                .withArgs(owner.address);

            expect(await cryptoGato.paused()).to.be.false;
        });

        it("Should prevent minting when paused", async function () {
            await cryptoGato.pause();

            await expectRevert(
                cryptoGato.mint(addr1.address, parseTokens("1000"), 1),
                "Pausable: paused"
            );
        });
    });

    describe("Category Information", function () {
        it("Should return correct category limits", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            
            for (let category = 1; category <= 6; category++) {
                const percentage = await cryptoGato.categoryPercentages(category);
                const expectedLimit = maxSupply * BigInt(percentage) / 1000n;
                const actualLimit = await cryptoGato.getCategoryLimit(category);
                
                expect(actualLimit).to.equal(expectedLimit);
            }
        });

        it("Should return correct available amounts", async function () {
            const category = 1;
            const mintAmount = parseTokens("1000000");
            
            const initialAvailable = await cryptoGato.getCategoryAvailable(category);
            
            await cryptoGato.mint(addr1.address, mintAmount, category);
            
            const finalAvailable = await cryptoGato.getCategoryAvailable(category);
            expect(finalAvailable).to.equal(initialAvailable - mintAmount);
        });

        it("Should handle category queries correctly", async function () {
            // Test that we can query individual categories
            for (let category = 1; category <= 6; category++) {
                const percentage = await cryptoGato.categoryPercentages(category);
                expect(percentage).to.be.greaterThan(0);
                
                const limit = await cryptoGato.getCategoryLimit(category);
                expect(limit).to.be.greaterThan(0);
                
                const available = await cryptoGato.getCategoryAvailable(category);
                expect(available).to.be.greaterThanOrEqual(0);
            }
        });
    });

    describe("Rescue Functions", function () {
        it("Should allow rescuing BNB", async function () {
            // Send some BNB to the contract
            await owner.sendTransaction({
                to: await cryptoGato.getAddress(),
                value: ethers.parseEther("1")
            });

            const initialBalance = await ethers.provider.getBalance(owner.address);
            
            await expect(cryptoGato.rescueBNB(owner.address))
                .to.emit(cryptoGato, "BNBRescued");

            const finalBalance = await owner.getBalance();
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should not allow rescuing own tokens", async function () {
            await expectRevert(
                cryptoGato.rescueTokens(cryptoGato.address, owner.address),
                "NotThisContract"
            );
        });
    });

    describe("Access Control", function () {
        it("Should only allow owner to call restricted functions", async function () {
            await expectRevert(
                cryptoGato.connect(addr1).updateMaxTxAmount(parseTokens("1000")),
                "Ownable: caller is not the owner"
            );

            await expectRevert(
                cryptoGato.connect(addr1).enableTrading(),
                "Ownable: caller is not the owner"
            );

            await expectRevert(
                cryptoGato.connect(addr1).pause(),
                "Ownable: caller is not the owner"
            );
        });
    });
});
