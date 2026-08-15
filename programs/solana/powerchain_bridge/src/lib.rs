use anchor_lang::prelude::*;

// PLACEHOLDER ONLY. Production deployment tooling MUST replace this with the
// actual deployed PowerChain auxiliary program id and fail if it is unchanged.
declare_id!("Fg6PaFpoGXkYsidMpWxTWqkZxxV2qTnAXg2YS4JpT5jA");

#[program]
pub mod powerchain_bridge {
    use super::*;

    pub fn record_intent(ctx: Context<RecordIntent>, args: RecordIntentArgs) -> Result<()> {
        require!(args.amount_base_units > 0, BridgeError::InvalidAmount);
        require!(args.destination.len() <= 128, BridgeError::DestinationTooLong);
        emit!(BridgeIntentRecorded {
            authority: ctx.accounts.authority.key(),
            quote_hash: args.quote_hash,
            direction: args.direction,
            amount_base_units: args.amount_base_units,
            destination: args.destination,
        });
        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordIntentArgs {
    pub quote_hash: [u8; 32],
    pub direction: u8,
    pub amount_base_units: u64,
    pub destination: String,
}

#[derive(Accounts)]
pub struct RecordIntent<'info> {
    pub authority: Signer<'info>,
}

#[event]
pub struct BridgeIntentRecorded {
    pub authority: Pubkey,
    pub quote_hash: [u8; 32],
    pub direction: u8,
    pub amount_base_units: u64,
    pub destination: String,
}

#[error_code]
pub enum BridgeError {
    #[msg("Bridge amount must be greater than zero")]
    InvalidAmount,
    #[msg("Destination identifier is too long")]
    DestinationTooLong,
}
