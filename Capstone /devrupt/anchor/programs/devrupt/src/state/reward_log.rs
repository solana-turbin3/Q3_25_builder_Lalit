use anchor_lang::prelude::*;

#[account]
pub struct RewardLog {
    pub contributor: Pubkey,
    pub repo: String,
    pub pr_number: u64,
    pub reward: u64,
    pub timestamp: i64,
}
