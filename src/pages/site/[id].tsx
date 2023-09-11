import useWallet from '@/hooks/useWallet';
import { hex2String } from '@/utils/helpers';
import { Indexer, RPC } from '@ckb-lumos/lumos';
import {
  ClusterData,
  SporeData,
  destroySpore,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCallback } from 'react';
import { signTransaction } from '@/utils/transaction';
import { Post, Site } from '../../type';

export default function SitePage() {
  const router = useRouter();
  const { id } = router.query;
  const { address, lock, isConnected, connect } = useWallet();
  const [siteInfo, setSiteInfo] = useState<Site>();
  const [posts, setPosts] = useState<Post[]>([]);

  const fetchSiteInfo = useCallback(async () => {
    const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
    const { script } = predefinedSporeConfigs.Aggron4.scripts.Cluster;
    const collector = indexer.collector({
      type: { ...script, args: id as string },
    });

    for await (const cell of collector.collect()) {
      const unpacked = ClusterData.unpack(cell.data);
      setSiteInfo({
        id: cell.cellOutput.type!.args,
        name: hex2String(unpacked.name.slice(2)),
        description: hex2String(unpacked.description.slice(2)),
      });
    }
  }, [id]);

  const fetchPosts = useCallback(async () => {
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

    fetchSiteInfo();
    fetchPosts();
  }, [id, fetchSiteInfo, fetchPosts]);

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
