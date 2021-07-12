// test with
// yarn test ./test/airdrop.test.ts

import { ethers } from "hardhat";
import { Signer } from "ethers";
import { MerkleDistributor } from "../typechain";
import { XYZ } from "../typechain";
import { expect } from "chai";
import BalanceTree from "../src/balance-tree";
import airdrop from "../scripts/airdrop-test.json";
import { BigNumber } from "ethers";
import { id } from "ethers/lib/utils";

const calculateTotalAirdrop = (accounts: any) => {
	return accounts.reduce(
		(accumulator: any, currentValue: any) => accumulator.add(currentValue.amount),
		BigNumber.from(0)
	);
};

describe("Token", function() {
	this.timeout(40000);
	let accounts: Signer[];

	let token: XYZ;
	let tree: BalanceTree;
	const ECOSYSTEM = "0x2D5AB5A00b78093f1ce41B9355043aB670A9A92A";

	const START = Math.floor(Date.now() / 1000);
	const END = START + (60 * 60 * 24 * 7 * 100); // 100 weeks
	const EMERGENCY_TIMEOUT = END + (60 * 60 * 24 * 7 * 4); // 104 weeks
	const TIME_SKIP = END - 100; // Amount of time to skip, right now is almost at the end of the rewards

	let merkle: MerkleDistributor;
	let account0: string;
	let account1: string;

	const airdropAccounts = airdrop.map((drop) => ({
		account: drop.address,
		amount: ethers.utils.parseEther(drop.earnings.toString())
	}));

	beforeEach(async function() {
		accounts = await ethers.getSigners();
	});

	it("should deploy contract", async () => {
		//These addresses where added to the airdrop-test.json
		account0 = await accounts[0].getAddress();
		account1 = await accounts[1].getAddress();

		tree = new BalanceTree(airdropAccounts);
		const root = tree.getHexRoot();
		const totalAllocatedAirdrop = calculateTotalAirdrop(airdropAccounts);

		const XYZContract = await ethers.getContractFactory("XYZ");
		token = <XYZ>await XYZContract.deploy();

		const MerkleDistributor = await ethers.getContractFactory("MerkleDistributor");
		merkle = <MerkleDistributor>await MerkleDistributor.deploy(
			token.address,
			root,
			airdropAccounts.length,
			totalAllocatedAirdrop,
			START,
			END,
			EMERGENCY_TIMEOUT,
			ECOSYSTEM
		);

		// sends XYZ to the distributor
		await token.mint(merkle.address, ethers.utils.parseEther("80000000"));
	});

	it("should set constructor values", async () => {
		const ctoken = await merkle.token();
		const cmerkleRoot = await merkle.merkleRoot();
		const ctotalClaims = await merkle.totalClaims();
		const cinitialPoolSize = await merkle.initialPoolSize();
		const cbonusStart = await merkle.bonusStart();
		const cbonusEnd = await merkle.bonusEnd();
		const cemergencyTimeout = await merkle.emergencyTimeout();
		const totalAllocatedAirdrop = calculateTotalAirdrop(airdropAccounts);
		expect(ctoken).eq(token.address);
		expect(cmerkleRoot).eq(tree.getHexRoot());
		expect(ctotalClaims).eq(airdropAccounts.length);
		expect(cinitialPoolSize).eq(totalAllocatedAirdrop);
		expect(cbonusStart).eq(START);
		expect(cbonusEnd).eq(END);
		expect(cemergencyTimeout).eq(EMERGENCY_TIMEOUT);
	});

	it("should have valid claims", async () => {
		let claim = await merkle.isClaimed(0);
		expect(claim).to.eq(false);
		claim = await merkle.isClaimed(1);
		expect(claim).to.eq(false);
	});

	// it("should allow to claim", async () => {
	// 	// Time skips uncomment to allow a time skip
	// 	// await ethers.provider.send("evm_increaseTime", [TIME_SKIP]);
	// 	// await ethers.provider.send("evm_mine", []);

	// 	const proof0 = tree.getProof(0, account0, ethers.utils.parseEther("200000"));

	// 	await expect(merkle.claim(0, account0, ethers.utils.parseEther("200000"), proof0)).to.emit(
	// 		merkle,
	// 		"Claimed"
	// 	);

	// 	const proof1 = tree.getProof(1, account1, ethers.utils.parseEther("200000"));
	// 	await expect(
	// 		merkle.connect(accounts[1]).claim(1, account1, ethers.utils.parseEther("200000"), proof1)
	// 	).to.emit(merkle, "Claimed");

	// 	// expect first claimer to have less bonus
	// 	const balance0 = await token.balanceOf(account0);
	// 	expect(balance0.lt(ethers.utils.parseEther("200000")));
	// 	console.log(
	// 		"🚀 ~ file: airdrop.test.ts ~ line 112 ~ it ~ balance0",
	// 		ethers.utils.formatEther(balance0)
	// 	);

	// 	//	expect last claimer to greater bonus
	// 	const balance1 = await token.balanceOf(account1);
	// 	console.log(
	// 		"🚀 ~ file: airdrop.test.ts ~ line 115 ~ it ~ balance1",
	// 		ethers.utils.formatEther(balance1)
	// 	);
	// 	expect(balance1.gt(ethers.utils.parseEther("200000")));
	// });

	// it("should have invalid claims", async () => {
	// 	let claim = await merkle.isClaimed(0);
	// 	expect(claim).to.eq(true);
	// 	claim = await merkle.isClaimed(1);
	// 	expect(claim).to.eq(true);
	// });

	it("should claim all", async () => {

		let balance = await token.balanceOf(merkle.address);
		let total: BigNumber = BigNumber.from(0);
		console.log(ethers.utils.formatEther(balance));
		for (let i = 0; i < airdropAccounts.length; i++) {
			if(i == 2){
			await ethers.provider.send("evm_increaseTime", [TIME_SKIP]);
			await ethers.provider.send("evm_mine", []);
		}
			const proof1 = tree.getProof(i, airdropAccounts[i].account, airdropAccounts[i].amount);
			await expect(
				merkle
					.connect(accounts[1])
					.claim(i, airdropAccounts[i].account, airdropAccounts[i].amount, proof1)
			).to.emit(merkle, "Claimed");
			const balance1 = await token.balanceOf(airdropAccounts[i].account);
			total = total.add(balance1);
			console.log("balance: " + i + " ", ethers.utils.formatEther(balance1));
			if (i == 1793) {
				balance = await token.balanceOf(merkle.address);
				console.log(ethers.utils.formatEther(balance));
				console.log("total balance claimed = ", ethers.utils.formatEther(total));
			}
		}
	});
});
