use anchor_lang::{prelude::*, accounts::interface};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked},
};
use crate::state::Escrow;

#[derive(Accounts)]

pub struct Refund<'info>{
#[account(mut)]
    pub maker: Signer<'info>,

    #[account(mint::token_program = token_program)]
    pub mint_a: Interface<'info, Mint>,


    #[account(
        mute,
        close = maker,
        has_one = mint_a,
        seeds = [b"escrow", maker.key().as_ref(),escrow.seed.to_le_bytes().as_ref()],
        bump=escrpw.bump
    )]  
    pub escrow: Account<'info, Escrow>,

    #[account(
        init,
        payer = maker,
        associated_token::mint = mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program
    )]
    pub vault: Interface<'info, TokenAccount>,

    pub maker_ata_a: Interface<'info, TokenAccount>,

    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,

}
6   jy   

}