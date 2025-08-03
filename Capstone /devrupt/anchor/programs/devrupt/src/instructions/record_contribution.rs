use anchor_lang::prelude::*;
use crate::state::*;

#[derive(Accounts)]
pub struct RecordContribution<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"contributor", signer.key().as_ref()],
        bump = contributor_state.bump
    )]
    pub contributor_state: Account<'info, ContributorState>,
}

pub fn handler(ctx: Context<RecordContribution>) -> Result<()> {
    let contributor = &mut ctx.accounts.contributor_state;

    contributor.total_contributions += 1;

    Ok(())
}
