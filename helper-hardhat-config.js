//跨越不同链跟踪不同合约地址的喂价
const networkConfig = {
    //这个5是chainId
    5: {
        name: "goerli",
        ethUsdPriceFeed: "0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e", //喂价地址
    },
    137: {
        name: "polygon",
        ethUsdPriceFeed: "0xF9680D99D6C9589e2a93a78A04A279e509205945",
    },
    31337: {
        name: "localhost",
    },
}

const developmentChains = ["hardhat", "localhost"] //模拟合约部署的链
const DECIMALS = 8
const INITIAL_ANSWER = 200000000000

//需要导出networkConfig
module.exports = {
    networkConfig,
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
}
