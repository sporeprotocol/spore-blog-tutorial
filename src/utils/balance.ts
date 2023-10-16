// src/utils/balance.ts
import { Indexer, config, BI, helpers } from '@ckb-lumos/lumos';

const CKB_RPC_URL = 'https://testnet.ckb.dev/rpc';
const CKB_INDEXER_URL = 'https://testnet.ckb.dev/indexer';

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export async function getCapacities(address: string): Promise<BI> {
  config.initializeConfig(config.predefined.AGGRON4);
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
		type: 'empty',
		data: '0x',
  });

  let capacities = BI.from(0);
  for await (const cell of collector.collect()) {
    capacities = capacities.add(cell.cellOutput.capacity);
  }

  return capacities;
}
