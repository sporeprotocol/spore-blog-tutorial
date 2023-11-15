import useWallet from '@/hooks/useWallet';
import { Indexer, OutPoint, RPC } from '@ckb-lumos/lumos';
import {
  bufferToRawString,
  meltSpore,
  predefinedSporeConfigs,
  unpackToRawClusterData,
  unpackToRawSporeData,
} from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { Site } from '..';
import Link from 'next/link';
import { signTransaction } from '@/utils/transaction';

export type Post = {
  id: string;
  title: string;
  content: string;
  outPoint: OutPoint;
};

export default function SitePage() {
  const router = useRouter();
  const { id } = router.query;
  const { lock, isConnected, connect } = useWallet();
  const [siteInfo, setSiteInfo] = useState<Site>();
  const [posts, setPosts] = useState<Post[]>([]);
  const { address } = useWallet();

  const fetchPosts = useCallback(async () => {
    const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
    const { script } = predefinedSporeConfigs.Aggron4.scripts.Spore;
    const collector = indexer.collector({
      type: { ...script, args: '0x' },
      lock,
    });

    const posts = [];
    for await (const cell of collector.collect()) {
      const unpacked = unpackToRawSporeData(cell.data);
      const { contentType } = unpacked;

      if (contentType !== 'application/json' || unpacked.clusterId !== id) {
        continue;
      }

      const { title, content } =
        JSON.parse(bufferToRawString(unpacked.content)) ?? {};
      if (title && content) {
        posts.push({
          id: cell.cellOutput.type!.args,
          title,
          content,
          outPoint: cell.outPoint!,
        });
      }
    }
    setPosts(posts);
  }, [id, lock]);

  useEffect(() => {
    if (!id) {
      return;
    }

    (async () => {
      const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
      const { script } = predefinedSporeConfigs.Aggron4.scripts.Cluster;
      const collector = indexer.collector({
        type: { ...script, args: id as string },
      });

      for await (const cell of collector.collect()) {
        const unpacked = unpackToRawClusterData(cell.data);
        setSiteInfo({
          id: cell.cellOutput.type!.args,
          name: unpacked.name,
          description: unpacked.description,
        });
      }
    })();
    fetchPosts();
  }, [id, lock, fetchPosts]);

  const handlePostDelete = async (id: string) => {
    if (!address) return;

    const post = posts.find((post) => post.id === id);
    if (!post) return;

    const { txSkeleton } = await meltSpore({
      outPoint: post.outPoint,
      fromInfos: [address],
    });
    const tx = await signTransaction(txSkeleton);
    const rpc = new RPC(predefinedSporeConfigs.Aggron4.ckbNodeUrl);
    const hash = await rpc.sendTransaction(tx, 'passthrough');
    setTimeout(() => fetchPosts(), 1000);
    console.log(hash);
  };

  return (
    <div>
      <h1>{siteInfo?.name}</h1>
      <p>{siteInfo?.description}</p>
      {isConnected ? (
        <button onClick={() => router.push(`/post/new?id=${id}`)}>
          Add Post
        </button>
      ) : (
        <button onClick={() => connect()}>Connect Wallet</button>
      )}
      <div>
        <h2>Posts</h2>
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
      </div>
    </div>
  );
}
