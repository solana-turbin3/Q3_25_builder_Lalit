use anchor_lang::prelude::*;
use crate::state::*;

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
        space = 8 + 32 + 4 + github_username.len() + 1  // Discriminator + wallet + pr_count + string + bump
    )]
    pub contributor_state: Account<'info, ContributorState>,

    pub system_program: Program<'info, System>,
}

pub fn handler(
    ctx: Context<InitializeContributor>,
    github_username: String,
) -> Result<()> {
    let contributor = &mut ctx.accounts.contributor_state;

    contributor.wallet = ctx.accounts.payer.key();
    contributor.github_username = github_username;
    contributor.total_contributions = 0;
    contributor.total_rewards = 0;
    contributor.bump = ctx.bumps.contributor_state;
    Ok(())
}

