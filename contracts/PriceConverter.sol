//SPDX-License-Identifier:MIT

pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";

library PriceConverter {
    //用该函数来计算以美元为单位时,代币的理论价格
    //为了获取价格一定要使用Chainlink喂价来获取定价信息
    function getPrice(AggregatorV3Interface priceFeed)
        internal
        view
        returns (uint256)
    {
        //引入项目外合约里的价格函数
        //因为这是我们在与项目之外的合约进行交互,所以我们需要两样东西(之前的交互都是使用import)
        //1.合约的ABI 通过编译聚合器V3接口合约,我们能得到ABI
        //2.合约的地址address 	ETH/USD:0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        //创建一个聚合器对象,命名为喂价,这个合约地址的对象是否拥有聚合器接口的全部功能?
        // AggregatorV3Interface priceFeed = AggregatorV3Interface(
        //     0xD4a33860578De61DBAbDc8BFdb98FD742fA7028e
        // ); //创建此对象后向chainlink报告说这是一个接口对象这是一个接口对象，它被编译成 abi。如果您将 abi 与地址匹配，您将获得可以与之交互的合约。

        //调用函数,获取最新一轮的价格,由于这个函数返回一大堆不同的变量,故需要设置返回值,但是这些变量里我们只关注价格,把其他变量去掉只留下逗号
        (, int256 price, , , ) = priceFeed.latestRoundData(); //相当于返回最新一轮数据的价格
        //上述函数返回的是按美元计算的ETH的价格
        //AggregatorV3Interface合约有一个小数(decimals)函数,它会告诉你在喂价中有多少个小数位.
        //解决小数点问题
        return uint256(price * 1e10); //1 * 10^10 == 10000000000//因为msg.value是uint256类型的,获取的定价也应是uint256类型的
        //18-10=8位小数?

        //(uint80 roundId,int price,uint startedAt,uint timeStamp,uint80 answeredInRound) = priceFeed.latestRoundData();
    }

    //用该函数来获取转换率
    function getConversionRate(
        uint256 ethAmount,
        AggregatorV3Interface priceFeed
    ) internal view returns (uint256) {
        //调用新创建的getPrice函数来为自变量赋值
        uint256 ethPrice = getPrice(priceFeed); //现在当我们调用我们的getPrice函数时,我们可以将喂价传递给getPrice()

        //3000_000000000000000000 = ETH/USD

        uint256 ethAmountInUsd = (ethPrice * ethAmount) / 1e18;
        return ethAmountInUsd;
    }
}
