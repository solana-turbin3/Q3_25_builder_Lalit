pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("FV5sGyF543uGgyJdgfdsQhNGXrGkxY4wsBT5h4tcpjPN");

#[program]
pub mod devrupt {
    use super::*;

    pub fn initialize_contributor(
        ctx: Context<InitializeContributor>,
        github_username: String,
    ) -> Result<()> {
        instructions::initialize_contributor::handler(ctx, github_username)
    }

        pub fn sbt_mint(ctx: Context<sbtmint>, cid: String) -> Result<()> {
        instructions::sbt_mint::handler(ctx, cid)
    }

    pub fn record_contribution(ctx: Context<RecordContribution>) -> Result<()> {
        instructions::record_contribution::handler(ctx)
    }
}
