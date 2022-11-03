require("dotenv").config()
require("@nomiclabs/hardhat-etherscan")
require("@nomiclabs/hardhat-waffle")
require("hardhat-gas-reporter")
require("solidity-coverage")
require("hardhat-deploy")

const GOERLI_RPC_URL = process.env.GOERLI_RPC_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY

module.exports = {
    solidity: {
        compilers: [{ version: "0.8.8" }, { version: "0.6.6" }],
    },
    defaultNetwork: "hardhat",
    networks: {
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: [PRIVATE_KEY],
            chainId: 5,
            blockConfirmations: 6,
        },
    },
    gasReporter: {
        enable: true, //在我们运行测试时先不让这个插件运行
        outputFile: "gas-report.txt", //把Gas费的消耗输出到一个文件中
        noColors: true, //当我们输出到文件时,颜色基本上会弄乱,所以直接不设置颜色了
        currency: "USD", //添加货币,这样我们就可以得到以美元所计的函数Gas费成本
        coinmarketcap: COINMARKETCAP_API_KEY, //为了获得货币我们需要得到来自货币市值的API密钥(就像那次获得Ether scan密钥一样)
        // token: "MATIC",
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [
            {
                network: "goerli",
                chainId: 5,
                urls: {
                    apiURL: "http://api-goerli.etherscan.io/api", //https => http
                    browserURL: "http://goerli.etherscan.io",
                },
            },
        ],
    },
    //我们可以在这里统一书写每个网络的accounts数组中的用户编号
    namedAccounts: {
        //用户编号
        deployer: {
            default: 0,
        },
        //如果我们想为某些用户做一些测试的话,设置该用户的默认编号
        users: {
            default: 1,
        },
    },
}
