use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token, mint_to, MintTo};
use mpl_token_metadata::instruction::create_metadata_accounts_v3;
use crate::state::*;

#[derive(Accounts)]
#[instruction(cid: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"contributor", payer.key().as_ref()],
        bump = contributor_state.bump,
    )]
    pub contributor_state: Account<'info, ContributorState>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
        mint::freeze_authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: PDA for metadata
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer,
    )]
    pub token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,

    // Future reward mint (optional)
    #[account(
        mut,
        seeds = [b"reward_mint"],
        bump
    )]
    pub reward_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = reward_mint,
        associated_token::authority = payer,
    )]
    pub reward_token_account: Account<'info, TokenAccount>,
}

pub fn handler(ctx: Context<MintSbt>, cid: String) -> Result<()> {
    let contributor = &mut ctx.accounts.contributor_state;

    // Update contribution count
    contributor.total_contributions += 1;

    // Mint the SBT
    let cpi_accounts = MintTo {
        mint: ctx.accounts.mint.to_account_info(),
        to: ctx.accounts.token_account.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_ctx = CpiContext::new(ctx.accounts.token_program.to_account_info(), cpi_accounts);
    mint_to(cpi_ctx, 1)?;

    // Create metadata for SBT
    let metadata_ix = create_metadata_accounts_v3(
        mpl_token_metadata::ID,
        ctx.accounts.metadata.key(),
        ctx.accounts.mint.key(),
        ctx.accounts.payer.key(),
        ctx.accounts.payer.key(),
        ctx.accounts.payer.key(),
        format!("Devrupt PR SBT #{}", contributor.total_contributions),
        "DEV-SBT".to_string(),
        format!("ipfs://{}", cid),
        None,
        0,
        true,
        false,
        None,
        None,
        None,
    );
    invoke(
        &metadata_ix,
        &[
            ctx.accounts.metadata.to_account_info(),
            ctx.accounts.mint.to_account_info(),
            ctx.accounts.payer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
        ],
    )?;

    // 🎁 REWARD LOGIC and might be implement in the future but current goal of the project
    if contributor.total_contributions % 5 == 0 {
        // Mint a reward token (NFT/SBT/FT based on reward_mint)
        let reward_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            MintTo {
                mint: ctx.accounts.reward_mint.to_account_info(),
                to: ctx.accounts.reward_token_account.to_account_info(),
                authority: ctx.accounts.payer.to_account_info(),
            },
        );
        mint_to(reward_ctx, 1)?;
        contributor.total_rewards += 1;
    }

    Ok(())
}
