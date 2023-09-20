import { commons, config, helpers } from '@ckb-lumos/lumos';
import { blockchain } from '@ckb-lumos/base';
import { bytes } from '@ckb-lumos/codec';
import { signMessage } from 'wagmi/actions';

export async function signTransaction(
  txSkeleton: helpers.TransactionSkeletonType,
) {
  config.initializeConfig(config.predefined.AGGRON4);
  let tx = commons.omnilock.prepareSigningEntries(txSkeleton);

  const signedWitnesses = new Map<string, string>();
  const signingEntries = tx.get('signingEntries')!;
  for (let i = 0; i < signingEntries.size; i += 1) {
    const entry = signingEntries.get(i)!;
    if (entry.type === 'witness_args_lock') {
      const { message, index } = entry;
      if (signedWitnesses.has(message)) {
        const signedWitness = signedWitnesses.get(message)!;
        tx = tx.update('witnesses', (witnesses) => {
          return witnesses.set(index, signedWitness);
        });
        continue;
      }

      let signature = await signMessage({ message: { raw: message } as any });

      // Fix ECDSA recoveryId v parameter
      // https://bitcoin.stackexchange.com/questions/38351/ecdsa-v-r-s-what-is-v
      let v = Number.parseInt(signature.slice(-2), 16);
      if (v >= 27) v -= 27;
      signature = ('0x' +
        signature.slice(2, -2) +
        v.toString(16).padStart(2, '0')) as `0x${string}`;

      const signedWitness = bytes.hexify(
        blockchain.WitnessArgs.pack({
          lock: commons.omnilock.OmnilockWitnessLock.pack({
            signature: bytes.bytify(signature!).buffer,
          }),
        }),
      );
      signedWitnesses.set(message, signedWitness);

      tx = tx.update('witnesses', (witnesses) => {
        return witnesses.set(index, signedWitness);
      });
    }
  }

  const signedTx = helpers.createTransactionFromSkeleton(tx);
  return signedTx;
}
