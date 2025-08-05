use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_2022::{Token2022, spl_token_2022::extension::ExtensionType};
use anchor_spl::token_interface::{mint_to, MintTo};
use mpl_token_metadata::types::DataV2;
se mpl_token_metadata::instructions::{CreateMetadataAccountV3, CreateMetadataAccountV3InstructionArgs};

#[derive(Accounts)]
#[instruction(cid: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer.key(),
        mint::freeze_authority = payer.key(),
        extensions = [ExtensionType::NonTransferable],// ADD TOKEN EXTENSIONS HERE
        seeds = [b"mint", payer.key().as_ref()],
        bump,
    )]
    pub mint: InterfaceAccount<'info, anchor_spl::token_interface::Mint>,

    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
        associated_token::token_program = token_program,
    )]
    pub token_account: InterfaceAccount<'info, anchor_spl::token_interface::TokenAccount>,

    /// CHECK: Metadata account derived from mint
    #[account(
        mut,
        seeds = [
            b"metadata",
            mpl_token_metadata::ID.as_ref(),
            mint.key().as_ref(),
        ],
        bump,
        seeds::program = mpl_token_metadata::ID
    )]
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

    // Mint 1 SBT to user's token account
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

    // Create metadata
    let data_v2 = DataV2 {
        name: format!("Soulbound Cert {}", cid),
        symbol: "SBT".to_string(),
        uri: format!("https://gateway.pinata.cloud/ipfs/{}", cid),
        seller_fee_basis_points: 0,
        creators: None,
        collection: None,
        uses: None,
    };

    let create_metadata_ix = mpl_token_metadata::instructions::CreateMetadataAccountV3 {
        metadata: ctx.accounts.metadata.key(),
        mint: mint.key(),
        mint_authority: ctx.accounts.payer.key(),
        payer: ctx.accounts.payer.key(),
        update_authority: (ctx.accounts.payer.key(), true),
        system_program: ctx.accounts.system_program.key(),
        rent: Some(ctx.accounts.rent.key()),
    };

    let instruction = create_metadata_ix.instruction(
        mpl_token_metadata::instructions::CreateMetadataAccountV3InstructionArgs {
            data: data_v2,
            is_mutable: false,
            collection_details: None,
        },
    );

    anchor_lang::solana_program::program::invoke(
        &instruction,
        &[
            ctx.accounts.metadata.to_account_info(),
            mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.rent.to_account_info(),
        ],
    )?;

    // NO NEED TO FREEZE - NonTransferable extension handles this automatically!
    // The token is inherently non-transferable due to the extension

    Ok(())
}