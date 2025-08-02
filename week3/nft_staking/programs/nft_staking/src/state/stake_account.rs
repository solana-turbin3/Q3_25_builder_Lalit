use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct stakeAccount {
   pub owner: Pubkey,
   pub mint: Pubkey,
   pub stake_At: i64,
   bump: u8,

   
}