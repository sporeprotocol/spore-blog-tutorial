import { predefinedSporeConfigs, setSporeConfig } from '@spore-sdk/core';
import { config as lumosConfig } from '@ckb-lumos/lumos';

const config = predefinedSporeConfigs.Testnet;

lumosConfig.initializeConfig(config.lumos);
setSporeConfig(config);

export {
  config,
};
