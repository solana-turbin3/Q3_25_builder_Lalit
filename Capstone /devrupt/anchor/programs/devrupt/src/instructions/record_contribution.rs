use crate::state::*;
use anchor_lang::prelude::*;

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

pub fn record_contribution_handler(ctx: Context<RecordContribution>) -> Result<()> {
    let contributor = &mut ctx.accounts.contributor_state;

    contributor.total_contributions += 1;

    Ok(())
}
