import { getCapacities } from '@/utils/balance';
import { signTransaction } from '@/utils/transaction';
import { RPC, commons, config, helpers } from '@ckb-lumos/lumos';
import {
  createCluster,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export default function Home() {
  const { address: ethAddress, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState(0);
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const lock = useMemo(() => {
    if (!ethAddress) return;

    return commons.omnilock.createOmnilockScript(
      {
        auth: { flag: 'ETHEREUM', content: ethAddress ?? '0x' },
      },
      { config: config.predefined.AGGRON4 },
    );
  }, [ethAddress]);

  const address = useMemo(
    () =>
      lock
        ? helpers.encodeToAddress(lock, { config: config.predefined.AGGRON4 })
        : undefined,
    [lock],
  );

  useEffect(() => {
    if (!address) {
      return;
    }
    getCapacities(address).then((capacities) => {
      setBalance(capacities.div(10 ** 8).toNumber());
    });
  }, [address]);

  const handleCreateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address || !lock) return;

    console.log(address, lock);
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
    </div>
  );
}
