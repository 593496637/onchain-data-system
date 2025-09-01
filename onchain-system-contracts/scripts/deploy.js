const { ethers } = require("hardhat");

async function main() {
  console.log("开始部署合约...");

  // 部署 DataStorage 合约
  const DataStorage = await ethers.getContractFactory("DataStorage");
  const dataStorage = await DataStorage.deploy();
  await dataStorage.deployed();
  console.log("DataStorage 合约部署到地址:", dataStorage.address);

  // 部署 TransferWithMessage 合约
  const TransferWithMessage = await ethers.getContractFactory("TransferWithMessage");
  const transferWithMessage = await TransferWithMessage.deploy();
  await transferWithMessage.deployed();
  console.log("TransferWithMessage 合约部署到地址:", transferWithMessage.address);

  console.log("所有合约部署完成!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });