import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";

// Recreate the Keypair for your dev wallet
const from = Keypair.fromSecretKey(new Uint8Array(wallet));

// 🔁 Replace this with *your own Turbin3 address* if it's different
const to = new PublicKey("455q3UD1KkfMP7zWrd2XcYoZW8LaVoiU969cmusengZ9");

// Connect to Solana Devnet
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: LAMPORTS_PER_SOL / 10, // 0.1 SOL
      })
    );

    // Get recent blockhash
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    transaction.feePayer = from.publicKey;

    // Sign and send transaction
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      from,
    ]);

    console.log(`✅ Success! View your TX here:
  https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  } catch (e) {
    console.error("❌ Error sending transaction:", e);
  }
})();
