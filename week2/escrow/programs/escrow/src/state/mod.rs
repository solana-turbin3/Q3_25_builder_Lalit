use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]

pub struct Escrow{
pub seed: u64,
pub maker: Pubkey,
pub mint_a:Pubkey,
pub mint_b: Pubkey,
pub receiver:Pubkey,
pub receive: u64,
pub bump: u8,

}