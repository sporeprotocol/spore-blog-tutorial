import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { commons, config, helpers } from '@ckb-lumos/lumos';
import { useMemo } from 'react';

export default function Home() {
  const { address: ethAddress, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  const address = useMemo(() => {
    if (!ethAddress) return;

    const lock = commons.omnilock.createOmnilockScript({
      auth: { flag: 'ETHEREUM', content: ethAddress ?? '0x' },
    });
    return helpers.encodeToAddress(lock, { config: config.predefined.AGGRON4 });
  }, [ethAddress]);

  return (
	  <div>
	    {isConnected ? (
	      <div>
	        <div>CKB Address: {address}</div>
	        <button onClick={() => disconnect()}>Disconnect</button>
	      </div>
	    ) : (
	      <button onClick={() => connect()}>Connect Wallet</button>
	    )}
	  </div>
  );
}
