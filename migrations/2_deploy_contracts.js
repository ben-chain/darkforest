const DarkForest = artifacts.require("DarkForestV1");

module.exports = function(deployer) {
  deployer.deploy(DarkForest);
};
