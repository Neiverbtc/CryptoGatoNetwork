const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture, time } = require("@nomicfoundation/hardhat-network-helpers");
const { deployTestFixture, parseTokens, expectRevert } = require("./helpers/test-helper");

describe("CryptoGatoPresale", function () {
    let cryptoGato, presale;
    let owner, treasury, addr1, addr2, addr3;
    let startTime, endTime;

    async function deployPresaleFixture() {
        const fixture = await deployTestFixture();
        
        // Deploy presale contract
        const CryptoGatoPresale = await ethers.getContractFactory("CryptoGatoPresale");
        const presale = await CryptoGatoPresale.deploy(fixture.treasury.address);
        
        // Add presale as minter to CryptoGato
        await fixture.cryptoGato.scheduleAddMinter(presale.address);
        await time.increase(24 * 60 * 60 + 1); // Fast forward past timelock
        await fixture.cryptoGato.executeAddMinter(presale.address);

        return {
            ...fixture,
            presale
        };
    }

    beforeEach(async function () {
        const fixture = await loadFixture(deployPresaleFixture);
        cryptoGato = fixture.cryptoGato;
        presale = fixture.presale;
        owner = fixture.owner;
        treasury = fixture.treasury;
        addr1 = fixture.addr1;
        addr2 = fixture.addr2;
        addr3 = fixture.addr3;

        // Set up presale parameters
        const now = await time.latest();
        startTime = now + 3600; // 1 hour from now
        endTime = startTime + (30 * 24 * 3600); // 30 days from start
    });

    describe("Deployment", function () {
        it("Should set the correct treasury wallet", async function () {
            expect(await presale.treasuryWallet()).to.equal(treasury.address);
        });

        it("Should not be initialized initially", async function () {
            expect(await presale.isInitialized()).to.be.false;
        });

        it("Should have default vesting configuration", async function () {
            const vestingConfig = await presale.vestingConfig();
            expect(vestingConfig.enabled).to.be.true;
            expect(vestingConfig.initialRelease).to.equal(2000); // 20%
            expect(vestingConfig.cliffPeriod).to.equal(30 * 24 * 3600); // 30 days
            expect(vestingConfig.vestingPeriod).to.equal(180 * 24 * 3600); // 180 days
        });
    });

    describe("Initialization", function () {
        it("Should initialize presale correctly", async function () {
            const maxTokens = parseTokens("3000000000"); // 3B tokens
            const whitelistPrice = "100000000000000"; // 0.0001 BNB per token
            const publicPrice = "120000000000000"; // 0.00012 BNB per token
            const minPurchase = parseTokens("1000"); // 1000 tokens
            const maxPurchase = parseTokens("50000"); // 50000 tokens

            await expect(presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            )).to.emit(presale, "PresaleInitialized");

            expect(await presale.isInitialized()).to.be.true;
            expect(await presale.cryptoGatoAddress()).to.equal(cryptoGato.address);
            expect(await presale.maxTokensToSell()).to.equal(maxTokens);
        });

        it("Should not allow double initialization", async function () {
            const maxTokens = parseTokens("3000000000");
            const whitelistPrice = "100000000000000";
            const publicPrice = "120000000000000";
            const minPurchase = parseTokens("1000");
            const maxPurchase = parseTokens("50000");

            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            );

            await expect(presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            )).to.be.revertedWith("CryptoGatoPresale: already initialized");
        });

        it("Should validate initialization parameters", async function () {
            const maxTokens = parseTokens("3000000000");
            const whitelistPrice = "100000000000000";
            const publicPrice = "120000000000000";
            const minPurchase = parseTokens("1000");
            const maxPurchase = parseTokens("50000");

            // Invalid token address
            await expect(presale.initialize(
                ethers.constants.AddressZero,
                maxTokens,
                startTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            )).to.be.revertedWith("CryptoGatoPresale: zero token address");

            // Invalid start time
            const pastTime = (await time.latest()) - 3600;
            await expect(presale.initialize(
                cryptoGato.address,
                maxTokens,
                pastTime,
                endTime,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            )).to.be.revertedWith("CryptoGatoPresale: invalid start time");

            // End time before start time
            await expect(presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                startTime - 3600,
                whitelistPrice,
                publicPrice,
                minPurchase,
                maxPurchase
            )).to.be.revertedWith("CryptoGatoPresale: invalid end time");
        });
    });

    describe("Whitelist Management", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );
        });

        it("Should add address to whitelist", async function () {
            await expect(presale.addToWhitelist(addr1.address))
                .to.emit(presale, "AddedToWhitelist")
                .withArgs(addr1.address);

            expect(await presale.whitelist(addr1.address)).to.be.true;
        });

        it("Should add multiple addresses to whitelist", async function () {
            const addresses = [addr1.address, addr2.address, addr3.address];
            
            await presale.addMultipleToWhitelist(addresses);

            for (const address of addresses) {
                expect(await presale.whitelist(address)).to.be.true;
            }
        });

        it("Should remove address from whitelist", async function () {
            await presale.addToWhitelist(addr1.address);
            
            await expect(presale.removeFromWhitelist(addr1.address))
                .to.emit(presale, "RemovedFromWhitelist")
                .withArgs(addr1.address);

            expect(await presale.whitelist(addr1.address)).to.be.false;
        });

        it("Should not allow non-owner to manage whitelist", async function () {
            await expect(presale.connect(addr1).addToWhitelist(addr2.address))
                .to.be.revertedWith("Ownable: caller is not the owner");
        });
    });

    describe("Phase Management", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );
        });

        it("Should change phase", async function () {
            await expect(presale.setPhase(1)) // WHITELIST
                .to.emit(presale, "PhaseChanged")
                .withArgs(1);

            expect(await presale.currentPhase()).to.equal(1);
        });

        it("Should not allow going back to setup phase", async function () {
            await presale.setPhase(1); // WHITELIST
            
            await expectRevert(
                presale.setPhase(0), // SETUP
                "CannotGoBackToSetup"
            );
        });

        it("Should end presale", async function () {
            await presale.setPhase(1); // WHITELIST
            
            await expect(presale.endPresale())
                .to.emit(presale, "PresaleEnded");

            expect(await presale.currentPhase()).to.equal(3); // ENDED
        });
    });

    describe("Token Purchase", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000", // 0.0001 BNB per token
                "120000000000000", // 0.00012 BNB per token
                parseTokens("1000"),
                parseTokens("50000")
            );

            // Add addr1 to whitelist
            await presale.addToWhitelist(addr1.address);
            
            // Set phase to WHITELIST and fast forward to start time
            await presale.setPhase(1);
            await time.increaseTo(startTime + 1);
        });

        it("Should allow whitelisted user to buy tokens", async function () {
            const bnbAmount = ethers.utils.parseEther("1"); // 1 BNB
            const expectedTokens = parseTokens("10000"); // 1 BNB / 0.0001 = 10000 tokens

            await expect(presale.connect(addr1).buyTokens({ value: bnbAmount }))
                .to.emit(presale, "TokensPurchased")
                .withArgs(addr1.address, bnbAmount, expectedTokens, 1);

            expect(await presale.tokensPurchased(addr1.address)).to.equal(expectedTokens);
            expect(await presale.totalTokensSold()).to.equal(expectedTokens);
        });

        it("Should not allow non-whitelisted user in whitelist phase", async function () {
            const bnbAmount = ethers.utils.parseEther("1");

            await expect(presale.connect(addr2).buyTokens({ value: bnbAmount }))
                .to.be.revertedWith("CryptoGatoPresale: not whitelisted");
        });

        it("Should enforce minimum purchase amount", async function () {
            const bnbAmount = ethers.utils.parseEther("0.01"); // Very small amount
            
            await expectRevert(
                presale.connect(addr1).buyTokens({ value: bnbAmount }),
                "InvalidPurchaseLimit"
            );
        });

        it("Should enforce maximum purchase amount per user", async function () {
            const bnbAmount = ethers.utils.parseEther("10"); // 100,000 tokens (above max)
            
            await expectRevert(
                presale.connect(addr1).buyTokens({ value: bnbAmount }),
                "InvalidPurchaseLimit"
            );
        });

        it("Should handle partial purchase when hitting max tokens", async function () {
            // Set max tokens to a small amount
            const smallMaxTokens = parseTokens("5000");
            
            // Deploy new presale with small max
            const CryptoGatoPresale = await ethers.getContractFactory("CryptoGatoPresale");
            const smallPresale = await CryptoGatoPresale.deploy(treasury.address);
            
            await cryptoGato.scheduleAddMinter(smallPresale.address);
            await time.increase(24 * 60 * 60 + 1);
            await cryptoGato.executeAddMinter(smallPresale.address);
            
            await smallPresale.initialize(
                cryptoGato.address,
                smallMaxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );
            
            await smallPresale.addToWhitelist(addr1.address);
            await smallPresale.setPhase(1);
            
            const bnbAmount = ethers.utils.parseEther("1"); // Would buy 10000 tokens
            const initialBalance = await addr1.getBalance();
            
            await smallPresale.connect(addr1).buyTokens({ value: bnbAmount });
            
            // Should only get 5000 tokens and receive refund
            expect(await smallPresale.tokensPurchased(addr1.address)).to.equal(smallMaxTokens);
            expect(await addr1.getBalance()).to.be.gt(initialBalance.sub(bnbAmount));
        });
    });

    describe("Vesting", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );

            await presale.addToWhitelist(addr1.address);
            await presale.setPhase(1);
            await time.increaseTo(startTime + 1);

            // Buy some tokens
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(addr1).buyTokens({ value: bnbAmount });
        });

        it("Should release initial tokens immediately", async function () {
            const expectedInitial = parseTokens("2000"); // 20% of 10000 tokens
            expect(await cryptoGato.balanceOf(addr1.address)).to.equal(expectedInitial);
        });

        it("Should not allow claiming before cliff period", async function () {
            await expectRevert(
                presale.connect(addr1).claimTokens(),
                "CliffPeriodNotPassed"
            );
        });

        it("Should allow claiming after cliff period", async function () {
            // Fast forward past cliff period
            await time.increase(30 * 24 * 3600 + 1); // 30 days + 1 second
            
            const claimableBefore = await presale.calculateVestedAmount(addr1.address);
            const balanceBefore = await cryptoGato.balanceOf(addr1.address);
            
            await expect(presale.connect(addr1).claimTokens())
                .to.emit(presale, "TokensClaimed");
            
            const balanceAfter = await cryptoGato.balanceOf(addr1.address);
            expect(balanceAfter).to.be.gt(balanceBefore);
        });

        it("Should calculate vested amount correctly", async function () {
            const totalTokens = parseTokens("10000");
            const initialRelease = parseTokens("2000"); // 20%
            
            // Before cliff
            let vested = await presale.calculateVestedAmount(addr1.address);
            expect(vested).to.equal(initialRelease);
            
            // After cliff, halfway through vesting
            await time.increase(30 * 24 * 3600 + 90 * 24 * 3600); // cliff + half vesting
            vested = await presale.calculateVestedAmount(addr1.address);
            expect(vested).to.be.gt(initialRelease);
            expect(vested).to.be.lt(totalTokens);
            
            // After full vesting
            await time.increase(90 * 24 * 3600); // rest of vesting period
            vested = await presale.calculateVestedAmount(addr1.address);
            expect(vested).to.equal(totalTokens);
        });

        it("Should allow custom vesting per user", async function () {
            // Set custom vesting for addr2: no cliff, immediate full release
            await presale.setUserVestingConfig(addr2.address, true, 10000, 0, 1);
            
            await presale.addToWhitelist(addr2.address);
            
            // addr2 buys tokens
            const bnbAmount = ethers.utils.parseEther("1");
            await presale.connect(addr2).buyTokens({ value: bnbAmount });
            
            // Should get all tokens immediately
            expect(await cryptoGato.balanceOf(addr2.address)).to.equal(parseTokens("10000"));
        });
    });

    describe("Administrative Functions", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );
        });

        it("Should update phase price", async function () {
            const newPrice = "150000000000000";
            
            await expect(presale.updatePhasePrice(1, newPrice))
                .to.emit(presale, "PriceUpdated")
                .withArgs(1, newPrice);

            expect(await presale.phasePrice(1)).to.equal(newPrice);
        });

        it("Should update vesting configuration", async function () {
            await expect(presale.updateVestingConfig(true, 3000, 7 * 24 * 3600, 90 * 24 * 3600))
                .to.emit(presale, "VestingConfigUpdated");

            const config = await presale.vestingConfig();
            expect(config.initialRelease).to.equal(3000);
            expect(config.cliffPeriod).to.equal(7 * 24 * 3600);
        });

        it("Should withdraw funds", async function () {
            // Send some BNB to presale contract
            await owner.sendTransaction({
                to: presale.address,
                value: ethers.utils.parseEther("1")
            });

            const initialBalance = await treasury.getBalance();
            
            await expect(presale.withdrawFunds(treasury.address, 0))
                .to.emit(presale, "FundsWithdrawn");

            const finalBalance = await treasury.getBalance();
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should pause and unpause", async function () {
            await expect(presale.pause())
                .to.emit(presale, "Paused");

            expect(await presale.paused()).to.be.true;

            await expect(presale.unpause())
                .to.emit(presale, "Unpaused");

            expect(await presale.paused()).to.be.false;
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            const maxTokens = parseTokens("3000000000");
            await presale.initialize(
                cryptoGato.address,
                maxTokens,
                startTime,
                endTime,
                "100000000000000",
                "120000000000000",
                parseTokens("1000"),
                parseTokens("50000")
            );
        });

        it("Should return presale info", async function () {
            const info = await presale.getPresaleInfo();
            expect(info._isInitialized).to.be.true;
            expect(info._maxTokensToSell).to.equal(parseTokens("3000000000"));
        });

        it("Should calculate token amount correctly", async function () {
            const bnbAmount = ethers.utils.parseEther("1");
            const expectedTokens = parseTokens("10000"); // 1 BNB / 0.0001 = 10000 tokens
            
            const calculatedTokens = await presale.calculateTokenAmount(bnbAmount);
            expect(calculatedTokens).to.equal(expectedTokens);
        });

        it("Should calculate BNB amount correctly", async function () {
            const tokenAmount = parseTokens("10000");
            const expectedBnb = ethers.utils.parseEther("1"); // 10000 * 0.0001 = 1 BNB
            
            const calculatedBnb = await presale.calculateBNBAmount(tokenAmount);
            expect(calculatedBnb).to.equal(expectedBnb);
        });

        it("Should check if presale is active", async function () {
            expect(await presale.isPresaleActive()).to.be.false; // SETUP phase
            
            await presale.setPhase(1); // WHITELIST
            await time.increaseTo(startTime + 1);
            
            expect(await presale.isPresaleActive()).to.be.true;
        });
    });
});
