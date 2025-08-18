pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("9eq285CTju48tBaaenQbqQAfG3cK9qMSQ5xA9dpaZjoB");
#[program]
pub mod marketplace {
    use super::*;
    
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        initialize::handler(ctx)
    }
}

    