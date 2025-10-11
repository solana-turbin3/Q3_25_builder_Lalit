use crate::state::Bet;
use anchor_lang::{
    prelude::*,
    system_program::{transfer, Transfer},
};
#[derive(Accounts)]
#[instruction(seed:u128)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,

    ///Checked :: It is defined before  and safe to use here
    pub house: UncheckedAccount<'info>,

    #[account(
        init,
        payer = player,
        space = 8+ Bet::INIT_SPACE,
        seeds= [b"bet",vault.key().as_ref(),seed.to_be_bytes().as_ref()],
        bump,

    )]
    pub bet: Account<'info, Bet>,
    #[account(
        mut,
        seeds = [b"vault",house.key().as_ref()],
        bump,
    )]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}
impl<'info> PlaceBet<'info> {
    /// Initializes the Bet account with provided details
    /// Stores the player's pubkey, bet amount, current slot, chosen roll, and bump
    pub fn create_bet(
        &mut self,
        bumps: &PlaceBetBumps,
        seed: u128,
        roll: u8,
        amount: u64,
    ) -> Result<()> {
        self.bet.set_inner(Bet {
            slot: Clock::get()?.slot as u8, // This truncates the value!
            player: self.player.key(),
            seed,
            roll,
            amount,
            bump: bumps.bet,
        });
        Ok(())
    }
    pub fn deposit(&mut self, amount: u64) -> Result<()> {
        let account = Transfer {
            from: self.player.to_account_info(),
            to: self.vault.to_account_info(),
        };
        let ctx: CpiContext<'_, '_, '_, '_, _> =
            CpiContext::new(self.system_program.to_account_info(), account);

        transfer(ctx, amount)
    }
}
