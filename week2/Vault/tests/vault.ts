import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import { PublicKey, SystemProgram, Keypair } from "@solana/web3.js";

describe("vault", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Vault as Program<Vault>;

  const vaultAccount = Keypair.generate(); 
  const user = Keypair.generate(); 

  it("Initializes the vault", async () => {
    await provider.connection.requestAirdrop(vaultAccount.publicKey, 1e9);

    const tx = await program.methods
      .initialize()
      .accounts({
        vault: vaultAccount.publicKey,
        user: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([vaultAccount])
      .rpc();

    console.log("✅ Vault initialized:", tx);
  });

  it("Deposits funds", async () => {
    const tx = await program.methods
      .deposit(new anchor.BN(1000000)) // 0.001 SOL
      .accounts({
        vault: vaultAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Deposited successfully:", tx);
  });

  it("Withdraws funds", async () => {
    const tx = await program.methods
      .withdraw(new anchor.BN(500000)) // withdraw half
      .accounts({
        vault: vaultAccount.publicKey,
        user: provider.wallet.publicKey,
      })
      .rpc();

    console.log("✅ Withdrawn successfully:", tx);
  });

  it("Fails if withdraw amount > balance", async () => {
    try {
      await program.methods
        .withdraw(new anchor.BN(9999999999)) // too much
        .accounts({
          vault: vaultAccount.publicKey,
          user: provider.wallet.publicKey,
        })
        .rpc();
      throw new Error("❌ This should have failed but didn't.");
    } catch (err) {
      console.log("✅ Expected failure:", err.message);
    }
  });

  it("Fails if unauthorized user tries to withdraw", async () => {
    await provider.connection.requestAirdrop(user.publicKey, 1e9);

    try {
      await program.methods
        .withdraw(new anchor.BN(1000))
        .accounts({
          vault: vaultAccount.publicKey,
          user: user.publicKey, // not the original owner
        })
        .signers([user])
        .rpc();
      throw new Error("❌ Unauthorized access succeeded unexpectedly.");
    } catch (err) {
      console.log("✅ Rejected unauthorized withdraw:", err.message);
    }
  });
});
