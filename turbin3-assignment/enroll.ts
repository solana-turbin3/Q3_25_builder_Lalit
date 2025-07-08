import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { IDL, Turbin3Prereq } from "./programs/Turbin3_prereq";
import wallet from "./turbin3-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");
const provider = new AnchorProvider(connection, new Wallet(keypair), {
  commitment: "confirmed",
});
const programId = new PublicKey("TRBZyQHB3m68FGeVsqTK39Wm4xejadjVhP5MAZaKWDM");

const program = new Program<Turbin3Prereq>(IDL, provider);

// PDA
const [account_key] = PublicKey.findProgramAddressSync(
  [Buffer.from("prereqs"), keypair.publicKey.toBuffer()],
  program.programId
);

// Mint and collection
const mintCollection = new PublicKey(
  "5ebsp5RChCGK7ssRZMVMufgVZhd2kFbNaotcZ5UvytN2"
);
const mintTs = Keypair.generate();
const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

const [authorityPDA] = PublicKey.findProgramAddressSync(
  [Buffer.from("collection"), mintCollection.toBuffer()],
  program.programId
);

(async () => {
  try {
    const tx1 = await program.methods
      .initialize("lalitcap23") // Your GitHub username
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        system_program: SystemProgram.programId,
      })
      .signers([keypair])
      .rpc();
    console.log(`✅ Initialize Success:
      https://explorer.solana.com/tx/${tx1}?cluster=devnet`);
  } catch (e) {
    console.error("❌ Initialize failed:", e);
  }

  try {
    // console.log(Object.keys(program.methods));

    const tx2 = await (program.methods as any)
      .submitTs()
      .accountsPartial({
        user: keypair.publicKey,
        account: account_key,
        mint: mintTs.publicKey,
        collection: mintCollection,
        authority: authorityPDA, // ✅ Corrected this line
        mpl_core_program: MPL_CORE_PROGRAM_ID,
        system_program: SystemProgram.programId,
      })
      .signers([keypair, mintTs])
      .rpc();

    console.log(`✅ Submit TS + Mint Success:
https://explorer.solana.com/tx/${tx2}?cluster=devnet`);
  } catch (e) {
    console.error("❌ Submit TS failed:", e);
  }
})();
