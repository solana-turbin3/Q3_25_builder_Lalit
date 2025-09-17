pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CLkuRh4iw5pagTFW53jss7EeLYuYLswKYhiAvhSuEoQd");

#[program]
pub mod dice_satoshi {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}
