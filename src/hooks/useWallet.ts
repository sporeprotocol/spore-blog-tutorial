import { BI, commons, config, helpers } from '@ckb-lumos/lumos';
import { useEffect, useMemo, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { InjectedConnector } from 'wagmi/connectors/injected';
import { getCapacities } from '@/utils/balance';

export default function useWallet() {
  const { address: ethAddress, isConnected } = useAccount();
  const { connect } = useConnect({
    connector: new InjectedConnector(),
  });
  const { disconnect } = useDisconnect();
  const [balance, setBalance] = useState<BI | null>(null);

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
        ? helpers.encodeToAddress(lock, {
            config: config.predefined.AGGRON4,
          })
        : undefined,
    [lock],
  );

  useEffect(() => {
    if (!address) {
      return;
    }
    getCapacities(address).then((capacities) => {
      setBalance(capacities.div(10 ** 8));
    });
  }, [address]);

  return {
    address,
    lock,
    balance,
    isConnected,
    connect,
    disconnect,
  };
}
