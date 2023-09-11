import useWallet from '@/hooks/useWallet';
import { hex2String } from '@/utils/helpers';
import { Indexer } from '@ckb-lumos/lumos';
import { ClusterData, predefinedSporeConfigs } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Site } from '..';

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
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Cluster;
      const collector = indexer.collector({
        type: { ...script, args: id as string },
      });

      for await (const cell of collector.collect()) {
        const unpacked = ClusterData.unpack(cell.data);
        setSiteInfo({
          id: cell.cellOutput.type!.args,
          name: hex2String(unpacked.name.slice(2)),
          description: hex2String(unpacked.description.slice(2)),
        });
      }
    })();
  }, [id, lock]);

  return (
    <div>
      <h1>{siteInfo?.name}</h1>
      <p>{siteInfo?.description}</p>
      {isConnected ? (
        <button onClick={() => router.push(`/post/new?id=${id}`)}>
          Add Post
        </button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
      <div></div>
    </div>
  );
}
