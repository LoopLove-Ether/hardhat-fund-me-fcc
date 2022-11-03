//我们将使用hardhat-deploy来自动设置我们的测试
//我们可以基于不同的函数对我们的测试进行分组。

const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat") //hardhat运行时环境相当于hardhat
const { developmentChains } = require("../../helper-hardhat-config")

//我们的单元测试只在开发链上运行
!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe Unit Tests", function () {
          //我们的“fundMe”,“deployer”和“mockV3Aggregator”对象的范围仅限于 beforeeach 内部，
          //我们实际上需要将这些变量粘贴到 beforeeach 之外，以便我们所有的 it() 都可以与它们交互。
          //因此，我们不是让“fundMe”,“deployer”和“mockV3Aggregator”成为常量变量，而是使用 let 关键字在beforeeach之外定义它们
          let fundMe
          let deployer
          let mockV3Aggregator //将它们初始化为空
          const sendValue = ethers.utils.parseEther("1") // 1ETH 这是ethers.js包中的util函数的作用,可以在这个函数中对ETH的任何单位进行转换

          //该函数会告诉我们在每个it()前/我们的测试框架在每次测试前需要做什么
          //我们想要在函数测试之前部署合约
          beforeEach(async function () {
              //在这里,我们需要部署我们的FundMe合约,以至于我们每次测试的时候都能有一份全新的合约与我们的每一项测试进行交互
              // const accounts = await ethers.getSigners()//getSigners函数将返回部署网络中账户的全部内容(如果在默认网络hardhat上部署的话,它会给你一份10个假帐户的清单)
              // const accountZero = accounts[0]

              //下面的函数都是很严格的,要么给参数,要么包装
              //上述是其他获得资助者账户的方法
              deployer = (await getNamedAccounts()).deployer //合约部署者账户
              //使用hardhat-deploy部署我们的FundMe合约
              await deployments.fixture(["all"]) //fixture的作用是它允许我们使用我们all标签来运行我们的整个部署文件夹
              //当我们运行上述这行代码时,我将在本地网络上运行我们的部署脚本并部署所有合约
              fundMe = await ethers.getContract("FundMe", deployer) //getContract将获取我们告诉它的任何合约的最新部署,把合约部署者账户连接入合约中
              //每当我们用fundMe调用一个函数时,它将自动来自合约部署者账户
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          //构造函数的测试
          describe("constructor", function () {
              it("正确设置聚合器地址", async function () {
                  const response = await fundMe.s_priceFeed() //我们要确保测试时的喂价与我们的模拟合约相同,因为我们将在本地运行测试
                  assert.equal(response, mockV3Aggregator.address) //这就是上述的beforeEach中定义mockV3Aggregator对象的原因
              })
          })

          //众筹函数的测试
          describe("fund", function () {
              it("如果您没有发送足够的 ETH,则会失败", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  ) //来自华夫饼匹配器,这段代码是测试事务是否被require检查器还原,如果还原的话说明资助的ETH不够最低标准
              })
              //测试是否更新了资助者地址数组到资助金额的映射
              it("更新了资助者地址数组到资助金额的映射", async function () {
                  await fundMe.fund({ value: sendValue }) //调用fundMe合约的fund函数,并传了一个ETH进去作为资助金额
                  const response = await fundMe.s_addressToAmountFunded(
                      deployer
                  ) //传完资金之后这里给个映射把资金提出来然后下面匹配一下看看是否更新成功address => uints
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("将资助者添加到资助者数组中", async function () {
                  await fundMe.fund({ value: sendValue }) //调用fundMe合约的fund函数,并传了一个ETH进去作为资助金额,也就是资助者数组的数组首元素
                  const funder = await fundMe.s_funders(0) //在索引为0处调用资助者数组创建对象
                  assert.equal(funder, deployer)
              })
          })
          describe("withdraw", function () {
              //在取钱之前先往里面资助一些钱
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue })
              })

              it("从单个资助者那里提取 ETH", async function () {
                  //安排测试
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) //首先要获得fundMe合约的起始余额(他是一个BigNumber对象)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //然后获得合约部署者余额
                  //根据测试调用取款函数后二者余额的变化来决定是否正常调用

                  //采取行动
                  const transactionResponse = await fundMe.withdraw() //调用取款函数创建对象
                  const transactionReceipt = await transactionResponse.wait(1) //等待一个区块后再取钱
                  const { gasUsed, effectiveGasPrice } = transactionReceipt //使用的Gas数量以及有效的Gas价格
                  const gasCost = gasUsed.mul(effectiveGasPrice) //实际使用的Gas数量*有效的Gas价格=Gas的实际花费

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //取完钱后的fundMe合约余额
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //取完钱后的合约部署者余额
                  //华夫饼匹配
                  assert.equal(endingFundMeBalance, 0) //我们取出了所有的钱
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() //调用withdraw函数消耗Gas费
                  ) //钱回到了合约部署者的口袋里面
              })
              it("从多个资助者那里提取 ETH", async function () {
                  //先创建一大堆不同的账户
                  const accounts = await ethers.getSigners() //getSigners函数将返回部署网络中账户的全部内容(相当于是一个数组)
                  //遍历这些账户并让这些账户中的每一个都调用fund函数存点钱方便一会儿取
                  //从1开始,因为0号是部署者账户
                  for (let i = 1; i < 6; i++) {
                      const fundMeConnectedContract = await fundMe.connect(
                          accounts[i]
                      ) //调用connect函数创建新对象来连接所有这些不同的账户(因为fundMe合约在使用时自动和部署者连接)
                      await fundMeConnectedContract.fund({ value: sendValue })
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address) //首先要获得fundMe合约的起始余额(他是一个BigNumber对象)
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //然后获得合约部署者余额

                  const transactionResponse = await fundMe.withdraw() //再次调用withdraw函数
                  const transactionReceipt = await transactionResponse.wait(1) //等待一个区块后再取钱
                  const { gasUsed, effectiveGasPrice } = transactionReceipt //使用的Gas数量以及有效的Gas价格
                  const gasCost = gasUsed.mul(effectiveGasPrice) //实际使用的Gas数量*有效的Gas价格=Gas的实际花费

                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  ) //取完钱后的fundMe合约余额
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer) //取完钱后的合约部署者余额
                  //华夫饼匹配
                  assert.equal(endingFundMeBalance, 0) //我们取出了所有的钱
                  assert.equal(
                      startingDeployerBalance
                          .add(startingFundMeBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString() //调用withdraw函数消耗Gas费
                  ) //钱回到了合约部署者的口袋里面

                  //遍历所有的资助者账户,发现他们都被还原了
                  await expect(fundMe.fund()).to.be.reverted

                  //映射
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.s_addressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      ) // address => uint256
                  }
              })

              it("只允许合约的部署者(主人)撤回资金", async function () {
                  const accounts = await ethers.getSigners()
                  const fundMeConnectedContract = await fundMe.connect(
                      accounts[1]
                  ) //第一个资助者账户是随机的攻击者,把这个攻击者连接到一个新合约
                  await expect(
                      fundMeConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner") //确保当其他账户尝试调用withdraw函数时会自动恢复并抛出修改器特有的error code
              })
          })
      })
