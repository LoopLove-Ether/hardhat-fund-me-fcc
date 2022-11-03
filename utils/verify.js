const { run } = require("hardhat")

//验证函数
//当.sol文件中有构造函数时,参数将被填充
//此自动验证过程适用于像Ether scan这样的区块链浏览器
//const verify = async(contractAddress,args) => { 上下两种定义方法等价
async function verify(contractAddress, args) {
    console.log("Verifying contract...")
    //我们需要添加一个try-catch,因为在实践中经常出现运行时等待这样的错误
    //下面的e将有可能是我们抛出的任何错误
    try {
        //我们可以传递验证参数(故在这里采用冒号验证)---第一个参数
        //第二个参数进入内部运行,这将是实际参数的列表
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: args,
        })
    } catch (e) {
        //如果这条消息已经验证,那我们就继续
        if (e.message.toLowerCase().includes("already verified")) {
            console.log("Already Verified!")
        }
        //如果出现任何问题,那我们就输出错误,然后进行下一次验证,避免验证中断
        else {
            console.log(e)
        }
    }
}

//导出配置,让我们的验证脚本文件可以被其他程序导入
module.exports = { verify }
