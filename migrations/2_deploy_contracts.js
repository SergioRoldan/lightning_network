var CryptoHandler = artifacts.require("./CryptoHandler.sol");
var Test = artifacts.require("./Test.sol");

module.exports = function(deployer) {
  deployer.deploy(CryptoHandler);
  deployer.link(CryptoHandler, Test);
  deployer.deploy(Test);
};
