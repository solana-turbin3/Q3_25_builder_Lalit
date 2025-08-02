use anchor_lang::{prelude::*, solana_program::example_mocks::solana_sdk::sysvar::rewards};
use anchor_spl::token::{Mint, Token};

use crate::{initialize_config, stake_config};

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        seeds = [b"stake"],
        bump,
        space = 8 + stake_config::INIT_SPACE,
    )]
    pub config: Account<'info, stake_config>,
    
    #[account(
        init_if_needed,
        payer= admin,
        seeds= [b"reward_mint",config.key().as_ref()],
        bump,
        mint::decimals = 6,
        mint::authority=config
    )]
    pub reward_mint: Account<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

impl<'info> InitializeConfig<'info> {
    pub fn initialize_config(
        &mut self,
        point_per_stake: u8,
        max_stake: u8,
        freeze_point: u8,
        rewards_bump: u8,
        bump: &InitializeConfigBumps,
    ) -> Result<()> {
        self.config.set_inner(StakeConfig {
            point_per_stake,
            max_stake,
            freeze_point,
            reward_bump: rewards_bump,
            bump: bump.config,
        });
        Ok(())
    }
}
