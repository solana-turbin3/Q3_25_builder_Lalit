use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct user_account{

    pub point: u64,
    pub amount_staked: u64,
    bump: u8,

}