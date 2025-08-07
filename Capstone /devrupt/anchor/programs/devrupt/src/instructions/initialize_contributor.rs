use crate::state::*;
use anchor_lang::prelude::*;

#[derive(Accounts)]
#[instruction(github_username: String)]
pub struct InitializeContributor<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [b"contributor", payer.key().as_ref()],
        bump,
        payer = payer,
        space = 8 + 32 + 4 + 64 + 8 + 8 + 1  // Discriminator + wallet + string len + string(64 chars max) + contributions + rewards + bump
    )]
    pub contributor_state: Account<'info, ContributorState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeContributor>, github_username: String) -> Result<()> {
    let contributor = &mut ctx.accounts.contributor_state;

    contributor.wallet = ctx.accounts.payer.key();
    contributor.github_username = github_username;
    contributor.total_contributions = 0;
    contributor.total_rewards = 0;
    contributor.bump = ctx.bumps.contributor_state;
    Ok(())
}
