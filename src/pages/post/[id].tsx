import { Indexer } from '@ckb-lumos/lumos';
import {
  SporeData,
  bufferToRawString,
  predefinedSporeConfigs,
} from '@spore-sdk/core';
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
        type: { ...script, args: id as string },
      });

      for await (const cell of collector.collect()) {
        const unpacked = SporeData.unpack(cell.data);

        const { title, content } =
          JSON.parse(bufferToRawString(unpacked.content)) ?? {};
        if (title && content) {
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
  }, [post, setMarkdownSource]);

  return (
    <div>
      <h1>{post?.title}</h1>
      <div style={{ width: '600px' }}>{reactContent}</div>
    </div>
  );
}
