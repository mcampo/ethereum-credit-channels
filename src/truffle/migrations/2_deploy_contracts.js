var CreditChannels = artifacts.require("./CreditChannels.sol");

module.exports = function(deployer) {
  deployer.deploy(CreditChannels);
};
