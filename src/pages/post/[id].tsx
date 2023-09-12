import { hex2String } from '@/utils/helpers';
import { Indexer } from '@ckb-lumos/lumos';
import { SporeData, predefinedSporeConfigs } from '@spore-sdk/core';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useRemark } from 'react-remark';
import { Post } from '../../type';
import {
  GetServerSidePropsContext,
  GetStaticPaths,
  GetStaticPathsContext,
  GetStaticProps,
} from 'next';

async function fetchPost(id: string) {
  const indexer = new Indexer(predefinedSporeConfigs.Aggron4.ckbIndexerUrl);
  const { script } = predefinedSporeConfigs.Aggron4.scripts.Spore;
  const collector = indexer.collector({
    type: { ...script, args: id as string },
  });

  for await (const cell of collector.collect()) {
    const unpacked = SporeData.unpack(cell.data);

    const { title, content } =
      JSON.parse(hex2String(unpacked.content.slice(2))) ?? {};
    if (title && content) {
      return {
        id: cell.cellOutput.type!.args,
        outPoint: cell.outPoint!,
        title,
        content,
      };
    }
  }
}

export const getStaticPaths: GetStaticPaths = () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
}

export const getStaticProps: GetStaticProps<{}, { id: string }> = async (context) => {
  if (!context.params?.id) {
    return {
      notFound: true,
    };
  }
  const post = await fetchPost(context.params.id as string);

  return {
    props: {
      post,
    },
  };
};

export default function Post({ post }: { post?: Post }) {
  const [reactContent, setMarkdownSource] = useRemark();

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
