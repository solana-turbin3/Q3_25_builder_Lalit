
use anchor_lang::prelude::*;

use crate::state::user_account;
#[derive(Accounts)]
pub struct InitializeUser<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init,
        payer = user,
        space = 8 + user_account::INIT_SPACE, 
        seeds = [b"user_account", user.key().as_ref()],
        bump

    )]
pub user_account:Account<'info, user_account>,

pub system_program: Program<'info, System>

   
}
impl<'info>IntializeUser<'info>{

    pub fn intialize(&mut self ,bumps:&InitializeUserBumps)-> Result<()>{
        self.user_account.set.inner(user_account{
            point :0,
           amount_staked: 0,
              bump: bumps.user_account,
        });
        Ok(())
    }
}
