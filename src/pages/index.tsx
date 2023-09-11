import useWallet from '@/hooks/useWallet';
import { hex2String } from '@/utils/helpers';
import { Indexer } from '@ckb-lumos/lumos';
import {
  ClusterData,
  SporeData,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
import { useEffect, useState } from 'react';
import { useCallback } from 'react';
import { Post, Site } from '../type';
import Link from 'next/link';

const id = process.env.NEXT_PUBLIC_SITE_ID;

export default function SitePage() {
  const { lock } = useWallet();
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
  }, []);

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
  }, [lock]);

  useEffect(() => {
    if (!id) {
      return;
    }

    fetchSiteInfo();
    fetchPosts();
  }, [fetchSiteInfo, fetchPosts]);

  if (!siteInfo) {
    return null;
  }

  return (
    <div>
      <h1>{siteInfo.name}</h1>
      <p>{siteInfo.description}</p>
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
