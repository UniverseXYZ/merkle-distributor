import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments } from "hardhat";
import airdrop from "../scripts/airdrop-test.json"; // TODO: Change to mainnet file
import BalanceTree from "../src/balance-tree";
import { BigNumber } from "ethers";

const calculateTotalAirdrop = (accounts: any) => {
	return accounts.reduce(
		(accumulator: any, currentValue: any) => accumulator.add(currentValue.amount),
		BigNumber.from(0)
	);
};

const MerkleDistributor: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
	const ethers = hre.ethers;
	const merkleDistributor = await deployments.getOrNull("MerkleDistributor");

	// Mainnet params
	const TOKEN_ADDRESS = "0x618679df9efcd19694bb1daa8d00718eacfa2883";
	const ECOSYSTEM = "0x2D5AB5A00b78093f1ce41B9355043aB670A9A92A";
	const START = 1626242400; // 2021-07-14 0:00:00
	const END = START + (60 * 60 * 24 * 7 * 100); // 100 weeks
	const EMERGENCY_TIMEOUT = END + (60 * 60 * 24 * 7 * 4); // 104 weeks

	const airdropAccounts = airdrop.map((drop) => ({
		account: drop.address,
		amount: ethers.utils.parseEther(drop.earnings.toString()),
	}));

	const { log } = deployments;
	if (!merkleDistributor) {
		const tree = new BalanceTree(airdropAccounts);
		const root = tree.getHexRoot();
		const totalAllocatedAirdrop = calculateTotalAirdrop(airdropAccounts);

		console.log("###############################################");
		console.log(`merkle tree root: ${root}`);
		console.log("##############################################");

		const namedAccounts = await hre.getNamedAccounts();
		const merkleDeployment = await deployments.deploy("MerkleDistributor", {
			contract: "MerkleDistributor",
			from: namedAccounts.deployer,
			args: [
				TOKEN_ADDRESS,
				root,
				airdropAccounts.length,
				totalAllocatedAirdrop,
				START,
				END,
				EMERGENCY_TIMEOUT,
				ECOSYSTEM,
			],
			skipIfAlreadyDeployed: true,
			log: true,
		});

		log(
			`Merkle Distributor deployed at ${merkleDeployment.address} for ${merkleDeployment.receipt?.gasUsed}`
		);
	} else {
		log("Vesting already deployed");
	}
};

export default MerkleDistributor;
