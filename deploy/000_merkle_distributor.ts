import { HardhatRuntimeEnvironment } from "hardhat/types";
import { DeployFunction } from "hardhat-deploy/types";
import { deployments } from "hardhat";
import airdrop from "../scripts/airdrop.json";
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

	const TOKEN_ADDRESS = "0x41E88dc0dfA5455E64327484F1862332413520da";
	const ECOSYSTEM = "0x2D5AB5A00b78093f1ce41B9355043aB670A9A92A";

	const START = 1623979526; // 2021-06-17 19:25:26
	const END = 1631928326; // 2021-09-17 19:25:26
	const EMERGENCY_TIMEOUT = 1634520326; // 2021-10-17 19:25:26

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
