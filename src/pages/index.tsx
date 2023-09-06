import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';

export default function Home() {
  const { address, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();

  return (
    <div>
      <div>{address}</div>
      {isConnected ? (
        <button onClick={() => disconnect()}>Disconnect</button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
}
