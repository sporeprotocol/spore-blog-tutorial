import { getCapacities } from '@/utils/balance';
import { commons, config, helpers } from '@ckb-lumos/lumos';
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
      setBalance(capacities.div(10 ** 8).toNumber());
    });
  }, [address]);

  return (
    <div>
      {isConnected ? (
        <div>
          <div>CKB Address: {address}</div>
          <div>Balance: {balance} CKB</div>
          <button onClick={() => disconnect()}>Disconnect</button>
        </div>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
}
