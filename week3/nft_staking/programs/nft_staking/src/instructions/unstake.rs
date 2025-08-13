use crate::state::*;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};

#[derive(Accounts)]
pub struct Unstake<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        mut,
        seeds = [b"user", user.key().as_ref()],
        bump = user_account.bump
    )]
    pub user_account: Account<'info, UserAccount>,

    #[account(
        seeds = [b"config"],
        bump = config.bump
    )]
    pub config: Account<'info, StakeConfig>,

    pub nft_mint: Account<'info, Mint>,

    #[account(
        mut,
        close = user,
        seeds = [b"stake", nft_mint.key().as_ref()],
        bump = stake_account.bump,
        constraint = stake_account.owner == user.key(),
    )]
    pub stake_account: Account<'info, StakeAccount>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = user,
    )]
    pub user_nft_ata: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = nft_mint,
        associated_token::authority = config,
    )]
    pub vault_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

impl<'info> Unstake<'info> {
    pub fn unstake(&mut self) -> Result<()> {
        let clock = Clock::get()?;

        let stake_time = clock.unix_timestamp - self.stake_account.stake_at;
        if stake_time < self.config.freeze_period as i64 {
            return Err(anchor_lang::error::ErrorCode::ConstraintRaw.into());
        }

        let points_earned = (stake_time as u64) * (self.config.points_per_stake as u64);

        self.user_account.amount_staked = self.user_account.amount_staked.saturating_sub(1);
        self.user_account.points = self.user_account.points.saturating_add(points_earned as u32);

        let config_seeds = &[b"config".as_ref(), &[self.config.bump]];
        let signer_seeds = &[&config_seeds[..]];

        let cpi_accounts = Transfer {
            from: self.vault_ata.to_account_info(),
            to: self.user_nft_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let cpi_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            cpi_accounts,
            signer_seeds,
        );
        transfer(cpi_ctx, 1)?;

        Ok(())
    }
}
