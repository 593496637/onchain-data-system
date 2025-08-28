// migrations/1_deploy_contracts.js
const DataStorage = artifacts.require("DataStorage");

module.exports = function (deployer) {
  deployer.deploy(DataStorage);
};