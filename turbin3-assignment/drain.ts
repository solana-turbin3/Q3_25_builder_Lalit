// drain.ts
import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const from = Keypair.fromSecretKey(new Uint8Array(wallet));
const to = new PublicKey("455q3UD1KkfMP7zWrd2XcYoZW8LaVoiU969cmusengZ9");

const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    const balance = await connection.getBalance(from.publicKey);
    const tempTx = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance,
      })
    );
    tempTx.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    tempTx.feePayer = from.publicKey;

    const fee =
      (await connection.getFeeForMessage(
        tempTx.compileMessage(),
        "confirmed"
      )).value || 0;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: balance - fee,
      })
    );
    transaction.recentBlockhash = tempTx.recentBlockhash;
    transaction.feePayer = from.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);
    console.log(`✅ Success! View your TX here:
https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error("❌ Oops, something went wrong:", e);
  }
})();
