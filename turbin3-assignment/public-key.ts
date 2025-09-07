import { Keypair } from "@solana/web3.js";

// Example: private key array
const secretKeyArray = [];
const keypair = Keypair.fromSecretKey(new Uint8Array(secretKeyArray));

// Get the public key
console.log("Public Key:", keypair.publicKey.toBase58());
