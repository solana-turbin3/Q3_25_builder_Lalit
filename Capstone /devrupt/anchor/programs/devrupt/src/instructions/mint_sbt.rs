use crate::state::ContributorState;
use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

#[derive(Accounts)]
#[instruction(cid: String)]
pub struct MintSbt<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        space = 8 + 32 + 4 + 20 + 8 + 8 + 1, 
        seeds = [b"contributor", payer.key().as_ref()],
        bump
    )]
    pub contributor_state: Account<'info, ContributorState>,

    #[account(
        init,
        payer = payer,
        mint::decimals = 0,
        mint::authority = payer,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = payer
    )]
    pub contributor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintSbt<'info> {
    pub fn process(&mut self, cid: String, bumps: &MintSbtBumps) -> Result<()> {
        let contributor = &mut self.contributor_state;

        // Initialize contributor 
        if contributor.total_contributions == 0 {
            contributor.wallet = self.payer.key();
            contributor.total_contributions = 0;
            contributor.total_rewards = 0;
            contributor.bump = bumps.contributor_state;
        }

        // Increment contributions
        contributor.total_contributions += 1;
        contributor.total_rewards += 1;

        let cpi_accounts = anchor_spl::token::MintTo {
            mint: self.mint.to_account_info(),
            to: self.contributor_ata.to_account_info(),
            authority: self.payer.to_account_info(),
        }; 

        let cpi_ctx = CpiContext::new(self.token_program.to_account_info(), cpi_accounts);
        anchor_spl::token::mint_to(cpi_ctx, 1)?;

        contributor.total_rewards += 1;

        msg!(
            "Minted SBT for contributor with CID: {}",
            cid
        );

        Ok(())
    }
}

pub fn mint_sbt_handler(ctx: Context<MintSbt>, cid: String) -> Result<()> {
    ctx.accounts.process(cid, &ctx.bumps)
}

