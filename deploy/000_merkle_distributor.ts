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

	const TOKEN_ADDRESS = "0x86dEddCFc3a7DBeE68cDADA65Eed3D3b70F4fe24";
	const ECOSYSTEM = "0x2D5AB5A00b78093f1ce41B9355043aB670A9A92A";

	const START = 1621539638; // 021-05-20 13:40:38
	const END = 1621798838; // 2021-05-23 13:40:38
	const EMERGENCY_TIMEOUT = 1621978838; // 2021-05-25 15:40:38

	const airdropAccounts = airdrop.map((drop) => ({
		account: drop.address,
		amount: BigNumber.from(ethers.BigNumber.from(drop.earnings.toString())),
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
