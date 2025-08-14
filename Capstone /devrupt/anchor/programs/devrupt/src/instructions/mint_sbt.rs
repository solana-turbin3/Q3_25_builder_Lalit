use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, MintTo};
use crate::contributor_state;
use crate::state::ContributorState;

#[derive(Accounts)]
#[instruction(amount: u64)]

pub struct MintSbt<'info>{

 #[account(mut)]
    pub payer: Signer<'info>,

        #[account(
         init_if_needed,
        payer = payer,
        space = 8 + 32 + 4 + github_username.len() + 8 + 8 + 1,
        seeds = [b"contributor", contributor_state.key().as_ref()],
        bump
    )]
    pub contributor_state: Account<'info, ContributorState>,
   
   #[account(mut)]
    pub mint: Account<'info, Mint>,

      #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = contributor
    )]
    pub contributor: SystemAccount<'info>,
    pub contributor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
 

 impl<'info> MintSbt<'info>{

    pub fn process(&mut self, github_username: String) -> Result<()> {
        let contributor = &mut self.contributor_state;

        // Initialize contributor state if not already initialized
        if contributor.total_contributions == 0 {
            contributor.wallet = self.payer.key();
            contributor.github_username = github_username;
            contributor.total_contributions = 0;
            contributor.total_rewards = 0;
            contributor.bump = self.bumps.contributor_state;
        }

        // Increment contributions
        contributor.total_contributions += 1;

      let cpi_account= MintTo{
        mint: self.mint.to_account_info(),
        to: self.contributor_ata.to_account_info(),
        authority: Self::to_account_info(),
      }; 

    let cpi_ctx= CpiContext::new (self.token_program.to_account_info(),cpi_accounts)
     mint_to(cpi_ctx, 1)?;


     contributor_state.total_rewards += 1;

        msg!(
            "Minted SBT for contributor: {} with CID: {}",
            contributor.github_username,
            cid
        );

       
    }
    
    Ok(())



 }

}






















































































   
//     #[account(
//         mut,
//         seeds = [b"contributor", payer.key().as_ref()],
//         bump = contributor_state.bump
//     )]
//     pub contributor_state: Account<'info, crate::state::ContributorState>,
//     pub token_program: Program<'info, Token2022>,
//     /// CHECK: This account will be created manually with proper Token-2022 extensions
//     #[account(mut)]
//     pub mint: UncheckedAccount<'info>,

//     /// CHECK: Token account will be created using associated token account
//     #[account(mut)]
//     pub token_account: InterfaceAccount<'info, TokenAccount>,

//     /// CHECK: Metadata account derived from mint
//     #[account(mut)]
//     pub metadata: UncheckedAccount<'info>,

//     /// CHECK: This is the Token Metadata Program
//     #[account(address = mpl_token_metadata::ID)]
//     pub token_metadata_program: UncheckedAccount<'info>,

//     pub token_program: Program<'info, Token2022>,
//     pub system_program: Program<'info, System>,
//     pub rent: Sysvar<'info, Rent>,
//     pub associated_token_program: Program<'info, AssociatedToken>,
// }

// pub fn handler(ctx: Context<MintSbt>, cid: String) -> Result<()> {
//     let payer = &ctx.accounts.payer;
//     let mint = &ctx.accounts.mint;
//     let token_account = &ctx.accounts.token_account;
//     let contributor_state = &mut ctx.accounts.contributor_state;

//     // Minimum contributions before minting
//     require!(
//         contributor_state.total_contributions >= 1,
//         crate::error::ErrorCode::InsufficientContributions
//     );

//     // Store current SBT number for PDA validation and metadata
//     let current_rewards = contributor_state.total_rewards;
//     let current_sbt_number = current_rewards + 1;

//     // Generate mint PDA based on current rewards count
//     let rewards_bytes = current_rewards.to_le_bytes();
//     let payer_key = payer.key();
//     let mint_seeds = [b"mint".as_ref(), payer_key.as_ref(), rewards_bytes.as_ref()];
//     let (expected_mint_pda, mint_bump) = Pubkey::find_program_address(&mint_seeds, ctx.program_id);

//     require!(
//         mint.key() == expected_mint_pda,
//         crate::error::ErrorCode::InvalidMetadataPDA
//     );

//     // Verify the metadata PDA is correct
//     let (expected_metadata_pda, _) = Pubkey::find_program_address(
//         &[
//             b"metadata",
//             mpl_token_metadata::ID.as_ref(),
//             mint.key().as_ref(),
//         ],
//         &mpl_token_metadata::ID,
//     );

//     require!(
//         ctx.accounts.metadata.key() == expected_metadata_pda,
//         crate::error::ErrorCode::InvalidMetadataPDA
//     );

//     // Verify the token account PDA is correct (should be ATA)
//     let expected_token_account =
//         anchor_spl::associated_token::get_associated_token_address(&payer.key(), &mint.key());

//     require!(
//         token_account.key() == expected_token_account,
//         crate::error::ErrorCode::InvalidMetadataPDA // Reusing existing error for now
//     );

//     // Calculate space needed for mint account with NonTransferable extension
//     let extension_types = vec![extension::nonTransferable];
//     let space =
//         ExtensionType::try_calculate_account_len::<spl_token_2022::state::Mint>(&extension_types)?;

//     // Create mint account with proper space for extensions
//     let rent = Rent::get()?;
//     let lamports = rent.minimum_balance(space);

//     let mint_signer_seeds = &[
//         b"mint".as_ref(),
//         payer_key.as_ref(),
//         rewards_bytes.as_ref(),
//         &[mint_bump],
//     ];

//     // Sp 1: teCreate mint account
//     anchor_lang::solana_program::program::invoke_signed(
//         &anchor_lang::solana_program::system_instruction::create_account(
//             &payer.key(),
//             &mint.key(),
//             lamports,
//             space as u64,
//             &spl_token_2022::ID,
//         ),
//         &[
//             payer.to_account_info(),
//             mint.to_account_info(),
//             ctx.accounts.system_program.to_account_info(),
//         ],
//         &[mint_signer_seeds],
//     )?;

//     // Step 2: Initialize NonTransferable extension
//     anchor_lang::solana_program::program::invoke(
//         &spl_token_2022::instruction::initialize_non_transferable_mint(
//             &spl_token_2022::ID,
//             &mint.key(),
//         )?,
//         &[mint.to_account_info()],
//     )?;

//     // Step 3: Initialize the mint
//     anchor_lang::solana_program::program::invoke(
//         &spl_token_2022::instruction::initialize_mint2(
//             &spl_token_2022::ID,
//             &mint.key(),
//             &payer.key(),
//             Some(&payer.key()),
//             0,
//         )?,
//         &[mint.to_account_info(), ctx.accounts.rent.to_account_info()],
//     )?;

//     // Step 4: Create associated token account
//     let cpi_accounts = anchor_spl::associated_token::Create {
//         payer: payer.to_account_info(),
//         associated_token: token_account.to_account_info(),
//         authority: payer.to_account_info(),
//         mint: mint.to_account_info(),
//         system_program: ctx.accounts.system_program.to_account_info(),
//         token_program: ctx.accounts.token_program.to_account_info(),
//     };

//     let cpi_context = CpiContext::new(
//         ctx.accounts.associated_token_program.to_account_info(),
//         cpi_accounts,
//     );

//     anchor_spl::associated_token::create(cpi_context)?;

//     //  Mint 1 SBT to user's token account
//     mint_to(
//         CpiContext::new_with_signer(
//             ctx.accounts.token_program.to_account_info(),
//             MintTo {
//                 mint: mint.to_account_info(),
//                 to: token_account.to_account_info(),
//                 authority: payer.to_account_info(),
//             },
//             &[mint_signer_seeds],
//         ),
//         1,
//     )?;

//     // Create metadata for this specific SBT
//     let data_v2 = DataV2 {
//         name: format!("DevRupt SBT #{} - {}", current_sbt_number, cid),
//         symbol: "DSBT".to_string(),
//         uri: format!("https://gateway.pinata.cloud/ipfs/{}", cid),
//         seller_fee_basis_points: 0,
//         creators: None,
//         collection: None,
//         uses: None,
//     };

//     // Create metadata using CPI with signer seeds
//     let ix = CreateMetadataAccountV3 {
//         metadata: ctx.accounts.metadata.key(),
//         mint: ctx.accounts.mint.key(),
//         mint_authority: ctx.accounts.payer.key(),
//         payer: ctx.accounts.payer.key(),
//         update_authority: (ctx.accounts.payer.key(), true),
//         system_program: ctx.accounts.system_program.key(),
//         rent: Some(ctx.accounts.rent.key()),
//     };

//     let ix_data = CreateMetadataAccountV3InstructionArgs {
//         data: data_v2,
//         is_mutable: false,
//         collection_details: None,
//     };

//     anchor_lang::solana_program::program::invoke_signed(
//         &ix.instruction(ix_data),
//         &[
//             ctx.accounts.metadata.to_account_info(),
//             ctx.accounts.mint.to_account_info(),
//             ctx.accounts.payer.to_account_info(),
//             ctx.accounts.payer.to_account_info(),
//             ctx.accounts.system_program.to_account_info(),
//             ctx.accounts.rent.to_account_info(),
//         ],
//         &[mint_signer_seeds],
//     )?;

//     // Increment reward counter AFTER successful minting
//     contributor_state.total_rewards += 1;

//     msg!(
//         "🎉 Minted SBT #{} for contributor: {} with CID: {}",
//         current_sbt_number,
//         contributor_state.github_username,
//         cid
//     );

//     Ok(())
// }
