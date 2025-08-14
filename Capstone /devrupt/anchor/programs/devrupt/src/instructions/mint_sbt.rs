use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount, mint_to};
use crate::contributor_state;
use crate::state::ContributorState;

#[derive(Accounts)]
#[instruction(amount: u64)]

pub struct MintSbt<'info>{

 #[account(mut)]
    pub payer: Signer<'info>,

        #[account(
         init_if_needed,
        payer = payer,
        space = 8 + 32 + 4 + github_username.len() + 8 + 8 + 1,
        seeds = [b"contributor", contributor_state.key().as_ref()],
        bump
    )]
    pub contributor_state: Account<'info, ContributorState>,
   
   #[account(mut)]
    pub mint: Account<'info, Mint>,

      #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = contributor
    )]
    pub contributor: SystemAccount<'info>,
    pub contributor_ata: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
 

 impl<'info> MintSbt<'info> {

    pub fn process(&mut self, github_username: String) -> Result<()> {
        let contributor = &mut self.contributor_state;

        // Initialize contributor 
        if contributor.total_contributions == 0 {
            contributor.wallet = self.payer.key();
            contributor.github_username = github_username;
            contributor.total_contributions = 0;
            contributor.total_rewards = 0;
            contributor.bump = self.bumps.contributor_state;
        }

        // Increment contributions
        contributor.total_contributions += 1;
        contributor.total_rewards += 1;

      let cpi_account= MintTo{
        mint: self.mint.to_account_info(),
        to: self.contributor_ata.to_account_info(),
        authority: Self::to_account_info(),
      }; 

    let cpi_ctx= CpiContext::new (self.token_program.to_account_info(),cpi_accounts);
     mint_to(cpi_ctx, 1)?;


     contributor_state.total_rewards += 1;

        msg!(
            "Minted SBT for contributor: {} with CID: {}",
            contributor.github_username,
            cid
        );

       
    }
    
    Ok(())



 }

}











