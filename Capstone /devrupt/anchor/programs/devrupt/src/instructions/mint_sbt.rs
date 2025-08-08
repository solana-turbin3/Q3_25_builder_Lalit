use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{mint_to, MintTo, Token2022};
use anchor_spl::token_interface::{Mint, TokenAccount};
use mpl_token_metadata::instructions::{
    CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs,
};
use mpl_token_metadata::types::DataV2;

#[derive(Accounts)]
#[instruction(cid: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"contributor", payer.key().as_ref()],
        bump = contributor_state.bump
    )]
    pub contributor_state: Account<'info, crate::state::ContributorState>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer.key(),
        mint::freeze_authority = payer.key(),
        mint::token_program = token_program,
        seeds = [b"mint", payer.key().as_ref(), contributor_state.total_rewards.to_le_bytes().as_ref()],
        bump,
    )]
    pub mint: InterfaceAccount<'info, Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program,
    )]
    pub token_account: InterfaceAccount<'info, TokenAccount>,

    /// CHECK: Metadata account - will be computed and validated in handler
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    /// CHECK: This is the Token Metadata Program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token2022>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn handler(ctx: Context<MintSbt>, cid: String) -> Result<()> {
    let mint = &ctx.accounts.mint;
    let token_account = &ctx.accounts.token_account;
    let contributor_state = &mut ctx.accounts.contributor_state;

    // Minimum contributions before minting 
    require!(
        contributor_state.total_contributions >= 1,
        crate::error::ErrorCode::InsufficientContributions
    );

    // Increment reward counter first for the pda
    contributor_state.total_rewards += 1;

    // Verify the metadata PDA is correct
    let (expected_metadata_pda, _) = Pubkey::find_program_address(
        &[
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint.key().as_ref(),
        ],
        &mpl_token_metadata::ID,
    );

    require!(
        ctx.accounts.metadata.key() == expected_metadata_pda,
        crate::error::ErrorCode::InvalidMetadataPDA
    );

    // Initialize NonTransferable extension for this new mint
    let init_non_transferable_ix = spl_token_2022::instruction::initialize_non_transferable_mint(
        &spl_token_2022::ID,
        &mint.key(),
    )?;

    anchor_lang::solana_program::program::invoke(
        &init_non_transferable_ix,
        &[mint.to_account_info()],
    )?;

    // Mint 1 SBT to user's token acc
    mint_to(
        CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: mint.to_account_info(),
                to: token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        ),
        1,
    )?;

    // Create metadata for this specific SBT
    let data_v2 = DataV2 {
        name: format!("DevRupt SBT #{} - {}", contributor_state.total_rewards, cid),
        symbol: "DSBT".to_string(),
        uri: format!("https://gateway.pinata.cloud/ipfs/{}", cid),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    // Creating metadata using CPI
    let ix = CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: ctx.accounts.mint.key(),
        mint_authority: ctx.accounts.payer.key(),
        payer: ctx.accounts.payer.key(),
        update_authority: (ctx.accounts.payer.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let ix_data = CreateMetadataAccountV3InstructionArgs {
        data: data_v2,
        is_mutable: false,
        collection_details: None,
    };

    anchor_lang::solana_program::program::invoke(
        &ix.instruction(ix_data),
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    msg!(
        "🎉 Minted SBT #{} for contributor: {} with CID: {}",
        contributor_state.total_rewards,
        contributor_state.github_username,
        cid
    );

    Ok(())
}
// program address --FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN
// anchor run initialize-contributor --provider.cluster devnet
//https://explorer.solana.com/address/FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN?cluster=devnet
