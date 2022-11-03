//我们要部署自己的Mock喂价合约
//并且在deploy-fund-me.js里面如果我们在一个没有任何喂价合约的网络上(例如hardhat和localhost),我们将使用我们自己的合约而不是已经建立的合约
const { network } = require("hardhat") //导入hardhat网络
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config") //导入模拟合约专属开发链
//导入模拟合约构造函数的两大参数

//我们将使用匿名异步函数
//我们将以hardhat运行时的环境作为参数(hre)
//我们只使用hre中的两个变量
module.exports = async ({ getNamedAccounts, deployments }) => {
    //我们可以使用deployments对象获得两个函数
    const { deploy, log } = deployments //从deployments拉取这两个函数
    const { deployer } = await getNamedAccounts() //从getNamedAccounts()拉取deployer函数
    //getNameAccounts函数是让我们获得NameAccounts的方法,当我们使用ethers时我们是根据号码在每个网络的accounts部分来获取我们的accounts
    // const chainId = network.config.chainId //获取我们的chainId

    //编译完模拟合约后我们现在有一个合约，我们可以使用它来将虚假的价格信息部署到区块链
    //但是我们不想把这个模拟合约部署到测试网或者主网上(这个功能需要到helper-hardhat-config.js中去完成)
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...") //相当于consolo.log()
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER], //构造函数_decimals相当于小数函数,_initialAnswer相当于是喂价从多少开始(初始喂价)
        }) //部署测试合约
        log("Mocks deployed!")
        log("------------------------------------------------")
    }
}

//只会运行具有特殊标签的部署脚本
//只部署我们的模拟合约yarn hardhat deploy --tags mocks
module.exports.tags = ["all", "mocks"] //all是啥意思?
