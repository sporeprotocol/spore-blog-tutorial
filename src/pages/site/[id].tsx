import useWallet from '@/hooks/useWallet';
import { Indexer } from '@ckb-lumos/lumos';
import { getSporeScript, unpackToRawClusterData, unpackToRawSporeData, bufferToRawString } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Site } from '..';
import { config } from '@/config';
import Link from 'next/link';

type Post = {
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
      const indexer = new Indexer(config.ckbIndexerUrl);
      const { script } = getSporeScript(config, 'Cluster');
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

    (async () => {
      const indexer = new Indexer(config.ckbIndexerUrl);
      const { script } = getSporeScript(config, 'Spore');
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
