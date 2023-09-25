# Tutorial: Create simple on-chain blog with Spore Protocol

This tutorial will guide you through the process of using the Spore Protocol to create an on-chain blog. With the Spore Protocol, you can store your blog posts fully on the blockchain and allow others to access them. Following my footsteps will realize a simple on-chain blog, just like the online demo I deployed here: [https://spore-blog-tutorial.vercel.app](https://spore-blog-tutorial.vercel.app/)

Here is the code repository that goes along with this tutorial: [https://github.com/sporeprotocol/spore-blog-tutorial](https://github.com/sporeprotocol/spore-blog-tutorial). You can view or checkout different branches to see the code at different stages. I will also let you know which branch corresponds to each stage when it ends.

## Prerequisites

Before we get started, let's take a look at the technology stack used in this tutorial:

- **Next.js**: We'll use Next.js as our framework to quickly set up our project.
- **React**: We'll use React to handle some simple view logic, but feel free to use any other framework you prefer.
- **Spore SDK**: This TypeScript SDK is based on Lumos and allows us to interact with the Spore Protocol.
- **Lumos**: A powerful Nervos CKB dapp framework used to interact with CKB.

## Getting started

First, we need a scaffold to build upon. For this tutorial, we'll use Next.js as the foundation for our project. You can clone the basic project code by running the following command:

```bash
git clone -b base https://github.com/sporeprotocol/spore-blog-tutorial.git
```

In the project directory, run `npm install` and `npm run dev`. You can then access [http://localhost:3000](http://localhost:3000/) and see "Hello World" displayed on the browser.

![scaffold](https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/6c131048-c11f-4010-9b78-46fcf635c834)

## Connect to wallet

Great start! In order to get started, the first step is to connect to your wallet. By connecting your wallet account, all the content that you create and publish on our on-chain blog will be associated with your wallet and will be securely and permanently stored on the blockchain. This ensures that your content remains safe, immutable, and easily accessible at all times.

To simplify, we will use MetaMask as the chosen wallet. With MetaMask, we can easily interact to get your CKB address and check your balance. To proceed with connect wallet and sign transactions, install the MetaMask browser extension. Download it [here](https://metamask.io/download/).

Next, we'll need to call some of MetaMask's methods on our page. To interact with MetaMask on our page, we'll be using [Wagmi](https://wagmi.sh/) to simplify our logic. Specifically, we'll make use of the `useConnect` and `useAccount` hooks.

First, let's install `wagmi` for our project:

```bash
npm install wagmi viem --save
```

We'll add some code in `src/pages/_app.tsx` to initialize the Wagmi configuration:

```tsx
import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { WagmiConfig, createConfig, mainnet } from 'wagmi';
import { createPublicClient, http } from 'viem';

const config = createConfig({
  autoConnect: true,
  publicClient: createPublicClient({
    chain: mainnet,
    transport: http(),
  }),
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={config}>
      <Component {...pageProps} />
    </WagmiConfig>
  );
}

```

This allows us to connect to Ethereum using Wagmi on our page. Next, in `src/pages/index.tsx`, let's add some code to connect to MetaMask using Wagmi and display ETH address:

```tsx
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

```

Now, you'll see a "Connect Wallet" button in your browser. Clicking it will open the MetaMask popup, and after clicking "Connect," you'll be connected to the wallet and get the ETH address.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/b609a7c9-70fb-4c45-a0cd-3e3ede5f8cde

### Generate the CKB address

As you may know, MetaMask is primarily used on the Ethereum, while the Spore Protocol is based on Nervos CKB. Therefore, we need to generate the Lock Script for our CKB address based on the ETH address. By using the Omnilock, we can use our Ethereum public and private keys for transaction verification. Once we add the ETH address to the Lock Script, we can use it to generate transactions and sign them using MetaMask. If you're unfamiliar with Nervos CKB and Omnilock, you can check out the following links:

- [Nervos Network](https://www.nervos.org/)
- [Omnilock, a Universal Lock that Powers Interoperability](https://blog.cryptape.com/omnilock-a-universal-lock-that-powers-interoperability-1)

To use Omnilock, we'll rely on the @ckb-lumos/lumos library to help us. Let's install `@ckb-lumos/lumos` in our project:

```bash
npm install @ckb-lumos/lumos crypto-browserify --save
```

`@ckb-lumos/lumos` is a library that can be used in both Node.js and browser environments, we need to configure some node polyfills when using it in the browser. Add the following configuration in `next.config.js` at the root of your project:

```bash
const webpack = require('webpack');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => { // <- Add some webpack config
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      buffer: require.resolve('buffer'),
      encoding: false,
      path: false,
      fs: false,
      stream: false,
    };

    config.plugins = [
      ...config.plugins,
      new webpack.ProvidePlugin({ Buffer: ['buffer', 'Buffer'] }),
    ];
    return config;
  },
};

module.exports = nextConfig;
```

Now we can use lumos in our project. In `src/pages/index.tsx`, add the following code to generate the CKB address based on the ETH address:

```tsx
import { commons, config, helpers } from '@ckb-lumos/lumos';
// ...

const { address: ethAddress, isConnected } = useAccount();
// ...
const address = useMemo(() => {
  if (!ethAddress) return;

  const lock = commons.omnilock.createOmnilockScript({
    auth: { flag: 'ETHEREUM', content: ethAddress ?? '0x' },
  });
  return helpers.encodeToAddress(lock, { config: config.predefined.AGGRON4 });
}, [ethAddress]);
```

By using `commons.omnilock.createOmnilockScript` provided by @ckb-lumos/lumos, we can easily generate an Omnilock based on the ETH address. In CKB, the CKB address represents the underlying Lock Script, so we can obtain the CKB address from the omnilock.

Let's change the displayed address on the page from ETH address to CKB address:

```tsx
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
```

Now, you'll see your CKB address in the browser.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/82a547d9-949e-4390-af5e-e7b6e1e2fce8

### Get CKB balance

Now that we have a CKB address, the next step is to retrieve our CKB balance and we need to claim some CKB on the faucet for future transactions. 

We are now creating a file to store the logic for querying the balance of the CKB address on the Nervos CKB testnet:

```tsx
// src/utils/balance.ts
import { Indexer, config } from '@ckb-lumos/lumos';
import { BI, helpers } from '@ckb-lumos/lumos';

const CKB_RPC_URL = '<https://testnet.ckb.dev/rpc>';
const CKB_INDEXER_URL = '<https://testnet.ckb.dev/indexer>';

const indexer = new Indexer(CKB_INDEXER_URL, CKB_RPC_URL);

export async function getCapacities(address: string): Promise<BI> {
  config.initializeConfig(config.predefined.AGGRON4);
  const collector = indexer.collector({
    lock: helpers.parseAddress(address),
		args: '0x',
  });

  let capacities = BI.from(0);
  for await (const cell of collector.collect()) {
    capacities = capacities.add(cell.cellOutput.capacity);
  }

  return capacities;
}

```

This logic mainly does the following things: We use the Indexer provided by @ckb-lumos/lumos for querying, so we need to create a new indexer using the testnet's RPC URL and Indexer URL. We generate the lock using the given CKB address for the query, and then add up the capacity of the queried cells to get our final CKB amount.

Now we can use the `getCapacities` function to query the CKB balance and display it on the page. Add the following code to `src/pages/index.tsx` to retrieve and display the CKB balance:

```tsx
import { getCapacities } from '../utils/balance';

// ...

const [balance, setBalance] = useState<BI | null>(null);

useEffect(() => {
  if (!address) {
    return;
  }
  getCapacities(address).then((capacities) => {
    setBalance(capacities.div(10 ** 8).toNumber());
  });
}, [address]);

// ...

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

```

On the page, you will see your CKB address and the corresponding CKB balance. You may have noticed that in the above code, we perform some calculations after obtaining the amount of CKB from `getCapacities`. This is because the unit of CKB Cell Capacity is shannons, and 1 CKB represents 1 byte, so we need to divide capacities by 10 to the power of 8 to get the balance of CKB.

Since we are using a new CKB address generated by Omnilock + ETH address, you will see that the displayed balance is 0. We need to claim some testnet CKB on the [Nervos Pudge Faucet](https://faucet.nervos.org/) to support our subsequent transactions. After you claim CKB on the Faucet, you will be able to see the corresponding CKB balance on the page.

![get-capacities](https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/75b8470a-f709-410a-b413-89d96a44f028)

Now we have completed the functionality of connecting the wallet and retrieving the CKB address and balance. Next, we will start building our on-chain blog, including the ability to create new site, publish and retrieve blog posts.

<aside>
💡 You can check out the connect-wallet branch on the associated code repository to view all the code for this stage: `git checkout connect-wallet`

</aside>

## Create new site

Here we will truly start using the Spore Protocol to create an on-chain blog. First, we need to understand two concepts in the Spore Protocol, with the main one being Spore. Spore is built on the Cell model and is a Cell of Type Script for Spore. We primarily use it to store data, and in this tutorial, it will be used to store blog posts. The other concept is Cluster, which is a Cell of Type Script for Spore Cluster. It represents a collection of Cells, and we will use it to represent our site.

![spore-protocol](https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/7afa38ea-7809-470b-8371-afc568ad425c)

Let's start with the simplest part. When creating a site, we need a form to input the site name and description, and we need a button to request the transaction for creating the site (i.e., creating a Spore Cluster). We add the following code in `src/pages/index.ts`:

```tsx
const [siteName, setSiteName] = useState('');
const [siteDescription, setSiteDescription] = useState('');

// ...

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
      <div>Balance: {balance} CKB</div>
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

```

Now we have a simple form that, when the "Create" button is clicked, will get the values of `name` and `description`.

### Request transaction

Now let's generate our first transaction using the [Spore SDK](https://github.com/sporeprotocol/spore-sdk), which is a TypeScript SDK for the Spore Protocol. It provides methods to simplify the process of generating transactions. First, we need to install the SDK in our project:

```bash
npm install @spore-sdk/core
```

Since we want to create a cluster to represent our site, we will use the `createCluster` method. We add the following code in the `handleCreateSite` function in `src/pages/index.tsx`:

```tsx
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

```

Let's explain the purpose of this code step by step:

- First, we use `createCluster` to generate the transaction for creating the cluster. The parameters include the `name` and `description` fields from the form we created earlier. These are the field names for the data that can be stored in the Spore Cluster Cell, so we pass them directly. `fromInfos` indicates from where the transaction’s sponsors specifies to collect capacity, i.e., who will pay the transaction capacity & fee. `toLock` indicates who owns the final created Spore Cluster Cell. In our tutorial, both of these are ourselves, so we fill in our lock and address.
- Next, we call `signTransaction` to sign the transaction. Specifically, the page will use MetaMask to sign the transaction. We haven't implemented this yet, but we will do so later.
- Finally, we send the signed transaction to the blockchain using the RPC of the Nervos CKB testnet. After `rpc.sendTransaction` is called, it will return a transaction hash. However, this does not mean that the transaction is successful. We still need to wait for the block on the blockchain to be mined and confirmed for the transaction to be considered successful.

So good so far, let's implement `signTransaction`. Create the `src/utils/transaction.ts` file and add the following code:

```tsx
import { commons, config, helpers } from '@ckb-lumos/lumos';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { signMessage } from 'wagmi/actions';

export async function signTransaction(
  txSkeleton: helpers.TransactionSkeletonType,
) {
  config.initializeConfig(config.predefined.AGGRON4);
  let tx = commons.omnilock.prepareSigningEntries(txSkeleton);

  const signedWitnesses = new Map<string, string>();
  const signingEntries = tx.get('signingEntries')!;
  for (let i = 0; i < signingEntries.size; i += 1) {
    const entry = signingEntries.get(i)!;
    if (entry.type === 'witness_args_lock') {
      const { message, index } = entry;
      if (signedWitnesses.has(message)) {
        const signedWitness = signedWitnesses.get(message)!;
        tx = tx.update('witnesses', (witnesses) => {
          return witnesses.set(index, signedWitness);
        });
        continue;
      }

      let signature = await signMessage({ message: { raw: message } as any });

      // Fix ECDSA recoveryId v parameter
      // <https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v>
      let v = Number.parseInt(signature.slice(-2), 16);
      if (v >= 27) v -= 27;
      signature = ('0x' +
        signature.slice(2, -2) +
        v.toString(16).padStart(2, '0')) as `0x${string}`;

      const signedWitness = bytes.hexify(
        blockchain.WitnessArgs.pack({
          lock: commons.omnilock.OmnilockWitnessLock.pack({
            signature: bytes.bytify(signature!).buffer,
          }),
        }),
      );
      signedWitnesses.set(message, signedWitness);

      tx = tx.update('witnesses', (witnesses) => {
        return witnesses.set(index, signedWitness);
      });
    }
  }

  const signedTx = helpers.createTransactionFromSkeleton(tx);
  return signedTx;
}

```

This implementation may be a bit complex and requires some background knowledge of Nervos CKB to understand. If you are not familiar with it, you can simply copy and use this code.

In summary, the `signTransaction` function roughly follows this logic: First, we need to get the `signingEntries` from the passed `txSkeleton` and use MetaMask to sign the messages within. After signing, we need to perform some processing (mainly to handle the ECDSA recoveryID v parameter) and use the methods provided by @ckb-lumos/lumos to pack the signature into the witness corresponding to Omnilock. We then fill it back into the `txSkeleton` and generate the signed transaction for sending to the Nervos CKB.

After adding the implementation of `signTransaction`, we can create our site. After confirming the MetaMask signature request, you can see the transaction hash in the console of the DevTools. You can copy it and query it on [CKB Explorer](https://pudge.explorer.nervos.org/). For example, you can see my transaction for creating a website: [https://pudge.explorer.nervos.org/transaction/0xc2c2ea9d99a2f2819efd95cdace0672817474d51881ca0edbc66cbb5eaa0cbae](https://pudge.explorer.nervos.org/transaction/0xc2c2ea9d99a2f2819efd95cdace0672817474d51881ca0edbc66cbb5eaa0cbae)

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/3c0b3612-a995-4ae1-a48c-8b8a3a32527c

### Show all sites

After creating the site, we cannot see it yet. At this stage, we can only see the Spore Cluster Cell in CKB Explorer. Now let's add some code to display it on the page. Add the following code in `src/pages/index.tsx`:

```tsx
const hex2String = (hex: string) => {
  return Buffer.from(hex, 'hex').toString('utf-8');
};

const [sites, setSites] = useState<Site[]>([]);

// ...

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
```

The logic here is simple and similar to getting the capacities of the  CKB address earlier. The difference is that besides passing lock into `indexer.collector`, we also pass in Type Script corresponding to Spore Cluster, which means we are querying for cells with Type Script type as Spore Cluster and belong to us. After obtaining these Spore Cluster Cells, we need to use `ClusterData.unpack` provided by Spore SDK to get the data from the cell. At this point, the unpacked data is still represented in Hex, so we added `hex2String` to convert it into user-friendly strings. After collecting the data from the Indexer, we save it in the `sites` state.

Then we display them:

```tsx
return (
    <div>
      // ...
      <div>
        <h2>My Sites</h2>
        <ul>
          {sites.map((site) => (
            <li key={site.id}>{site.name}</li>
          ))}
        </ul>
      </div>
    </div>
  );
```

This way, we have obtained the Spore Cluster that we just created from the blockchain, which is our site.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/3c69ea64-1475-4544-a6b9-26b9f0902b86

### Add site homepage

Okay, next we need to add a new page as the homepage of the site. Although we don't have any blog posts now, we need to have a site homepage and then add the functionality to publish post on top of it, and the published posts will be displayed on the site homepage.

Since there will be a new page, we need to add a copy of the logic for connecting wallet to the new page because we haven't persisted the connect state. Here we extract the logic for connecting wallet into `src/hooks/useWallet.ts` file:

```tsx
import { commons, config, helpers } from '@ckb-lumos/lumos';
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
  const [balance, setBalance] = useState(0);

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
        ? helpers.encodeToAddress(lock,
          {
            config: config.predefined.AGGRON4
          })
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

  return {
    address,
    lock,
    balance,
    isConnected,
    connect,
    disconnect
  };
}
```

We have already explained the part about connecting to the wallet before, so we won't go into it again here. I suggest you directly copy this code into your project because it is not the focus of this tutorial.

At the same time, we replace the relevant parts in `src/pages/index.tsx` with:

```tsx
const { address, lock, balance, isConnected, connect, disconnect } =
useWallet();
```

Then we add a new page `src/pages/site/[id].tsx`:

```tsx
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
  const [siteInfo,setSiteInfo] = useState<Site>();

   useEffect(() => {
     if (!id) {
       return;
     }

     (async () => {
       const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
       const{ script} = predefinedSporeConfigs.Aggron4.scripts.Cluster;
       const collector=indexer.collector({
         type:{...script,args:id as string},
       });

       for await (const cell of collector.collect()) {
         const unpacked = ClusterData.unpack(cell.data);
         setSiteInfo({
           id:cell.cellOutput.type!.args,
           name:hex2String(unpacked.name.slice(2)),
           description:hex2String(unpacked.description.slice(2))
         });
       }
     })();
   },[id,lock]);

  return (
    <div>
      <h1>{siteInfo?.name}</h1>
      <p>{siteInfo?.description}</p>
      {isConnected ? (
        <button>Add Post</button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
      <div></div>
    </div>
  );
}

```

As shown above, the logic here for fetch all site information is not much different from before. The only difference is that we get the id parameter (which is the cluster id) from the router to use as a query parameter in `indexer.collector`. We query type for Spore Cluster and args for the current id of Spore Cluster Cell. After that, we unpack it and save it to `siteInfo` and display it on the page.

Oh, by the way, don't forget to add links on all previous sites that redirect to this new site's homepage:

```tsx
// src/pages/index.tsx

return (
  // ...
  <li key={site.id}>
    <Link href={`/site/${site.id}`}>{site.name}</Link>
  </li>
);
```

Now we can jump to the homepage in the list of all sites. Although there is currently only the name and description, don't worry, everything will be added soon.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/7aaaf7db-6bd2-469c-a939-22ef272f8ec4

<aside>
💡 You can check out the create-site branch on the associated code repository to view all the code for this stage: `git checkout create-site`

</aside>

## Publish post

Just like before, we need a submission form before publishing a post. To simplify the process, we won't use any text editor here. Instead, we will use a simple textarea for input. You can replace it with any text editor component you prefer.

Create a new page to create a new post and publish it:

```tsx
// src/pages/post/new.tsx
import useWallet from '@/hooks/useWallet';
import { signTransaction } from '@/utils/transaction';
import { RPC } from '@ckb-lumos/lumos';
import { createSpore, predefinedSporeConfigs } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function NewPoost() {
  const router = useRouter();
  const { id } = router.query;
  const { address, lock, isConnected, connect } = useWallet();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handlePublishPost = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!address || !lock) return;

    const { txSkeleton } = await createSpore({
      data: {
        content: Buffer.from(JSON.stringify({ title, content })),
        contentType: 'application/json',
        clusterId: id as string,
      },
      fromInfos: [address],
      toLock: lock,
    });
    const tx = await signTransaction(txSkeleton);
    const rpc = new RPC(predefinedSporeConfigs.Aggron4.ckbNodeUrl);
    const hash = await rpc.sendTransaction(tx, 'passthrough');
    setTitle('');
    setContent('');
    console.log(hash);
  };

  return (
    <div>
      {isConnected ? (
        <form onSubmit={handlePublishPost}>
          <div>
            <label htmlFor="title">Title: </label>
            <div>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label htmlFor="content">Content</label>
            <div>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
          </div>
          <button type="submit">Publish</button>
        </form>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
}
```

Then let's add a button on the homepage of the site to navigate to this new page for publish post:

```tsx
// src/page/site/[id].tsx

return (
  // ...
  <button onClick={() => router.push(`/post/new?id=${id}`)}>
    Add Post
  </button>
);

```

We are taking off at full speed. We have already used `createCluster` in the Spore SDK before, now it's time to use the heavyweight `createSpore`, which is our protagonist. All our blog posts are stored in Spore, fully on the blockchain and immutable.

In the above code, we use `createSpore` to generate transactions for create Spore Cell. It is similar to how we used `createCluster` before but with more content saved in Spore.

There are two fields related to content in Spore: `contentType` and `content`. For our blog posts, we will save the title and content of each post in `content`, using binary format. Then we mark `contentType` as `application/json`, so that when we retrieve the Spore Cell later, we can unpack data and treat it as JSON string. You may notice that with both `contentType` and `content`, any content can be saved, that's how powerful Spore is.

The title and content entered will be saved in Spore using JSON format, and later on, we will parse data from Spore in the same way.

```tsx
{
  "title": "My post",
  "content": "Hello World"
}
```

Another point to note in the `createSpore` data is the `clusterId` field. This field is used to associate Spore with a Cluster. With this field, we can query all Spores associated with a specific clusterId, which means all posts on our site in this tutorial.

After generate the unsigned transaction using `createSpore`, just like before, we call `signTransaction` to request MetaMask for signature. Once signed, it will be sent to the blockchain and wait for confirmation. As mentioned earlier, you will see the transaction hash in the console and can check its status on CKB Explorer.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/872bc760-b986-429f-9129-05d864ec5afb

Here is the transaction  I requested in the video: [https://pudge.explorer.nervos.org/transaction/0x40959ca68f00c3b2e2dfc99344d4be9503e63962885add4d5b15339ca6e825cb](https://pudge.explorer.nervos.org/transaction/0x40959ca68f00c3b2e2dfc99344d4be9503e63962885add4d5b15339ca6e825cb)

### Show all blog posts

We have published a new blog post, and now we need to query them from the blockchain and display them on the page. Obviously, you may already know how to do it. Following the implementation of displaying all site lists, we can easily achieve it.

Add some code in `src/pages/site/[id].tsx` to display all posts:

```tsx
const [posts, setPosts] = useState<Post[]>([]);

useEffect(() => {
	// ...

    (async () => {
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Spore;
      const collector = indexer.collector({
        type: { ...script, args: '0x' },
        lock,
      });

      const posts = [];
      for await (const cell of collector.collect()) {
        const unpacked = SporeData.unpack(cell.data);
        const contentType = hex2String(unpacked.contentType.slice(2));

        if (contentType !== 'application/json' || unpacked.clusterId !== id) {
          continue;
        }

        const { title, content } =
          JSON.parse(hex2String(unpacked.content.slice(2))) ?? {};
        if (title && content) {
          posts.push({
            id: cell.cellOutput.type!.args,
            title,
            content,
          });
        }
      }
      setPosts(posts);
    })();
}, [id, lock])

```

After loading on the homepage of the site, we use Indexer to retrieve all Spore Cells that belong to you from the blockchain. Then we filter them based on `contentType` and `clusterId`, ensuring that we get only the blog posts for this current site that we want. Then as mentioned before, we unpack the data and parse it using JSON string format, and finally save it in the `posts` state.

After obtaining and saving the post data, we need to display it on the page:

```tsx
return (
  // ...
  <div>
    <h2>Posts</h2>
    <ul>
      {posts.map((post) => (
        <li key={post.id}>
          <Link href={`/post/${post.id}`}>{post.title}</Link>
        </li>
      ))}
    </ul>
  </div>
);
```

![site-homepage](https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/96dba643-cc2a-4042-9290-c202f576bb47)

### Show blog post

We are almost done, now we just need to show the blog post data saved in Spore. We add a new page in our project:

```tsx
// src/pages/post/[id].tsx
import { hex2String } from '@/utils/helpers';
import { Indexer } from '@ckb-lumos/lumos';
import { SporeData, predefinedSporeConfigs } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useRemark } from 'react-remark';
import { Post } from '../site/[id]';

export default function Post() {
  const router = useRouter();
  const { id } = router.query;
  const [post, setPost] = useState<Post>();
  const [reactContent, setMarkdownSource] = useRemark();

  useEffect(() => {
    if (!id) {
      return;
    }

    (async () => {
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Spore;
      const collector = indexer.collector({
        type: {...script, args: id as string},
      });

      for await (const cell of collector.collect()) {
        const unpacked = SporeData.unpack(cell.data);

        const{ title, content} =
          JSON.parse(hex2String(unpacked.content.slice(2))) ?? {};
        if(title && content){
          setPost({
            id: cell.cellOutput.type!.args,
            title,
            content,
          });
          return;
        }
      }
    })();
  }, [id]);

  useEffect(() => {
    setMarkdownSource(post?.content ?? '');
  }, [post,setMarkdownSource]);

  return (
    <div>
      <h1>{post?.title}</h1>
      <div style={{ width: '600px' }}>{reactContent}</div>
    </div>
  );
}

```

The steps are similar to before. We use the spore id passed in from the page route as a query condition, combined with Spore Type Script, we can query the specific Spore Cell we need. Then unpack & JSON parse, and after obtaining our data, display it. By now, we have repeated this process several times already. I believe you already know how to retrieve the desired data on Nervos CKB.

While writing this part of the code, I thought about putting The Nervos CKB Whitepaper on the blockchain. Therefore, I used `react-remark` to render Markdown content here. If you don't need it, you can ignore this part. You can see an example at [The Nervos Network Positioning Paper - Spore Blog Tutorial](https://spore-blog-tutorial.vercel.app/post/0x40a190ca8f5c64c66381e87769f5816a624c4f7868dc2c5246584dbb9574b20a), and this post was developed and published following the steps in this tutorial.

Now let's take a look at the blog post we just created with only "Hello World" content.

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/8865787a-2d67-4774-8de6-5c97974014f7

### Delete post

With the publication of posts, there naturally needs to be a function to delete posts. Due to the immutable nature of Spore, modifying the content of an post can only be achieved by delete and republish.

This may sound ordinary and not very exciting. However, on Nervos CKB, things are different from other blockchain-based blogging platforms like Mirror or xLog. When publishing content on these platforms, the fees paid during transactions disappear. But on CKB, storage space equals value. Therefore, when you publish a blog post, the amount of storage space you occupy corresponds to the number of CKB tokens being used. Only a small amount of CKB is used for transaction fees. And when you delete this blog post, those occupied CKB tokens are unlocked again and can be used once more. This encourages everyone to store valuable content on the blockchain. Exciting, isn't it?

Alright then! Let's add the delete functionality and retrieve your CKB tokens back. We simply add their respective delete buttons after each post in the list on our site's homepage:

```tsx
return (
  <ul>
    {posts.map((post) => (
      <li key={post.id}>
        <Link href={`/post/${post.id}`}>{post.title}</Link>
        {isConnected && (
          <button onClick={() => handlePostDelete(post.id)}>
            delete
          </button>
        )}
      </li>
    ))}
  </ul>
);

```

Now let's implement the logic for when a delete button is clicked; it's similar to what we did when creating posts before but this time we will use `destroySpore`, which is provided by Spore SDK:

```tsx
const handlePostDelete = async (id: string) => {
    if (!address) return;

    const post = posts.find((post) => post.id === id);
    if (!post) return;

    const { txSkeleton } = await destroySpore({
      outPoint: post.outPoint,
      fromInfos: [address],
    });
    const tx = await signTransaction(txSkeleton);
    const rpc = new RPC(predefinedSporeConfigs.Aggron4.ckbNodeUrl);
    const hash = await rpc.sendTransaction(tx, 'passthrough');
    setTimeout(() => fetchPosts(), 1000);
    console.log(hash);
  };

```

It looks similar to before, the only thing we need to pay attention to is the `outPoint` field. We just need to pass the outPoint of the Spore Cell obtained from query the blog post list earlier. The rest of the transaction-related steps are exactly the same as before.

That's it! We have implemented the functionality to delete blog posts. If you observe closely, you will notice that your CKB balance increases after an post is deleted!

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/e0ea1701-4132-42de-b6bb-68d44e60cfa6

https://github.com/sporeprotocol/spore-blog-tutorial/assets/9718515/7999cb17-1312-4ff6-aac4-58b7b402fde0

<aside>
💡 You can check out the publish-post branch on the associated code repository to view all the code for this stage: `git checkout publish-post`

</aside>

## What's next

We have basically completed the development of this simple on-chain blog. However, you may have noticed that our data is currently being requested directly from Nervos CKB RPC on the webpage. In Spore, data is actually immutable, so we don't need to query it every time. Here, we can switch to using SSR (Server-Side Rendering) supported by Next.js to implement it. The specific implementation details are not the focus of this tutorial in this tutorail. You can check the corresponding changes in the deploy section of the accompanying code repository: `git checkout deploy`

That's it, the tutorial ends here. Let's summarize the process we implemented briefly. First, in step one, we connect to a wallet using MetaMask and Wgami for convenience. Then, we create a Spore Cluster Cell through a form to represent our site. With the help of Spore SDK, we generate transaction and use Lumos' RPC to send them. Next, we retrieve data from the blockchain using Indexer and display it.

After creating the site, we add another form to publish blog posts. The process is similar to creating a site but different in that Spore Cell can carry more data and has high flexibility in content types. It can be associated with the previously created Spore Cluster Cell.

Finally, using the same method as before, we query for all blog posts on the blockchain and display them on the page.

If you are familiar with these steps mentioned above then this whole process is very simple. With this implementation of an on-chain blog completed here if you want further development you can add your favorite text editor or support images or related resource files being uploaded onto chain (creating multiple Spore Cells when publishing an posts). You can also improve its webpage style to make it beautiful! 

Looking forward to your final achievements.
