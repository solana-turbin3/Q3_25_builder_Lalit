use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct escrow{
pub seed: u64,
pub maker: Pubkey,
pub mint_a:Pubkey,
pub mint_b: Pubkey,
pub receiver:Pubkey,
pub bump: u8,

}