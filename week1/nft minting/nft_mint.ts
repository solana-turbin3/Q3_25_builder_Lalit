import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import { createNft, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import base58 from "bs58";

const wallet = require("./mym.json"); 
const RPC_ENDPOINT = "https://api.devnet.solana.com";
const umi = createUmi(RPC_ENDPOINT);

// Convert secret key to keypair and signer
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const myKeypairSigner = createSignerFromKeypair(umi, keypair);

// Attach signer and token metadata plugins
umi.use(signerIdentity(myKeypairSigner));
umi.use(mplTokenMetadata());

// Generate new mint keypair
const mint = generateSigner(umi);

const metadataUri = "https://gateway.irys.xyz/5pA4sFsKxYwQ3Qt897Bb9ZBNaVTdUvodLosAS3wNy7HW";

(async () => {
  try {
    // Create NFT transaction
    const tx = createNft(umi, {
      mint,
      name: "labubu",
      symbol: "lubu",
      uri: metadataUri,
      sellerFeeBasisPoints: percentAmount(0), // 0% royalty
      decimals: 0,
      isMutable: true,
    });

    const result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);

    console.log("✅ Successfully Minted!");
    console.log(`🔗 TX: https://explorer.solana.com/tx/${signature}?cluster=devnet`);
    console.log(`🎯 Mint Address: ${mint.publicKey}`);
  } catch (error) {
    console.error("❌ Minting failed:", error);
  }
})();
