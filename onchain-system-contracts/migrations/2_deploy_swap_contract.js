// migrations/2_deploy_swap_contract.js
const SwapAndMemo = artifacts.require("SwapAndMemo");

module.exports = function (deployer) {
  deployer.deploy(SwapAndMemo);
};