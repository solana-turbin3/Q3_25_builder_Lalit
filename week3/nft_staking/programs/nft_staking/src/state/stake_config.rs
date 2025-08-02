use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct stateConfig{

    pub point_per_stake: u8,
    pub max_stake: u8,
    pub freeze_point : u8,
    pub reward_bump  : u8,
    pub bump: u8,


}
