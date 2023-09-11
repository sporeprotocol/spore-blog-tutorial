import { OutPoint } from "@ckb-lumos/lumos";

export type Site = {
  id: string;
  name: string;
  description: string;
};

export type Post = {
  id: string;
  title: string;
  content: string;
  outPoint: OutPoint;
};

