import { Indexer, RPC } from '@ckb-lumos/lumos';
import { useEffect, useState } from 'react';
import { createCluster, unpackToRawClusterData, getSporeScript } from '@spore-sdk/core';
import { signTransaction } from '@/utils/transaction';
import useWallet from '@/hooks/useWallet';
import Link from 'next/link';
import { config } from '@/config';

export type Site = {
  id: string;
  name: string;
  description: string;
};

export default function Home() {
  const { address, lock, balance, isConnected, connect, disconnect } =
    useWallet();
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');
  const [sites, setSites] = useState<Site[]>([]);

  useEffect(() => {
    if (!lock) {
      return;
    }

    (async () => {
      const indexer = new Indexer(config.ckbIndexerUrl);
      const { script } = getSporeScript(config, 'Cluster');
      const collector = indexer.collector({
        type: { ...script, args: '0x' },
        lock,
      });

      const sites = [];
      for await (const cell of collector.collect()) {
        const unpacked = unpackToRawClusterData(cell.data);
        sites.push({
          id: cell.cellOutput.type!.args,
          name: unpacked.name,
          description: unpacked.description,
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
    const rpc = new RPC(config.ckbNodeUrl);
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
        <div>Balance: {balance?.toNumber() ?? 0} CKB</div>
        <button onClick={() => disconnect()}>Disconnect</button>
      </div>
      <div>
        <h2>Create Site</h2>
        <form onSubmit={handleCreateSite}>
          <div>
            <label htmlFor="name">Name: </label>
            <input
              type="text"
              id="name"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="description">Description: </label>
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
