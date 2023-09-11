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
          <button type="submit">Create</button>
        </form>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
    </div>
  );
}
