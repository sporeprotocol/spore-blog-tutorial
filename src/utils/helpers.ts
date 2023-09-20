export const hex2String = (hex: string) => {
  return Buffer.from(hex, 'hex').toString('utf-8');
};
