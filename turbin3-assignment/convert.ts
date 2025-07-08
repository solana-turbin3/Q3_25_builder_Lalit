// convert.ts
import bs58 from "bs58";
import promptSync from "prompt-sync";

const prompt = promptSync();

const choice = prompt("1: base58 to wallet | 2: wallet to base58: ");

if (choice === "1") {
  const base58 = prompt("Enter base58 private key: ");
  const secretKey = bs58.decode(base58);
  console.log("Decoded SecretKey: ", Array.from(secretKey));
} else if (choice === "2") {
  const keyString = prompt("Enter wallet array: ");
  const wallet = JSON.parse(keyString);
  const base58 = bs58.encode(Buffer.from(wallet));
  console.log("Base58 Private Key: ", base58);
}
