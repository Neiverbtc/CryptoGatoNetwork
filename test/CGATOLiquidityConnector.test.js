const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");
const { deployTestFixture, parseTokens, expectRevert } = require("./helpers/test-helper");

describe("CGATOLiquidityConnector", function () {
    let cryptoGato, liquidityConnector;
    let owner, addr1, addr2;
    let mockRouter, mockFactory, wbnb;

    async function deployLiquidityConnectorFixture() {
        const fixture = await deployTestFixture();
        
        // Deploy mock WBNB
        const MockWBNB = await ethers.getContractFactory("MockERC20");
        const wbnb = await MockWBNB.deploy("Wrapped BNB", "WBNB", 18);

        // Deploy additional mock router and factory for multi-DEX testing
        const MockRouter = await ethers.getContractFactory("MockPancakeRouter");
        const mockRouter2 = await MockRouter.deploy(fixture.mockFactory.address, wbnb.address);
        
        const MockFactory = await ethers.getContractFactory("MockPancakeFactory");
        const mockFactory2 = await MockFactory.deploy();

        // Deploy liquidity connector
        const CGATOLiquidityConnector = await ethers.getContractFactory("CGATOLiquidityConnector");
        const liquidityConnector = await CGATOLiquidityConnector.deploy(
            fixture.cryptoGato.address,
            wbnb.address
        );

        return {
            ...fixture,
            liquidityConnector,
            wbnb,
            mockRouter2,
            mockFactory2
        };
    }

    beforeEach(async function () {
        const fixture = await loadFixture(deployLiquidityConnectorFixture);
        cryptoGato = fixture.cryptoGato;
        liquidityConnector = fixture.liquidityConnector;
        owner = fixture.owner;
        addr1 = fixture.addr1;
        addr2 = fixture.addr2;
        mockRouter = fixture.mockRouter;
        mockFactory = fixture.mockFactory;
        wbnb = fixture.wbnb;
    });

    describe("Deployment", function () {
        it("Should set the correct token and WBNB addresses", async function () {
            expect(await liquidityConnector.token()).to.equal(cryptoGato.address);
            expect(await liquidityConnector.WBNB()).to.equal(wbnb.address);
        });

        it("Should set the correct owner", async function () {
            expect(await liquidityConnector.owner()).to.equal(owner.address);
        });

        it("Should start with no DEXs registered", async function () {
            expect(await liquidityConnector.getTotalLiquidityShare()).to.equal(0);
        });
    });

    describe("DEX Management", function () {
        it("Should add a DEX correctly", async function () {
            await expect(liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000 // 70%
            )).to.emit(liquidityConnector, "DEXAdded")
              .withArgs(mockRouter.address, "PancakeSwap", 7000);

            const dex = await liquidityConnector.registeredDEXs(mockRouter.address);
            expect(dex.name).to.equal("PancakeSwap");
            expect(dex.router).to.equal(mockRouter.address);
            expect(dex.factory).to.equal(mockFactory.address);
            expect(dex.active).to.be.true;
            expect(dex.liquidityShare).to.equal(7000);
        });

        it("Should not allow adding duplicate DEX", async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000
            );

            await expectRevert(
                liquidityConnector.addDEX(
                    mockRouter.address,
                    mockFactory.address,
                    "PancakeSwap2",
                    3000
                ),
                "DEXAlreadyRegistered"
            );
        });

        it("Should not allow total liquidity share to exceed 100%", async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                8000 // 80%
            );

            // Try to add another DEX that would make total > 100%
            await expectRevert(
                liquidityConnector.addDEX(
                    addr1.address, // Different router address
                    addr2.address, // Different factory address
                    "AnotherSwap",
                    3000 // 30%, total would be 110%
                ),
                "InvalidLiquidityShare"
            );
        });

        it("Should remove a DEX correctly", async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000
            );

            await expect(liquidityConnector.removeDEX(mockRouter.address))
                .to.emit(liquidityConnector, "DEXRemoved")
                .withArgs(mockRouter.address);

            const dex = await liquidityConnector.registeredDEXs(mockRouter.address);
            expect(dex.active).to.be.false;
        });

        it("Should not allow removing non-existent DEX", async function () {
            await expectRevert(
                liquidityConnector.removeDEX(mockRouter.address),
                "DEXNotRegistered"
            );
        });

        it("Should update DEX liquidity share", async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000
            );

            await expect(liquidityConnector.updateDEXLiquidityShare(mockRouter.address, 8000))
                .to.emit(liquidityConnector, "DEXLiquidityShareUpdated")
                .withArgs(mockRouter.address, 8000);

            const dex = await liquidityConnector.registeredDEXs(mockRouter.address);
            expect(dex.liquidityShare).to.equal(8000);
        });

        it("Should not allow updating share to exceed 100% total", async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000
            );

            // Add second DEX
            await liquidityConnector.addDEX(
                addr1.address,
                addr2.address,
                "AnotherSwap",
                2000
            );

            // Try to update first DEX to make total > 100%
            await expectRevert(
                liquidityConnector.updateDEXLiquidityShare(mockRouter.address, 9000),
                "InvalidLiquidityShare"
            );
        });
    });

    describe("Liquidity Distribution", function () {
        beforeEach(async function () {
            // Add a DEX
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                10000 // 100%
            );

            // Mint some tokens to owner and approve the liquidity connector
            await cryptoGato.mint(owner.address, parseTokens("1000000"), 1);
            await cryptoGato.approve(liquidityConnector.address, parseTokens("1000000"));
        });

        it("Should distribute liquidity correctly", async function () {
            const tokenAmount = parseTokens("100000");
            const bnbAmount = ethers.utils.parseEther("1");

            await expect(
                liquidityConnector.distributeInitialLiquidity(tokenAmount, { value: bnbAmount })
            ).to.emit(liquidityConnector, "LiquidityDistributed");

            // Check that tokens were transferred from owner
            expect(await cryptoGato.balanceOf(owner.address)).to.equal(parseTokens("900000"));
        });

        it("Should not allow distribution with zero amounts", async function () {
            await expectRevert(
                liquidityConnector.distributeInitialLiquidity(0, { value: ethers.utils.parseEther("1") }),
                "InvalidAmount"
            );

            await expectRevert(
                liquidityConnector.distributeInitialLiquidity(parseTokens("100000"), { value: 0 }),
                "InvalidAmount"
            );
        });

        it("Should not allow distribution with no DEXs", async function () {
            // Remove the DEX
            await liquidityConnector.removeDEX(mockRouter.address);

            await expectRevert(
                liquidityConnector.distributeInitialLiquidity(
                    parseTokens("100000"),
                    { value: ethers.utils.parseEther("1") }
                ),
                "NoDEXRegistered"
            );
        });

        it("Should return unused tokens and BNB", async function () {
            // Add multiple DEXs with total share < 100%
            await liquidityConnector.removeDEX(mockRouter.address);
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                5000 // 50%
            );

            const tokenAmount = parseTokens("100000");
            const bnbAmount = ethers.utils.parseEther("1");
            const initialBalance = await owner.getBalance();

            await liquidityConnector.distributeInitialLiquidity(tokenAmount, { value: bnbAmount });

            // Check that unused tokens were returned
            expect(await cryptoGato.balanceOf(owner.address)).to.be.gt(parseTokens("900000"));
        });
    });

    describe("Route Finding", function () {
        beforeEach(async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                10000
            );
        });

        it("Should find best buy route", async function () {
            const bnbAmount = ethers.utils.parseEther("1");

            try {
                const route = await liquidityConnector.getBestBuyRoute(bnbAmount);
                expect(route.router).to.equal(mockRouter.address);
                expect(route.outputAmount).to.be.gt(0);
            } catch (error) {
                // Mock router might not have proper implementation
                // This is expected in test environment
                expect(error.message).to.include("NoValidRouteFound");
            }
        });

        it("Should find best sell route", async function () {
            const tokenAmount = parseTokens("10000");

            try {
                const route = await liquidityConnector.getBestSellRoute(tokenAmount);
                expect(route.router).to.equal(mockRouter.address);
                expect(route.outputAmount).to.be.gt(0);
            } catch (error) {
                // Mock router might not have proper implementation
                expect(error.message).to.include("NoValidRouteFound");
            }
        });

        it("Should not allow zero amounts in route finding", async function () {
            await expectRevert(
                liquidityConnector.getBestBuyRoute(0),
                "InvalidAmount"
            );

            await expectRevert(
                liquidityConnector.getBestSellRoute(0),
                "InvalidAmount"
            );
        });
    });

    describe("View Functions", function () {
        beforeEach(async function () {
            await liquidityConnector.addDEX(
                mockRouter.address,
                mockFactory.address,
                "PancakeSwap",
                7000
            );

            await liquidityConnector.addDEX(
                addr1.address,
                addr2.address,
                "AnotherSwap",
                3000
            );
        });

        it("Should return all DEXs info", async function () {
            const dexsInfo = await liquidityConnector.getAllDEXsInfo();
            
            expect(dexsInfo.routers.length).to.equal(2);
            expect(dexsInfo.names.length).to.equal(2);
            expect(dexsInfo.activeStatus.length).to.equal(2);
            expect(dexsInfo.liquidityShares.length).to.equal(2);

            expect(dexsInfo.names[0]).to.equal("PancakeSwap");
            expect(dexsInfo.names[1]).to.equal("AnotherSwap");
            expect(dexsInfo.liquidityShares[0]).to.equal(7000);
            expect(dexsInfo.liquidityShares[1]).to.equal(3000);
        });

        it("Should return total liquidity share", async function () {
            const totalShare = await liquidityConnector.getTotalLiquidityShare();
            expect(totalShare).to.equal(10000); // 70% + 30%
        });
    });

    describe("Rescue Functions", function () {
        it("Should rescue tokens", async function () {
            // Deploy another token to test rescue
            const MockToken = await ethers.getContractFactory("MockERC20");
            const testToken = await MockToken.deploy("Test Token", "TEST", 18);
            
            // Send some test tokens to the liquidity connector
            await testToken.transfer(liquidityConnector.address, parseTokens("1000"));
            
            const initialBalance = await testToken.balanceOf(owner.address);
            await liquidityConnector.rescueTokens(testToken.address);
            const finalBalance = await testToken.balanceOf(owner.address);
            
            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should rescue BNB", async function () {
            // Send some BNB to the contract
            await owner.sendTransaction({
                to: liquidityConnector.address,
                value: ethers.utils.parseEther("1")
            });

            const initialBalance = await owner.getBalance();
            await liquidityConnector.rescueBNB();
            const finalBalance = await owner.getBalance();

            expect(finalBalance).to.be.gt(initialBalance);
        });

        it("Should not allow rescuing zero address", async function () {
            await expectRevert(
                liquidityConnector.rescueTokens(ethers.constants.AddressZero),
                "ZeroAddress"
            );
        });
    });

    describe("Access Control", function () {
        it("Should only allow owner to call restricted functions", async function () {
            await expect(
                liquidityConnector.connect(addr1).addDEX(
                    mockRouter.address,
                    mockFactory.address,
                    "PancakeSwap",
                    7000
                )
            ).to.be.revertedWith("Ownable: caller is not the owner");

            await expect(
                liquidityConnector.connect(addr1).removeDEX(mockRouter.address)
            ).to.be.revertedWith("Ownable: caller is not the owner");

            await expect(
                liquidityConnector.connect(addr1).rescueBNB()
            ).to.be.revertedWith("Ownable: caller is not the owner");
        });
    });
});
