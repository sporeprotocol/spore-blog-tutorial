import useWallet from '@/hooks/useWallet';
import { hex2String } from '@/utils/helpers';
import { signTransaction } from '@/utils/transaction';
import { Indexer, RPC, config, helpers } from '@ckb-lumos/lumos';
import {
  ClusterData,
  createCluster,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export type Site = {
  id: string;
  name: string;
  description: string;
};

export default function Home() {
  const { address, lock, balance, isConnected, connect, disconnect } =
    useWallet();
  const [sites, setSites] = useState<Site[]>([]);
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  useEffect(() => {
    if (!lock) {
      return;
    }

    (async () => {
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Cluster;
      const collector = indexer.collector({
        type: { ...script, args: '0x' },
        lock,
      });

      const sites = [];
      for await (const cell of collector.collect()) {
        const unpacked = ClusterData.unpack(cell.data);
        sites.push({
          id: cell.cellOutput.type!.args,
          name: hex2String(unpacked.name.slice(2)),
          description: hex2String(unpacked.description.slice(2)),
        });
      }
      setSites(sites);
    })();
  }, [lock]);

  const handleCreateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address || !lock) return;

    const { txSkeleton } = await createCluster({
      data: {
        name: siteName,
        description: siteDescription,
      },
      fromInfos: [address],
      toLock: lock,
    });
    const tx = await signTransaction(txSkeleton);
    const rpc = new RPC(predefinedSporeConfigs.Aggron4.ckbNodeUrl);
    const hash = await rpc.sendTransaction(tx, 'passthrough');
    console.log(hash);
  };

  if (!isConnected) {
    return <button onClick={() => connect()}>Connect Wallet</button>;
  }

  return (
    <div>
      <div>
        <div>CKB Address: {address}</div>
        <div>Balance: {balance} CKB</div>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
      <div>
        <h2>Create Site</h2>
        <form onSubmit={handleCreateSite}>
          <div>
            <label htmlFor="site-name">Name: </label>
            <input
              type="text"
              id="name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="site-name">Description: </label>
            <input
              type="text"
              id="description"
              value={siteDescription}
              onChange={(e) => setSiteDescription(e.target.value)}
            />
          </div>
          <button type="submit">Create</button>
        </form>
      </div>
      <div>
        <h2>My Sites</h2>
        <ul>
          {sites.map((site) => (
            <li key={site.id}>
              <Link href={`/site/${site.id}`}>{site.name}</Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
