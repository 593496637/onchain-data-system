// migrations/3_deploy_swap_v3_contract.js
const SwapAndMemoV3 = artifacts.require("SwapAndMemoV3");

module.exports = function (deployer) {
  deployer.deploy(SwapAndMemoV3);
};