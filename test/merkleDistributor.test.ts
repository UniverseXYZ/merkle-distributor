import { ethers } from "hardhat";
import { Signer } from "ethers";
import { MerkleDistributor } from "../typechain/MerkleDistributor";
import { XYZ } from "../typechain/XYZ";
import { expect } from "chai";
import BalanceTree from "../src/balance-tree";

describe("Token", function () {
	let accounts: Signer[];
	// TODO: update for correct values
	let token: XYZ;
	let tree: BalanceTree;
	const totalClaims = 2;
	const initialPoolSize = ethers.utils.parseEther("300");
	const bonusStart = ethers.utils.parseEther("100");
	const bonusEnd = ethers.utils.parseEther("300");
	const emergencyTimeout = ethers.utils.parseEther("500");
	let merkle: MerkleDistributor;
	let account0: string;
	let account1: string;

	beforeEach(async function () {
		accounts = await ethers.getSigners();
	});

	it("should deploy contract", async () => {
		account0 = await accounts[0].getAddress();
		account1 = await accounts[1].getAddress();
		tree = new BalanceTree([
			{ account: account0, amount: ethers.utils.parseEther("100") },
			{ account: account1, amount: ethers.utils.parseEther("200") },
		]);

		const XYZContract = await ethers.getContractFactory("XYZ");
		token = await XYZContract.deploy();

		const MekleDistributor = await ethers.getContractFactory("MerkleDistributor");
		merkle = await MekleDistributor.deploy(
			token.address,
			tree.getHexRoot(),
			totalClaims,
			initialPoolSize,
			bonusStart,
			bonusEnd,
			emergencyTimeout
		);

		await token.mint(merkle.address, ethers.utils.parseEther("300"));
	});

	it("should set constructor values", async () => {
		const ctoken = await merkle.token();
		const cmerkleRoot = await merkle.merkleRoot();
		const ctotalClaims = await merkle.totalClaims();
		const cinitialPoolSize = await merkle.initialPoolSize();
		const cbonusStart = await merkle.bonusStart();
		const cbonusEnd = await merkle.bonusEnd();
		const cemergencyTimeout = await merkle.emergencyTimeout();
		expect(ctoken).eq(token.address);
		expect(cmerkleRoot).eq(tree.getHexRoot());
		expect(ctotalClaims).eq(totalClaims);
		expect(cinitialPoolSize).eq(initialPoolSize);
		expect(cbonusStart).eq(bonusStart);
		expect(cbonusEnd).eq(bonusEnd);
		expect(cemergencyTimeout).eq(emergencyTimeout);
	});

	it("should have valid claims", async () => {
		let claim = await merkle.isClaimed(0);
		expect(claim).to.eq(false);
		claim = await merkle.isClaimed(1);
		expect(claim).to.eq(false);
	});

	it("should allow to claim", async () => {
		const proof0 = tree.getProof(0, account0, ethers.utils.parseEther("100"));
		await expect(merkle.claim(0, account0, ethers.utils.parseEther("100"), proof0)).to.emit(
			merkle,
			"Claimed"
		);

		const proof1 = tree.getProof(1, account1, ethers.utils.parseEther("200"));
		await expect(merkle.claim(1, account1, ethers.utils.parseEther("200"), proof1)).to.emit(
			merkle,
			"Claimed"
		);

		// expect first claimer to have less bonus
		const balance0 = await token.balanceOf(account0);
		expect(balance0.lt(ethers.utils.parseEther("100")));

		// expect last claimer to greater bonus
		const balance1 = await token.balanceOf(account1);
		expect(balance1.gt(ethers.utils.parseEther("200")));
	});

	it("should have invalid claims", async () => {
		let claim = await merkle.isClaimed(0);
		expect(claim).to.eq(true);
		claim = await merkle.isClaimed(1);
		expect(claim).to.eq(true);
	});
});
