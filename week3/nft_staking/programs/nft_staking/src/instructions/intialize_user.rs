
use anchor_lang::prelude::*;

use crate::state::user_account;
#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + user_account::INIT_SPACE, // Adjust the space according to your user_account struct
        seeds = [b"user_account", user.key().as_ref()],
        bump

    )]
pub user_account:Account<'info, user_account>,

   
}
