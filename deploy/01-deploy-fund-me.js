// 1.import
// 2.main function
// 3.calling of main function
// 这是以前的布置,使用hardhat-deploy不需要后两步了
// 当我们运行hardhat-deply,hadhat-deply实际上会调用我们在这个脚本中指定的函数

const { getNamedAccounts, network } = require("hardhat")

//我们将导出这个deployFunc()作为我们hardhat-deploy的默认函数
// function deployFunc(hre) {
//     console.log("Hi!")
//     hre.getNamedAccounts()
//     hre.deployments
// }

// module.exports.default = deployFunc//这里为什么不能有小括号呢?

//我们将使用匿名异步函数
//我们将以hardhat运行时的环境作为参数(hre)
//我们将导出这个匿名函数作为我们hardhat-deploy的默认函数
// module.exports = async (hre) => {
//     //我们只使用hre中的两个变量
//     const { getNamedAccounts, deployments } = hre //拉取hre中的具体变量
//     //这和hre.getNamedAccounts以及hre.deployments有点像
// }
//上述是未使用语法糖时的语法

const { networkConfig, developmentChains } = require("../helper-hardhat-config") //导入helper-hardhat-config.js中的网络配置
//上述导入配置语句的工作原理和下面两行相同
// const helperConfig = require("../helper-hardhat-config")
// const networkConfig = helperConfig.networkConfig
// const { network } = require("hardhat") //导入hardhat网络

const { verify } = require("../utils/verify") //导入验证脚本

module.exports = async ({ getNamedAccounts, deployments }) => {
    //我们可以使用deployments对象获得两个函数
    const { deploy, log } = deployments //从deployments拉取这两个函数
    const { deployer } = await getNamedAccounts() //从getNamedAccounts()拉取deployer函数
    //getNameAccounts函数是让我们获得NameAccounts的方法,当我们使用ethers时我们是根据号码在每个网络的accounts部分来获取我们的accounts
    const chainId = network.config.chainId //获取我们的chainId

    //通过chainId来获得address
    //Aave 是另一个在多条链上的协议，必须将其代码部署到多条链并使用多个不同的地址
    // const ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    let ethUsdPriceFeedAddress //这样就可以更新喂价地址了
    //在模拟合约中指定的开发链和测试链之间进行切换
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator") //从模拟合约中获得聚合器对象
        ethUsdPriceFeedAddress = ethUsdAggregator.address //喂价地址等于聚合器合约地址
    } else {
        //如果使用的开发链模拟合约中未指定,那么还是通过chainId从helper-hardhat-config.js中获取喂价地址
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    //这些Mocking合约的想法是如果真正的合约不存在(hardhat网络是一个空白区块链,每次我们的脚本完成时它都会被销毁)，我们会部署它的低仿版本以进行本地测试

    //当我们想该改变链条时会发生什么?(硬分叉？)
    //在访问 localhost 或hardhat网络时，我们想使用模拟对象

    const args = [ethUsdPriceFeedAddress] //参数列表
    //之前我们都是使用contractFactory来部署合约
    const fundMe = await deploy("FundMe", {
        from: deployer, //部署者
        args: args, //我们将把所有参数传递给构造函数(这里用来放置喂价地址)
        log: true, //自定义日志,这样我们就不必做所有的console.log
        waitConfirmations: network.config.blockConfiramations || 1, //块确认
    }) //调用部署函数

    //如果部署时指定网络的名称不是模拟合约中指定的开发链
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //验证合约
        await verify(fundMe.address, args)
    }

    log(
        "--------------------------------------------------------------------------------"
    )
}

//只会运行具有特殊标签的部署脚本
//只部署我们的模拟合约yarn hardhat deploy --tags fundme
module.exports.tags = ["all", "fundme"]
