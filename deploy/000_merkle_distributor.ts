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

	const TOKEN_ADDRESS = "0x888888888889c00c67689029d7856aac1065ec11";
	const ECOSYSTEM = "0xdbc2f7f3bccccf54f1bda43c57e8ab526e379df1";

	const START = 1620044574; // 05/03/2021 @ 12:22pm (UTC)
	const END = 1627820574; // 08/01/2021 @ 12:22pm (UTC)
	const EMERGENCY_TIMEOUT = 1630412574; // 08/31/2021 @ 12:22pm (UTC)

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
