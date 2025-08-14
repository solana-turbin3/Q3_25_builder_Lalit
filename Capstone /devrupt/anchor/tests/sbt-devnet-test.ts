// import * as anchor from "@coral-xyz/anchor";
// import { Program } from "@coral-xyz/anchor";
// import { Devrupt } from "../target/types/devrupt";
// import { 
//   PublicKey, 
//   Keypair, 
//   SystemProgram,
//   SYSVAR_RENT_PUBKEY
// } from "@solana/web3.js";
// import { 
//   TOKEN_2022_PROGRAM_ID,
//   ASSOCIATED_TOKEN_PROGRAM_ID,
//   getAssociatedTokenAddressSync,
//   getAccount,
//   getMint
// } from "@solana/spl-token";
// import { expect } from "chai";

// describe("🧪 Devnet SBT Minting Test", () => {
//   // Configure the client to use devnet
//   const provider = anchor.AnchorProvider.env();
//   anchor.setProvider(provider);

//   const program = anchor.workspace.devrupt as Program<Devrupt>;
//   const wallet = provider.wallet as anchor.Wallet;

//   // Test configuration
//   const TEST_USERNAME = `sbt-test-${Date.now()}`;
//   const IPFS_CID = "QmTestSBTMetadata123456789";
//   const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

//   // Account addresses
//   let contributorStatePda: PublicKey;

//   // Helper function to calculate SBT-specific PDAs based on rewards count
//   const calculateSbtPdas = (rewardsCount: number) => {
//     // Convert rewards count to little-endian bytes for PDA calculation
//     const rewardsBuffer = Buffer.alloc(8);
//     rewardsBuffer.writeBigUInt64LE(BigInt(rewardsCount), 0);

//     const [mintPda] = PublicKey.findProgramAddressSync(
//       [Buffer.from("mint"), wallet.publicKey.toBuffer(), rewardsBuffer],
//       program.programId
//     );

//     const [metadataPda] = PublicKey.findProgramAddressSync(
//       [
//         Buffer.from("metadata"),
//         METAPLEX_PROGRAM_ID.toBuffer(),
//         mintPda.toBuffer(),
//       ],
//       METAPLEX_PROGRAM_ID
//     );

//     const userTokenAccount = getAssociatedTokenAddressSync(
//       mintPda,
//       wallet.publicKey,
//       false,
//       TOKEN_2022_PROGRAM_ID
//     );

//     return { mintPda, metadataPda, userTokenAccount };
//   };

//   before("🚀 Setup Devnet Test Environment", async () => {
//     console.log("\n🌐 DEVNET SBT MINTING TEST");
//     console.log("=========================");
//     console.log("📍 Network:", provider.connection.rpcEndpoint);
//     console.log("👛 Wallet:", wallet.publicKey.toString());
//     console.log("📦 Program:", program.programId.toString());
    
//     // Calculate contributor state PDA
//     [contributorStatePda] = PublicKey.findProgramAddressSync(
//       [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
//       program.programId
//     );
//     console.log("🏗️  Contributor PDA:", contributorStatePda.toString());

//     // Check wallet balance
//     const balance = await provider.connection.getBalance(wallet.publicKey);
//     console.log("💰 Wallet Balance:", balance / 1e9, "SOL");
    
//     if (balance < 0.1e9) {
//       console.log("⚠️  Low balance! Get devnet SOL at: https://faucet.solana.com");
//     }
//   });

//   it("🔧 1. Setup Contributor (if needed)", async () => {
//     console.log("\n🔧 Setting up contributor...");
    
//     try {
//       // Try to fetch existing contributor
//       const existingState = await program.account.contributorState.fetch(contributorStatePda);
//       console.log("✅ Contributor already exists:");
//       console.log("   Username:", existingState.githubUsername);
//       console.log("   Contributions:", existingState.totalContributions.toNumber());
//       console.log("   Rewards:", existingState.totalRewards.toNumber());
      
//     } catch (error) {
//       // Contributor doesn't exist, create it
//       console.log("🆕 Creating new contributor...");
      
//       const initTx = await program.methods
//         .initializeContributor(TEST_USERNAME)
//         .accounts({
//           payer: wallet.publicKey,
//         })
//         .rpc();

//       console.log("✅ Contributor created! Tx:", initTx);
//       console.log("🔗 Explorer:", `https://explorer.solana.com/tx/${initTx}?cluster=devnet`);
//     }
//   });

//   it("📝 2. Record Contributions", async () => {
//     console.log("\n📝 Recording contributions...");
    
//     // Get current state
//     let contributorState = await program.account.contributorState.fetch(contributorStatePda);
//     const initialContributions = contributorState.totalContributions.toNumber();
//     console.log("Initial contributions:", initialContributions);

//     // Ensure we have at least 1 contribution for SBT minting
//     if (initialContributions === 0) {
//       console.log("Recording first contribution...");
//       const contribTx = await program.methods
//         .recordContribution()
//         .accounts({
//           signer: wallet.publicKey,
//         })
//         .rpc();

//       console.log("✅ Contribution recorded! Tx:", contribTx);
//       console.log("🔗 Explorer:", `https://explorer.solana.com/tx/${contribTx}?cluster=devnet`);

//       // Verify
//       contributorState = await program.account.contributorState.fetch(contributorStatePda);
//       console.log("Updated contributions:", contributorState.totalContributions.toNumber());
//     } else {
//       console.log("✅ Already have contributions, ready for SBT minting!");
//     }
//   });

//   it("🎨 3. Mint SBT on Devnet", async () => {
//     console.log("\n🎨 MINTING SBT ON DEVNET");
//     console.log("========================");

//     // Get current contributor state
//     let contributorState = await program.account.contributorState.fetch(contributorStatePda);
//     const currentRewardsCount = contributorState.totalRewards.toNumber();
    
//     console.log("📊 Current Stats:");
//     console.log("   Contributions:", contributorState.totalContributions.toNumber());
//     console.log("   Rewards (SBTs):", currentRewardsCount);

//     // Calculate next SBT number
//     const nextSBTNumber = currentRewardsCount + 1;
//     console.log("\n🎯 Minting SBT #" + nextSBTNumber);

//     // Calculate PDAs for the SBT using current rewards count
//     const { mintPda, metadataPda, userTokenAccount } = calculateSbtPdas(currentRewardsCount);

//     console.log("🔗 SBT Addresses:");
//     console.log("   Mint PDA:", mintPda.toString());
//     console.log("   Metadata PDA:", metadataPda.toString());
//     console.log("   Token Account:", userTokenAccount.toString());

//     try {
//       console.log("\n🚀 Executing mint transaction...");
      
//       const mintTx = await program.methods
//         .mintSbt(IPFS_CID)
//         .accounts({
//           payer: wallet.publicKey,
//           mint: mintPda,
//           tokenAccount: userTokenAccount,
//           metadata: metadataPda,
//         })
//         .rpc({
//           commitment: "confirmed"
//         });

//       console.log("🎉 SUCCESS! SBT MINTED ON DEVNET!");
//       console.log("📋 Transaction:", mintTx);
//       console.log("🔗 Explorer:", `https://explorer.solana.com/tx/${mintTx}?cluster=devnet`);

//       // Wait a bit for confirmation
//       await new Promise(resolve => setTimeout(resolve, 3000));

//       // Verify the SBT was created
//       console.log("\n🔍 Verifying SBT...");
      
//       try {
//         const mintInfo = await getMint(
//           provider.connection,
//           mintPda,
//           "confirmed",
//           TOKEN_2022_PROGRAM_ID
//         );

//         console.log("✅ SBT Verification:");
//         console.log("   Supply:", mintInfo.supply.toString());
//         console.log("   Decimals:", mintInfo.decimals);
//         console.log("   Mint Authority:", mintInfo.mintAuthority?.toString());
//         console.log("   Freeze Authority:", mintInfo.freezeAuthority?.toString());

//         // Check token account
//         try {
//           const tokenAccountInfo = await getAccount(
//             provider.connection,
//             userTokenAccount,
//             "confirmed",
//             TOKEN_2022_PROGRAM_ID
//           );

//           console.log("✅ Token Account:");
//           console.log("   Owner:", tokenAccountInfo.owner.toString());
//           console.log("   Mint:", tokenAccountInfo.mint.toString());
//           console.log("   Amount:", tokenAccountInfo.amount.toString());

//         } catch (error) {
//           console.log("⚠️  Token account verification failed:", error.message);
//         }

//       } catch (error) {
//         console.log("⚠️  Mint verification failed:", error.message);
//       }

//       // Check updated contributor state
//       contributorState = await program.account.contributorState.fetch(contributorStatePda);
//       console.log("\n📊 Updated Stats:");
//       console.log("   Contributions:", contributorState.totalContributions.toNumber());
//       console.log("   Rewards (SBTs):", contributorState.totalRewards.toNumber());

//       expect(contributorState.totalRewards.toNumber()).to.be.greaterThan(0);

//     } catch (error) {
//       console.log("❌ SBT Minting Failed:");
//       console.log("Error:", error.message);
      
//       if (error.logs) {
//         console.log("\n📋 Program Logs:");
//         error.logs.forEach((log, index) => {
//           console.log(`   ${index + 1}. ${log}`);
//         });
//       }

//       // Let's check what went wrong
//       console.log("\n🔍 Debugging Information:");
//       console.log("Expected metadata PDA:", metadataPda.toString());
//       console.log("Mint PDA:", mintPda.toString());
//       console.log("Token program:", TOKEN_2022_PROGRAM_ID.toString());
//       console.log("Metaplex program:", METAPLEX_PROGRAM_ID.toString());

//       throw error; // Re-throw to fail the test
//     }
//   });

//   it("🔗 4. Display Explorer Links", async () => {
//     console.log("\n🔗 DEVNET EXPLORER LINKS");
//     console.log("========================");

//     const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    
//     console.log("📦 Program:", `https://explorer.solana.com/address/${program.programId.toString()}?cluster=devnet`);
//     console.log("👛 Wallet:", `https://explorer.solana.com/address/${wallet.publicKey.toString()}?cluster=devnet`);
//     console.log("🏗️  Contributor:", `https://explorer.solana.com/address/${contributorStatePda.toString()}?cluster=devnet`);

//     // Show all minted SBTs
//     for (let i = 1; i <= contributorState.totalRewards.toNumber(); i++) {
//       const rewardCountBuffer = Buffer.alloc(8);
//       rewardCountBuffer.writeBigUInt64LE(BigInt(i - 1), 0);

//       const [mintPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("mint"), wallet.publicKey.toBuffer(), rewardCountBuffer],
//         program.programId
//       );

//       const userTokenAccount = getAssociatedTokenAddressSync(
//         mintPda,
//         wallet.publicKey,
//         false,
//         TOKEN_2022_PROGRAM_ID
//       );

//       console.log(`🎨 SBT #${i}:`);
//       console.log(`   Mint: https://explorer.solana.com/address/${mintPda.toString()}?cluster=devnet`);
//       console.log(`   Token: https://explorer.solana.com/address/${userTokenAccount.toString()}?cluster=devnet`);
//     }

//     console.log("\n✅ ALL TESTS COMPLETED ON DEVNET!");
//   });
// });
