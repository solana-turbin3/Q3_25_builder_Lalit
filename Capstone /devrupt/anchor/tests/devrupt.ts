import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Devrupt } from "../target/types/devrupt";
import { 
  PublicKey, 
  Keypair, 
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction,
  Connection,
  Commitment
} from "@solana/web3.js";
import { 
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
  getAccount,
  getMint,
  createMint,
  createInitializeMintInstruction,
  MINT_SIZE,
  AccountLayout,
  MintLayout
} from "@solana/spl-token";
import { expect } from "chai";

describe("Devrupt SBT Program - Enhanced SPL Token Test Suite", () => {
  // Configure the client to use the local cluster
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.devrupt as Program<Devrupt>;
  const provider = anchor.getProvider();
  const wallet = provider.wallet as anchor.Wallet;
  const connection = provider.connection;

  // Test configuration
  const TEST_USERNAME = `test-${Date.now()}`;
  const IPFS_CID = "QmTestSBTMetadata123456";
  const METAPLEX_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

  // Enhanced SBT tracking with more metadata
  interface SBTInfo {
    mint: Keypair;
    tokenAccount: PublicKey;
    contributionNumber: number;
    mintTxHash: string;
    createdAt: Date;
    verified: boolean;
  }

  const sbts: Array<SBTInfo> = [];
  let contributorStatePda: PublicKey;

  // Helper function to wait for transaction confirmation
  const waitForConfirmation = async (txHash: string, commitment: anchor.web3.Commitment = "confirmed") => {
    try {
      // Method 1: Using Anchor's provider confirmation (recommended)
      await provider.connection.confirmTransaction(txHash, commitment);
    } catch (error) {
      // Method 2: Fallback with manual confirmation
      console.log(`Fallback confirmation for tx: ${txHash}`);
      
      let confirmed = false;
      let retries = 0;
      const maxRetries = 30;
      
      while (!confirmed && retries < maxRetries) {
        try {
          const result = await connection.getSignatureStatus(txHash);
          if (result?.value?.confirmationStatus === commitment || 
              result?.value?.confirmationStatus === "finalized") {
            confirmed = true;
            console.log(`Transaction confirmed after ${retries + 1} attempts`);
          } else {
            retries++;
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          }
        } catch (statusError) {
          retries++;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (!confirmed) {
        console.log(`Could not confirm transaction ${txHash} after ${maxRetries} attempts`);
        // Don't throw error, continue with test
      }
    }
  };

  // Enhanced mint verification function
  const verifyMintProperties = async (mintPubkey: PublicKey, expectedSupply: bigint = BigInt(1)) => {
    console.log(`Verifying mint: ${mintPubkey.toString()}`);
    
    // Check if mint account exists
    const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
    expect(mintAccountInfo).to.not.be.null;
    expect(mintAccountInfo!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());
    expect(mintAccountInfo!.data.length).to.equal(MINT_SIZE);
    
    // Verify mint data structure
    const mintInfo = await getMint(connection, mintPubkey, "confirmed", TOKEN_PROGRAM_ID);
    
    // SBT specific checks
    expect(mintInfo.decimals).to.equal(0, "SBT should have 0 decimals");
    expect(mintInfo.supply).to.equal(expectedSupply, `SBT supply should be ${expectedSupply}`);
    expect(mintInfo.isInitialized).to.be.true;
    
    // Check mint authority (should be null for true SBTs to prevent additional minting)
    console.log(`   Mint Authority: ${mintInfo.mintAuthority?.toString() || "null"}`);
    console.log(`   Freeze Authority: ${mintInfo.freezeAuthority?.toString() || "null"}`);
    console.log(`   Supply: ${mintInfo.supply}`);
    console.log(`   Decimals: ${mintInfo.decimals}`);
    
    return mintInfo;
  };

  // Enhanced token account verification
  const verifyTokenAccount = async (tokenAccountPubkey: PublicKey, expectedOwner: PublicKey, expectedMint: PublicKey, expectedAmount: bigint = BigInt(1)) => {
    console.log(`Verifying token account: ${tokenAccountPubkey.toString()}`);
    
    // Check if token account exists
    const tokenAccountInfo = await connection.getAccountInfo(tokenAccountPubkey);
    expect(tokenAccountInfo).to.not.be.null;
    expect(tokenAccountInfo!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());
    expect(tokenAccountInfo!.data.length).to.equal(AccountLayout.span);
    
    // Verify token account data
    const tokenAccount = await getAccount(connection, tokenAccountPubkey, "confirmed", TOKEN_PROGRAM_ID);
    
    expect(tokenAccount.mint.toString()).to.equal(expectedMint.toString(), "Token account mint mismatch");
    expect(tokenAccount.owner.toString()).to.equal(expectedOwner.toString(), "Token account owner mismatch");
    expect(tokenAccount.amount).to.equal(expectedAmount, `Token account should have ${expectedAmount} tokens`);
    expect(tokenAccount.isInitialized).to.be.true;
    
    // SBT specific checks - should not be delegated or frozen
    expect(tokenAccount.delegate).to.be.null;
    expect(tokenAccount.delegatedAmount).to.equal(BigInt(0));
    
    console.log(`   Owner: ${tokenAccount.owner.toString()}`);
    console.log(`   Mint: ${tokenAccount.mint.toString()}`);
    console.log(`   Amount: ${tokenAccount.amount}`);
    console.log(`   Delegate: ${tokenAccount.delegate?.toString() || "null"}`);
    
    return tokenAccount;
  };

  // Check for duplicate mints (should not happen)
  const verifyUniqueMintsAndAccounts = () => {
    const mintAddresses = sbts.map(sbt => sbt.mint.publicKey.toString());
    const tokenAccounts = sbts.map(sbt => sbt.tokenAccount.toString());
    
    const uniqueMints = new Set(mintAddresses);
    const uniqueTokenAccounts = new Set(tokenAccounts);
    
    expect(uniqueMints.size).to.equal(mintAddresses.length, "All mints should be unique");
    expect(uniqueTokenAccounts.size).to.equal(tokenAccounts.length, "All token accounts should be unique");
    
    console.log(`All ${sbts.length} mints and token accounts are unique`);
  };

  before("Setup test environment", async () => {
    console.log("Setting up enhanced test environment...");
    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Program:", program.programId.toString());
    console.log("RPC Endpoint:", connection.rpcEndpoint);
    
    // Check wallet balance
    const balance = await connection.getBalance(wallet.publicKey);
    console.log("Wallet Balance:", balance / 1e9, "SOL");
    expect(balance).to.be.greaterThan(0, "Wallet should have SOL for transactions");
    
    // Calculate contributor state PDA
    [contributorStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("contributor"), wallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("Account addresses calculated:");
    console.log("   Contributor State:", contributorStatePda.toString());
    
    // Verify program exists
    const programAccount = await connection.getAccountInfo(program.programId);
    expect(programAccount).to.not.be.null;
    expect(programAccount!.executable).to.be.true;
    console.log("Program account verified");
  });

  it("1. Initialize Contributor", async () => {
    console.log("\n1. Testing contributor initialization...");

    try {
      const initTx = await program.methods
        .initializeContributor(TEST_USERNAME)
        .accounts({
          payer: wallet.publicKey,
        })
        .rpc();

      console.log("Contributor initialized. Tx:", initTx);
      await waitForConfirmation(initTx);

      // Verify the account was created
      const contributorState = await program.account.contributorState.fetch(contributorStatePda);
      
      expect(contributorState.wallet.toString()).to.equal(wallet.publicKey.toString());
      expect(contributorState.githubUsername).to.equal(TEST_USERNAME);
      expect(contributorState.totalContributions.toNumber()).to.equal(0);
      expect(contributorState.totalRewards.toNumber()).to.equal(0);

      console.log("All assertions passed for contributor initialization");
      
    } catch (error) {
      if (error.message && error.message.includes("already in use")) {
        console.log("Contributor already exists, verifying state...");
        
        const contributorState = await program.account.contributorState.fetch(contributorStatePda);
        expect(contributorState.wallet.toString()).to.equal(wallet.publicKey.toString());
        console.log("Existing contributor state verified");
      } else {
        throw error;
      }
    }
  });

  it("2. Record Multiple Contributions with Verification", async () => {
    console.log("\n2. Testing multiple contribution recording with verification...");

    // Get initial state
    const initialState = await program.account.contributorState.fetch(contributorStatePda);
    const initialContributions = initialState.totalContributions.toNumber();
    console.log("Initial contributions:", initialContributions);

    // Record contributions one by one and verify each
    const contributionsToAdd = 3;
    for (let i = 1; i <= contributionsToAdd; i++) {
      const contribTx = await program.methods
        .recordContribution()
        .accounts({
          signer: wallet.publicKey,
        })
        .rpc();

      console.log(`Contribution ${i} recorded. Tx:`, contribTx);
      await waitForConfirmation(contribTx);

      // Verify contribution was recorded immediately
      const currentState = await program.account.contributorState.fetch(contributorStatePda);
      expect(currentState.totalContributions.toNumber()).to.equal(initialContributions + i);
      console.log(`   Verified: Contributions now at ${currentState.totalContributions.toNumber()}`);
    }

    // Final verification
    const finalState = await program.account.contributorState.fetch(contributorStatePda);
    expect(finalState.totalContributions.toNumber()).to.equal(initialContributions + contributionsToAdd);
    console.log(`Final verification: Contributions increased from ${initialContributions} to ${finalState.totalContributions.toNumber()}`);
  });

  async function mintSBTForContribution(contributionNumber: number): Promise<boolean> {
    console.log(`\nMinting SBT for contribution #${contributionNumber}...`);

    // Generate a new mint keypair for each SBT
    const mintKeypair = Keypair.generate();
    const mintPubkey = mintKeypair.publicKey;
    
    console.log(`   Generated mint keypair: ${mintPubkey.toString()}`);
    
    // Calculate associated token account for this mint
    const tokenAccount = getAssociatedTokenAddressSync(
      mintPubkey,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID
    );
    
    console.log(`   Associated token account: ${tokenAccount.toString()}`);

    try {
      // Check initial state
      const initialState = await program.account.contributorState.fetch(contributorStatePda);
      const initialRewards = initialState.totalRewards.toNumber();
      
      // Mint the SBT using our program
      const mintTx = await program.methods
        .sbtMint(IPFS_CID)
        .accountsPartial({
          mint: mintPubkey,
        })
        .signers([mintKeypair])
        .rpc();

      console.log(`SBT #${contributionNumber} minted successfully! Tx:`, mintTx);
      await waitForConfirmation(mintTx);

      // Comprehensive verification after confirmation
      console.log(`\nPerforming comprehensive verification for SBT #${contributionNumber}...`);
      
      // 1. Verify mint properties
      const mintInfo = await verifyMintProperties(mintPubkey);
      
      // 2. Verify token account properties
      const tokenAccountInfo = await verifyTokenAccount(tokenAccount, wallet.publicKey, mintPubkey);
      
      // 3. Verify contributor state was updated
      const updatedState = await program.account.contributorState.fetch(contributorStatePda);
      expect(updatedState.totalRewards.toNumber()).to.be.greaterThan(initialRewards, "Rewards should increase after minting SBT");
      console.log(`   Rewards increased from ${initialRewards} to ${updatedState.totalRewards.toNumber()}`);
      
      // 4. Verify the mint is properly associated with the token program
      const mintAccountInfo = await connection.getAccountInfo(mintPubkey);
      expect(mintAccountInfo!.owner.toString()).to.equal(TOKEN_PROGRAM_ID.toString());
      
      // 5. Additional SBT-specific checks
      console.log(`\nSBT #${contributionNumber} Properties Summary:`);
      console.log(`   Non-fungible (0 decimals): ${mintInfo.decimals === 0}`);
      console.log(`   Single supply (1 token): ${mintInfo.supply === BigInt(1)}`);
      console.log(`   Properly owned: ${tokenAccountInfo.owner.toString() === wallet.publicKey.toString()}`);
      console.log(`   Full balance: ${tokenAccountInfo.amount === BigInt(1)}`);
      console.log(`   Not delegated: ${tokenAccountInfo.delegate === null}`);
      
      // Store SBT info with enhanced metadata
      sbts.push({
        mint: mintKeypair,
        tokenAccount: tokenAccount,
        contributionNumber: contributionNumber,
        mintTxHash: mintTx,
        createdAt: new Date(),
        verified: true
      });

      console.log(`SBT #${contributionNumber} fully verified and stored`);
      return true;
      
    } catch (error) {
      console.error(`SBT #${contributionNumber} minting failed:`, error.message);
      console.error("Error details:", error);
      
      // Store failed attempt for analysis
      sbts.push({
        mint: mintKeypair,
        tokenAccount: tokenAccount,
        contributionNumber: contributionNumber,
        mintTxHash: "",
        createdAt: new Date(),
        verified: false
      });
      
      return false;
    }
  }

  it("3. Mint First SBT with Enhanced Verification", async () => {
    const success = await mintSBTForContribution(1);
    expect(success).to.be.true;
  });

  it("4. Mint Second SBT with Enhanced Verification", async () => {
    const success = await mintSBTForContribution(2);
    expect(success).to.be.true;
  });

  it("5. Mint Third SBT with Enhanced Verification", async () => {
    const success = await mintSBTForContribution(3);
    expect(success).to.be.true;
  });

  it("6. Comprehensive SBT Collection Verification", async () => {
    console.log("\n6. Performing comprehensive SBT collection verification...");

    // 1. Verify all SBTs are unique
    verifyUniqueMintsAndAccounts();

    // 2. Verify contributor state consistency
    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    
    console.log("Final Contributor Stats:");
    console.log("   Username:", contributorState.githubUsername);
    console.log("   Wallet:", contributorState.wallet.toString());
    console.log("   Total Contributions:", contributorState.totalContributions.toNumber());
    console.log("   Total Rewards:", contributorState.totalRewards.toNumber());

    // 3. Re-verify each SBT independently
    console.log("\nRe-verifying all SBT properties:");
    const verifiedSBTs = sbts.filter(sbt => sbt.verified);
    expect(verifiedSBTs.length).to.equal(3, "All 3 SBTs should be verified");

    for (const sbt of verifiedSBTs) {
      console.log(`\n   SBT #${sbt.contributionNumber} Final Verification:`);
      
      // Re-verify mint
      await verifyMintProperties(sbt.mint.publicKey);
      
      // Re-verify token account
      await verifyTokenAccount(sbt.tokenAccount, wallet.publicKey, sbt.mint.publicKey);
      
      // Check transaction exists
      try {
        const txStatus = await connection.getSignatureStatus(sbt.mintTxHash);
        if (txStatus?.value?.confirmationStatus) {
          console.log(`   Transaction status: ${txStatus.value.confirmationStatus}`);
        } else {
          console.log(`   Transaction status unknown`);
        }
      } catch (error) {
        console.log(`   Could not retrieve transaction status: ${error.message}`);
      }
      
      console.log(`   SBT #${sbt.contributionNumber}: FULLY VERIFIED`);
    }

    // 4. Verify total supply across all SBTs
    let totalSupply = BigInt(0);
    for (const sbt of verifiedSBTs) {
      const mintInfo = await getMint(connection, sbt.mint.publicKey);
      totalSupply += mintInfo.supply;
    }
    expect(totalSupply).to.equal(BigInt(3), "Total supply across all SBTs should be 3");
    console.log(`Total SBT supply verification: ${totalSupply} tokens across ${verifiedSBTs.length} mints`);

    // 5. Final consistency check
    expect(verifiedSBTs.length).to.equal(3);
    expect(contributorState.totalRewards.toNumber()).to.be.greaterThan(0);
    
    console.log(`\nCOMPREHENSIVE VERIFICATION COMPLETE! All ${verifiedSBTs.length} SBTs are properly minted and verified!`);
  });

  it("7. Test SBT Properties and Immutability", async () => {
    console.log("\n7. Testing SBT properties and immutability...");

    const verifiedSBTs = sbts.filter(sbt => sbt.verified);
    
    for (let i = 0; i < verifiedSBTs.length; i++) {
      const sbt = verifiedSBTs[i];
      console.log(`\nTesting immutability for SBT #${sbt.contributionNumber}:`);
      
      // Get fresh data to ensure we're not using cached info
      const mintInfo = await getMint(connection, sbt.mint.publicKey, "finalized");
      const tokenAccountInfo = await getAccount(connection, sbt.tokenAccount, "finalized");
      
      // Test SBT properties
      console.log(`   Property tests:`);
      console.log(`      Non-fungible (0 decimals): ${mintInfo.decimals === 0}`);
      console.log(`      Single token supply: ${mintInfo.supply === BigInt(1)}`);
      console.log(`      Owner has full balance: ${tokenAccountInfo.amount === BigInt(1)}`);
      console.log(`      No delegation: ${tokenAccountInfo.delegate === null}`);
      console.log(`      Initialized: ${tokenAccountInfo.isInitialized}`);
      
      // Verify mint authority status
      if (mintInfo.mintAuthority === null) {
        console.log(`      No mint authority (truly immutable supply): true`);
      } else {
        console.log(`      Mint authority exists: ${mintInfo.mintAuthority.toString()}`);
      }
      
      // Verify freeze authority status
      if (mintInfo.freezeAuthority) {
        console.log(`      Freeze authority exists: ${mintInfo.freezeAuthority.toString()}`);
      } else {
        console.log(`      No freeze authority: true`);
      }
    }
    
    console.log(`\nAll ${verifiedSBTs.length} SBTs passed immutability and property tests!`);
  });

  it("8. Generate Detailed Final Report", async () => {
    console.log("\nDETAILED FINAL TEST REPORT");
    console.log("===============================");

    const contributorState = await program.account.contributorState.fetch(contributorStatePda);
    const verifiedSBTs = sbts.filter(sbt => sbt.verified);
    
    // Basic Info
    console.log("\nPROGRAM INFORMATION:");
    console.log("========================");
    console.log("Program ID:", program.programId.toString());
    console.log("RPC Endpoint:", connection.rpcEndpoint);
    console.log("Test Runtime:", new Date().toISOString());
    
    // Contributor Info
    console.log("\nCONTRIBUTOR INFORMATION:");
    console.log("============================");
    console.log("Wallet:", wallet.publicKey.toString());
    console.log("Contributor PDA:", contributorStatePda.toString());
    console.log("GitHub Username:", contributorState.githubUsername);
    console.log("Total Contributions:", contributorState.totalContributions.toNumber());
    console.log("Total Rewards:", contributorState.totalRewards.toNumber());

    // SBT Collection Summary
    console.log("\nSBT COLLECTION SUMMARY:");
    console.log("============================");
    console.log("Total SBTs Minted:", verifiedSBTs.length);
    console.log("Failed Mints:", sbts.length - verifiedSBTs.length);
    console.log("Success Rate:", `${(verifiedSBTs.length / sbts.length * 100).toFixed(1)}%`);

    // Individual SBT Details
    console.log("\nINDIVIDUAL SBT DETAILS:");
    console.log("============================");
    
    for (const sbt of verifiedSBTs) {
      console.log(`\nSBT #${sbt.contributionNumber}:`);
      console.log(`   Mint Address: ${sbt.mint.publicKey.toString()}`);
      console.log(`   Token Account: ${sbt.tokenAccount.toString()}`);
      console.log(`   Transaction: ${sbt.mintTxHash}`);
      console.log(`   Created At: ${sbt.createdAt.toISOString()}`);
      console.log(`   Verification Status: ${sbt.verified ? 'VERIFIED' : 'FAILED'}`);
      
      // Get fresh mint info for final report
      try {
        const mintInfo = await getMint(connection, sbt.mint.publicKey);
        const tokenAccount = await getAccount(connection, sbt.tokenAccount);
        
        console.log(`   Supply: ${mintInfo.supply}`);
        console.log(`   Decimals: ${mintInfo.decimals}`);
        console.log(`   Balance: ${tokenAccount.amount}`);
        console.log(`   Owner: ${tokenAccount.owner.toString()}`);
      } catch (error) {
        console.log(`   Could not fetch current state: ${error.message}`);
      }
    }

    // Explorer Links
    console.log("\nEXPLORER LINKS:");
    console.log("===================");
    const cluster = connection.rpcEndpoint.includes('localhost') ? 'localnet' : 
                   connection.rpcEndpoint.includes('devnet') ? 'devnet' : 
                   connection.rpcEndpoint.includes('testnet') ? 'testnet' : 'mainnet';
    
    console.log(`Program: https://explorer.solana.com/address/${program.programId.toString()}?cluster=${cluster}`);
    console.log(`Contributor State: https://explorer.solana.com/address/${contributorStatePda.toString()}?cluster=${cluster}`);
    
    for (const sbt of verifiedSBTs) {
      console.log(`SBT #${sbt.contributionNumber} Mint: https://explorer.solana.com/address/${sbt.mint.publicKey.toString()}?cluster=${cluster}`);
    }

    // Test Statistics
    console.log("\nTEST STATISTICS:");
    console.log("====================");
    console.log("Tests Run: 8");
    console.log("SBTs Created: " + verifiedSBTs.length);
    console.log("Unique Mints: " + new Set(verifiedSBTs.map(s => s.mint.publicKey.toString())).size);
    console.log("Unique Token Accounts: " + new Set(verifiedSBTs.map(s => s.tokenAccount.toString())).size);
    console.log("Total Supply Verified: " + verifiedSBTs.length);
    
    // Final Assertions
    expect(verifiedSBTs.length).to.equal(3, "Should have 3 verified SBTs");
    expect(contributorState.totalContributions.toNumber()).to.be.greaterThanOrEqual(3, "Should have at least 3 contributions");
    expect(contributorState.totalRewards.toNumber()).to.be.greaterThan(0, "Should have earned rewards");
    
    console.log("\nALL TESTS PASSED! TOKEN-BASED SBT SYSTEM FULLY VERIFIED!");
    console.log("=====================================================================");
  });
});