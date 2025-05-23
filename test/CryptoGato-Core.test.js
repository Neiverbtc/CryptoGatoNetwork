const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { expect } = require("chai");
const { ethers } = require("hardhat");
const { deployTestFixture, parseTokens, expectRevert } = require("./helpers/test-helper");

describe("CryptoGato Token - Core Functionality", function () {
    let cryptoGato;
    let owner, addr1, addr2, addr3;

    beforeEach(async function () {
        const fixture = await loadFixture(deployTestFixture);
        cryptoGato = fixture.cryptoGato;
        owner = fixture.owner;
        addr1 = fixture.addr1;
        addr2 = fixture.addr2;
        addr3 = fixture.addr3;
    });

    describe("Token Basics", function () {
        it("Should have correct name and symbol", async function () {
            expect(await cryptoGato.name()).to.equal("CryptoGato");
            expect(await cryptoGato.symbol()).to.equal("CGATO");
        });

        it("Should have 18 decimals", async function () {
            expect(await cryptoGato.decimals()).to.equal(18);
        });

        it("Should have correct max supply", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            expect(maxSupply).to.equal(parseTokens("10000000000")); // 10 billion
        });

        it("Should set owner as initial minter", async function () {
            expect(await cryptoGato.isMinter(owner.address)).to.be.true;
        });
    });

    describe("Category System", function () {
        it("Should configure category percentages correctly", async function () {
            expect(await cryptoGato.categoryPercentages(1)).to.equal(300); // 30% Presale
            expect(await cryptoGato.categoryPercentages(2)).to.equal(250); // 25% Liquidity
            expect(await cryptoGato.categoryPercentages(3)).to.equal(200); // 20% Team/Marketing
            expect(await cryptoGato.categoryPercentages(4)).to.equal(150); // 15% Exchanges
            expect(await cryptoGato.categoryPercentages(5)).to.equal(50);  // 5% Ecosystem
            expect(await cryptoGato.categoryPercentages(6)).to.equal(50);  // 5% Strategic
        });

        it("Should return correct category limits", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            
            for (let category = 1; category <= 6; category++) {
                const percentage = await cryptoGato.categoryPercentages(category);
                const expectedLimit = maxSupply * BigInt(percentage) / 1000n;
                const actualLimit = await cryptoGato.getCategoryLimit(category);
                
                expect(actualLimit).to.equal(expectedLimit);
            }
        });

        it("Should track category availability correctly", async function () {
            const category = 1;
            const mintAmount = parseTokens("1000000");
            const initialAvailable = await cryptoGato.getCategoryAvailable(category);
            
            await cryptoGato.mint(addr1.address, mintAmount, category);
            
            const finalAvailable = await cryptoGato.getCategoryAvailable(category);
            expect(finalAvailable).to.equal(initialAvailable - mintAmount);
        });
    });

    describe("Minting System", function () {
        it("Should allow authorized minter to mint tokens", async function () {
            const mintAmount = parseTokens("1000000");
            const category = 1; // Presale

            await expect(cryptoGato.mint(addr1.address, mintAmount, category))
                .to.emit(cryptoGato, "TokensMinted")
                .withArgs(addr1.address, mintAmount, category);

            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(mintAmount);
            expect(await cryptoGato.categoryMinted(category)).to.equal(mintAmount);
        });

        it("Should not allow non-minter to mint", async function () {
            const mintAmount = parseTokens("1000000");

            await expectRevert(
                cryptoGato.connect(addr1).mint(addr2.address, mintAmount, 1),
                "NotAuthorizedMinter"
            );
        });

        it("Should not allow minting in invalid category", async function () {
            const mintAmount = parseTokens("1000000");

            await expectRevert(
                cryptoGato.mint(addr1.address, mintAmount, 0),
                "InvalidCategory"
            );

            await expectRevert(
                cryptoGato.mint(addr1.address, mintAmount, 7),
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

    describe("Token Operations", function () {
        beforeEach(async function () {
            await cryptoGato.mint(owner.address, parseTokens("1000000"), 1);
        });

        it("Should allow basic transfers", async function () {
            const transferAmount = parseTokens("1000");
            
            await expect(cryptoGato.transfer(addr1.address, transferAmount))
                .to.emit(cryptoGato, "Transfer")
                .withArgs(owner.address, addr1.address, transferAmount);
                
            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(transferAmount);
        });

        it("Should handle approve and transferFrom", async function () {
            const amount = parseTokens("500");
            
            await expect(cryptoGato.approve(addr1.address, amount))
                .to.emit(cryptoGato, "Approval")
                .withArgs(owner.address, addr1.address, amount);
                
            await expect(cryptoGato.connect(addr1).transferFrom(owner.address, addr2.address, amount))
                .to.emit(cryptoGato, "Transfer")
                .withArgs(owner.address, addr2.address, amount);
                
            expect(await cryptoGato.balanceOf(addr2.address)).to.equal(amount);
        });

        it("Should allow token burning", async function () {
            await cryptoGato.mint(addr1.address, parseTokens("500000"), 1);
            
            const burnAmount = parseTokens("100000");
            const initialBalance = await cryptoGato.balanceOf(addr1.address);

            await expect(cryptoGato.connect(addr1).burn(burnAmount))
                .to.emit(cryptoGato, "TokensBurned")
                .withArgs(addr1.address, burnAmount);

            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(initialBalance - burnAmount);
        });
    });

    describe("Access Control", function () {
        it("Should allow owner to manage minters", async function () {
            const timelock = 24 * 60 * 60; // 24 hours
            
            // Schedule minter addition
            await expect(cryptoGato.scheduleMinterAddition(addr1.address, timelock))
                .to.emit(cryptoGato, "MinterAdditionScheduled")
                .withArgs(addr1.address, timelock);

            // Fast forward time and execute
            await ethers.provider.send("evm_increaseTime", [timelock + 1]);
            await ethers.provider.send("evm_mine");

            await expect(cryptoGato.executeMinterAddition(addr1.address))
                .to.emit(cryptoGato, "MinterAdded")
                .withArgs(addr1.address);

            expect(await cryptoGato.isMinter(addr1.address)).to.be.true;
        });

        it("Should allow immediate minter removal", async function () {
            // First add a minter
            await cryptoGato.scheduleMinterAddition(addr1.address, 0);
            await cryptoGato.executeMinterAddition(addr1.address);
            
            // Then remove it
            await expect(cryptoGato.removeMinter(addr1.address))
                .to.emit(cryptoGato, "MinterRemoved")
                .withArgs(addr1.address);

            expect(await cryptoGato.isMinter(addr1.address)).to.be.false;
        });

        it("Should allow owner to pause and unpause", async function () {
            await expect(cryptoGato.pause())
                .to.emit(cryptoGato, "Paused")
                .withArgs(owner.address);

            expect(await cryptoGato.paused()).to.be.true;

            await expect(cryptoGato.unpause())
                .to.emit(cryptoGato, "Unpaused")
                .withArgs(owner.address);

            expect(await cryptoGato.paused()).to.be.false;
        });
    });

    describe("Supply Tracking", function () {
        it("Should track total supply correctly", async function () {
            const initialSupply = await cryptoGato.totalSupply();
            const mintAmount = parseTokens("1000000");
            
            await cryptoGato.mint(owner.address, mintAmount, 1);
            
            expect(await cryptoGato.totalSupply()).to.equal(initialSupply + mintAmount);
        });

        it("Should respect anti-whale limits", async function () {
            const maxSupply = await cryptoGato.MAX_SUPPLY();
            expect(await cryptoGato.maxTxAmount()).to.equal(maxSupply * 5n / 1000n); // 0.5%
            expect(await cryptoGato.maxWalletAmount()).to.equal(maxSupply * 20n / 1000n); // 2%
        });
    });
});