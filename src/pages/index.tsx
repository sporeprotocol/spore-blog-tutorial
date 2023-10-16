import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { BI, commons, config, helpers } from '@ckb-lumos/lumos';
import { useEffect, useMemo, useState } from 'react';
import { getCapacities } from '../utils/balance';

export default function Home() {
  const { address: ethAddress, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<BI | null>(null);
  const [siteName, setSiteName] = useState('');
  const [siteDescription, setSiteDescription] = useState('');

  const address = useMemo(() => {
    if (!ethAddress) return;

    const lock = commons.omnilock.createOmnilockScript({
      auth: { flag: 'ETHEREUM', content: ethAddress ?? '0x' },
    });
    return helpers.encodeToAddress(lock, { config: config.predefined.AGGRON4 });
  }, [ethAddress]);

  useEffect(() => {
    if (!address) {
      return;
    }
    getCapacities(address).then((capacities) => {
      setBalance(capacities.div(10 ** 8));
    });
  }, [address]);

  const handleCreateSite = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log(siteName, siteDescription);
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
    </div>
  );
}
