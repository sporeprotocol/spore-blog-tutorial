import useWallet from '@/hooks/useWallet';
import { hex2String } from '@/utils/helpers';
import { Indexer } from '@ckb-lumos/lumos';
import {
  ClusterData,
  SporeData,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Site } from '..';
import Link from 'next/link';

export type Post = {
  id: string;
  title: string;
  content: string;
};

export default function SitePage() {
  const router = useRouter();
  const { id } = router.query;
  const { lock, isConnected, connect } = useWallet();
  const [siteInfo, setSiteInfo] = useState<Site>();
  const [posts, setPosts] = useState<Post[]>([]);

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
        const unpacked = ClusterData.unpack(cell.data);
        setSiteInfo({
          id: cell.cellOutput.type!.args,
          name: hex2String(unpacked.name.slice(2)),
          description: hex2String(unpacked.description.slice(2)),
        });
      }
    })();

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
  }, [id, lock]);

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
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
