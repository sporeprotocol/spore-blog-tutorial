import useWallet from '@/hooks/useWallet';
import { Indexer } from '@ckb-lumos/lumos';
import { getSporeScript, unpackToRawClusterData } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Site } from '..';
import { config } from '@/config';

export default function SitePage() {
  const router = useRouter();
  const { id } = router.query;
  const { lock, isConnected, connect } = useWallet();
  const [siteInfo, setSiteInfo] = useState<Site>();

  useEffect(() => {
    if (!id) {
      return;
    }

    (async () => {
      const indexer = new Indexer(config.ckbIndexerUrl);
      const { script } = getSporeScript(config, 'Cluster');
      const collector = indexer.collector({
        type: { ...script, args: id as string },
      });

      for await (const cell of collector.collect()) {
        const unpacked = unpackToRawClusterData(cell.data);
        setSiteInfo({
          id: cell.cellOutput.type!.args,
          name: unpacked.name,
          description: unpacked.description,
        });
      }
    })();
  }, [id, lock]);

  return (
    <div>
      <h1>{siteInfo?.name}</h1>
      <p>{siteInfo?.description}</p>
      {isConnected ? (
        <button>Add Post</button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
      <div></div>
    </div>
  );
}
