// run with
// npx hardhat run ./scripts/claimTest.ts --network hardhat
import hre, { deployments, network, hardhatArguments } from "hardhat";

async function main() {
	const ethers = hre.ethers;
	const START = 1626674400; // 2021-07-19 00:00:00
	const END = START + (60 * 60 * 24 * 7 * 100); // 100 weeks
	const EMERGENCY_TIMEOUT = END + (60 * 60 * 24 * 7 * 70); // 170 weeks

	if (hardhatArguments.network === "hardhat") {

		// Validate Results
		await hre.network.provider.request({
			method: "hardhat_impersonateAccount",
			params: ["0x75237802D46A40C4be57f518A7902528Be688Dfc"]
		});

		let signer = ethers.provider.getSigner("0x75237802D46A40C4be57f518A7902528Be688Dfc");
		const merkleDistributor = await deployments.get("MerkleDistributor");
		const merkleContract = await ethers.getContractAt("MerkleDistributor", merkleDistributor.address, signer);

		// Wait 109 Weeks
		await hre.network.provider.send("evm_increaseTime", [EMERGENCY_TIMEOUT]);
		await hre.network.provider.send("evm_mine");

		const tx = await merkleContract.emergencyWithdrawal();
		console.log("Tx", tx);
	}
}

main()
	.then(() => process.exit(0))
	.catch((error) => {
		console.error(error);
		process.exit(1);
	});
