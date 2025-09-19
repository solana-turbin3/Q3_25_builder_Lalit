use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
use crate::Bet;
#[derive(Accounts)]
pub struct RefundBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    /// CHECK: This is only used for signing purpose
    pub house: UncheckedAccount<'info>,
}