pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("CDqBjq2XPTdCzuzQnk5eMmRUPt1tkc2J7GKEnNANtdQv");

#[program]
pub mod devrupt {
    use super::*;

    pub fn initialize_contributor(
        ctx: Context<InitializeContributor>,
        github_username: String,
    ) -> Result<()> {
        instructions::initialize_contributor::initialize_contributor_handler(ctx, github_username)
    }
pub fn mint_sbt(ctx: Context<MintSbt>, cid: String) -> Result<()> {
        instructions::mint_sbt::mint_sbt_handler(ctx, cid)
    }

    pub fn record_contribution(ctx: Context<RecordContribution>) -> Result<()> {
        instructions::record_contribution::record_contribution_handler(ctx)
    }
}