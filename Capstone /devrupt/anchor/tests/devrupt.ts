import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Devrupt } from "../target/types/devrupt";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  createMint,
  createInitializeMintInstruction,
  MINT_SIZE
} from "@solana/spl-token";
import { expect } from "chai";

describe("Devrupt SBT Program - SPL Token Based Test Suite", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.devrupt as Program<Devrupt>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;

  // Test configuration
  const TEST_USERNAME = `test-${Date.now()}`;
  const IPFS_CID = "QmTestSBTMetadata123456";
  const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  // Track SBT data across tests
  const sbts: Array<{
    mint: Keypair;
    tokenAccount: PublicKey;
    contributionNumber: number;
  }> = [];

  // Account addresses
  let contributorStatePda: PublicKey;

  before("Setup test environment", async () => {
    console.log("🔧 Setting up test environment...");
    console.log("💰 Wallet:", wallet.publicKey.toString());
    console.log("🔗 Program:", program.programId.toString());
    
    // Calculate contributor state PDA
    [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("📍 Account addresses calculated:");
    console.log("   Contributor State:", contributorStatePda.toString());
  });

  it("1. Initialize Contributor", async () => {
    console.log("\n1️⃣ Testing contributor initialization...");

    try {
      const initTx = await program.methods
        .initializeContributor(TEST_USERNAME)
        .accounts({
          payer: wallet.publicKey,
        })
        .rpc();

      console.log("✅ Contributor initialized. Tx:", initTx);

      // Verify the account was created
      const contributorState = await program.account.contributorState.fetch(contributorStatePda);
      
      expect(contributorState.wallet.toString()).to.equal(wallet.publicKey.toString());
      expect(contributorState.githubUsername).to.equal(TEST_USERNAME);
      expect(contributorState.totalContributions.toNumber()).to.equal(0);
      expect(contributorState.totalRewards.toNumber()).to.equal(0);

      console.log("✅ All assertions passed for contributor initialization");
      
    } catch (error) {
      if (error.message && error.message.includes("already in use")) {
        console.log("ℹ️ Contributor already exists, verifying state...");
        
        const contributorState = await program.account.contributorState.fetch(contributorStatePda);
        expect(contributorState.wallet.toString()).to.equal(wallet.publicKey.toString());
        console.log("✅ Existing contributor state verified");
      } else {
        throw error;
      }
    }
  });

  it("2. Record Multiple Contributions", async () => {
    console.log("\n2️⃣ Testing multiple contribution recording...");

    // Get initial state
    const initialState = await program.account.contributorState.fetch(contributorStatePda);
    const initialContributions = initialState.totalContributions.toNumber();
    console.log("📊 Initial contributions:", initialContributions);

    // Record 3 contributions for SBT minting
    for (let i = 1; i <= 3; i++) {
      const contribTx = await program.methods
        .recordContribution()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log(`✅ Contribution ${i} recorded. Tx:`, contribTx);
    }

    // Verify the contributions were recorded
    const updatedState = await program.account.contributorState.fetch(contributorStatePda);
    const newContributions = updatedState.totalContributions.toNumber();

    expect(newContributions).to.equal(initialContributions + 3);
    console.log(`✅ Contributions increased from ${initialContributions} to ${newContributions}`);
  });

  async function mintSBTForContribution(contributionNumber: number) {
    console.log(`\n🎖️ Minting SBT for contribution #${contributionNumber}...`);

    // Generate a new mint keypair for each SBT
    const mintKeypair = Keypair.generate();
    
    // Calculate associated token account for this mint
    const tokenAccount = getAssociatedTokenAddressSync(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );

    try {
      // Mint the SBT using our program - the program will create and initialize the mint
      const mintTx = await program.methods
        .sbtMint(IPFS_CID)
        .accountsPartial({
          mint: mintKeypair.publicKey,
        })
        .signers([mintKeypair])
        .rpc();

      console.log(`🎉 SBT #${contributionNumber} minted successfully! Tx:`, mintTx);

      // Store SBT info
      sbts.push({
        mint: mintKeypair,
        tokenAccount: tokenAccount,
        contributionNumber: contributionNumber
      });

      // Verify mint account exists and has correct properties
      const mintInfo = await getMint(
        provider.connection,
        mintKeypair.publicKey,
        "confirmed",
        TOKEN_PROGRAM_ID
      );

      expect(mintInfo.decimals).to.equal(0);
      expect(mintInfo.supply).to.equal(BigInt(1));
      console.log(`✅ Mint #${contributionNumber} verified - decimals: 0, supply: 1`);

      // Verify token account exists and has correct balance
      const tokenAccountInfo = await getAccount(
        provider.connection,
        tokenAccount,
        "confirmed",
        TOKEN_PROGRAM_ID
      );

      expect(tokenAccountInfo.amount).to.equal(BigInt(1));
      expect(tokenAccountInfo.mint.toString()).to.equal(mintKeypair.publicKey.toString());
      expect(tokenAccountInfo.owner.toString()).to.equal(wallet.publicKey.toString());
      console.log(`✅ Token account #${contributionNumber} verified - balance: 1`);

      return true;
      
    } catch (error) {
      console.log(`⚠️ SBT #${contributionNumber} minting failed:`, error.message);
      console.error(error);
      return false;
    }
  }

  it("3. Mint First SBT", async () => {
    const success = await mintSBTForContribution(1);
    expect(success).to.be.true;
  });

  it("4. Mint Second SBT", async () => {
    const success = await mintSBTForContribution(2);
    expect(success).to.be.true;
  });

  it("5. Mint Third SBT", async () => {
    const success = await mintSBTForContribution(3);
    expect(success).to.be.true;
  });

  it("6. Verify All SBTs and Contributor State", async () => {
    console.log("\n6️⃣ Verifying all SBTs and contributor state...");

    // Verify contributor state shows correct totals
    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    
    console.log("📊 Final Contributor Stats:");
    console.log("   Username:", contributorState.githubUsername);
    console.log("   Total Contributions:", contributorState.totalContributions.toNumber());
    console.log("   Total Rewards:", contributorState.totalRewards.toNumber());

    // Verify each SBT exists and has balance of 1
    console.log("\n🎖️ Verifying all SBT balances:");
    for (const sbt of sbts) {
      const tokenAccountInfo = await getAccount(
        provider.connection, 
        sbt.tokenAccount,
        "confirmed",
        TOKEN_PROGRAM_ID
      );
      expect(tokenAccountInfo.amount).to.equal(BigInt(1));
      console.log(`   SBT #${sbt.contributionNumber}: ✅ Balance = 1`);
    }

    console.log(`\n🎉 SUCCESS! Created 3 contributions and minted ${sbts.length} SBTs!`);
    
    // Verify we have the expected number of SBTs
    expect(sbts.length).to.equal(3);
    expect(contributorState.totalRewards.toNumber()).to.be.greaterThan(0);
  });

  it("7. Display Final Summary", async () => {
    console.log("\n🎊 FINAL TEST SUMMARY");
    console.log("======================");

    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    
    console.log("✅ Program ID:", program.programId.toString());
    console.log("✅ Wallet:", wallet.publicKey.toString());
    console.log("✅ Contributor:", contributorState.githubUsername);
    console.log("✅ Total Contributions:", contributorState.totalContributions.toNumber());
    console.log("✅ Total SBTs Minted:", sbts.length);
    console.log("✅ Total Rewards:", contributorState.totalRewards.toNumber());

    console.log("\n🎖️ SBT ADDRESSES:");
    console.log("==================");
    for (const sbt of sbts) {
      console.log(`SBT #${sbt.contributionNumber}:`);
      console.log(`   Mint: ${sbt.mint.publicKey.toString()}`);
      console.log(`   Token Account: ${sbt.tokenAccount.toString()}`);
      console.log(`   Explorer: https://explorer.solana.com/address/${sbt.mint.publicKey.toString()}?cluster=localnet`);
    }

    console.log("\n🌐 PROGRAM EXPLORER:");
    console.log("=====================");
    console.log(`🔗 Program: https://explorer.solana.com/address/${program.programId.toString()}?cluster=localnet`);
    console.log(`🔗 Contributor State: https://explorer.solana.com/address/${contributorStatePda.toString()}?cluster=localnet`);

    console.log("\n🎉 ALL TESTS PASSED! SPL TOKEN-BASED SBT SYSTEM WORKING PERFECTLY!");
  });
});
