use anchor_lang::prelude::*;

#[account ]
pub struct ContributorState {
    pub wallet: Pubkey,
    pub github_username: String,
    pub total_contributions: u64,
    pub total_rewards: u64,
    pub bump: u8,
}