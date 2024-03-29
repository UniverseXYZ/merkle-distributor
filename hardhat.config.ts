require("dotenv").config();

import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import "solidity-coverage";
import "hardhat-contract-sizer";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import "@typechain/hardhat";

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const mnemonic = process.env.MNENOMIC as string;

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
	namedAccounts: {
		deployer: {
			default: 0 // here this will by default take the first account as deployer
		}
	},
	solidity: {
		version: "0.7.3",
		settings: {
			optimizer: {
				enabled: true,
				runs: 200
			}
		}
	},
	networks: {
		hardhat: {
			forking: {
				url: process.env.MAINNET_API_URL as string
			}
		},
		ganache: {
			url: "HTTP://127.0.0.1:7545",
			accounts: [process.env.PRIVATE_KEY]
		},
		ropsten: {
			chainId: 3,
			url: `https://ropsten.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts: { mnemonic: mnemonic }
		},
		rinkeby: {
			chainId: 4,
			url: `https://rinkeby.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts: { mnemonic: mnemonic }
		},
		mainnet: {
			chainId: 1,
			url: `https://mainnet.infura.io/v3/${process.env.INFURA_API_KEY}`,
			accounts: { mnemonic: mnemonic }
		}
	},
	etherscan: {
		apiKey: process.env.ETHERSCAN_API_KEY
	},
	contractSizer: {
		alphaSort: true,
		runOnCompile: true,
		disambiguatePaths: false
	},
	gasReporter: {
		currency: "USD",
		gasPrice: 51,
		enabled: process.env.REPORT_GAS == "true" ? true : false,
		coinmarketcap: process.env.CMC_API_KEY
	}
};
