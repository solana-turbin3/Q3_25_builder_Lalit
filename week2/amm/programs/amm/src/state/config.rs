use anchor_lang::prelude::*;

#[account]
pub struct Config {
    pub authority: Option<Pubkey>,
    pub mint_x: Pubkey,
    pub mint_y: Pubkey,
    pub fee: u16,
    pub config_bump: u8,
    pub lp_bump: u8,
}

impl Config {
    pub const INIT_SPACE: usize = 8 + // discriminator
        (1 + 32) + // Option<Pubkey> for authority (1 byte for Some/None + 32 bytes for Pubkey)
        32 + // mint_x
        32 + // mint_y
        2 + // fee (u16)
        1 + // config_bump
        1; // lp_bump
}
