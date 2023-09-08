import { commons, config, helpers } from "@ckb-lumos/lumos";
import { useEffect, useMemo } from "react";
import { useAccount, useConnect } from "wagmi";
import { InjectedConnector } from "wagmi/connectors/injected";

export default function SitePage {
  useEffect(() => {
    if (!address) {
      return;
    }

    (async () => {
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Cluster;
      const collector = indexer.collector({
        type: { ...script, args: '0x' },
      });

      const sites = [];
      for await (const cell of collector.collect()) {
        const ownerAddress = helpers.encodeToAddress(cell.cellOutput.lock, {
          config: config.predefined.AGGRON4,
        });
        if (ownerAddress !== address) continue;

        const unpacked = ClusterData.unpack(cell.data);
        sites.push({
          id: cell.cellOutput.type!.args,
          name: hex2String(unpacked.name.slice(2)),
          description: hex2String(unpacked.description.slice(2)),
        });
      }
      setSites(sites);
    })();
  }, [address]);

  return (
      <div>
        <h1></h1>
      </div>
      )
}
