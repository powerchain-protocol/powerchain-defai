use anchor_lang::prelude::*;

declare_id!("BGEekuKBEsKzEdUdEKvWn4BGRgvAURQMD9f4yLLRteWS");

const BRIDGE_CONFIG_SEED: &[u8] = b"bridge-config";
const INFORMATION_COMMITMENT_SEED: &[u8] = b"information-commitment";
const BRIDGE_CONFIG_VERSION: u16 = 1;
const BRIDGE_CONFIG_SPACE: usize = 8 + 32 + 1 + 1 + 2 + 8;
const INFORMATION_COMMITMENT_VERSION: u16 = 1;
const INFORMATION_COMMITMENT_SPACE: usize = 8 + 32 + 1 + 2 + 32;
const INFORMATION_COMMITMENT: [u8; 32] = [246, 191, 209, 98, 118, 134, 251, 255, 6, 110, 230, 128, 69, 160, 128, 139, 228, 193, 252, 105, 53, 15, 63, 243, 95, 181, 1, 250, 40, 206, 81, 181];
const DIRECTION_SOLANA_TO_SUI: u8 = 0;
const DIRECTION_SUI_TO_SOLANA: u8 = 1;
const BRIDGE_INTENT_EVENT_VERSION: u16 = 2;

#[program]
pub mod powerchain_bridge {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>) -> Result<()> {
        require!(ctx.accounts.authority.key() != crate::ID, BridgeError::ProgramCannotBeAuthority);
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.bump = ctx.bumps.config;
        config.paused = false;
        config.version = BRIDGE_CONFIG_VERSION;
        config.next_nonce = 0;

        emit!(BridgeAuthorityUpdated {
            previous_authority: Pubkey::default(),
            new_authority: config.authority,
        });
        emit!(BridgePauseUpdated { paused: false, authority: config.authority });
        Ok(())
    }

    /// Initializes a separate immutable-by-policy token information commitment PDA.
    /// This avoids changing the already deployed BridgeConfig account layout.
    pub fn initialize_information_commitment(ctx: Context<InitializeInformationCommitment>) -> Result<()> {
        assert_config_version(&ctx.accounts.config)?;
        let information = &mut ctx.accounts.information;
        information.authority = ctx.accounts.authority.key();
        information.bump = ctx.bumps.information;
        information.version = INFORMATION_COMMITMENT_VERSION;
        information.commitment = INFORMATION_COMMITMENT;
        emit!(InformationCommitmentInitialized {
            authority: information.authority,
            version: information.version,
            commitment: information.commitment,
        });
        Ok(())
    }

    pub fn assert_information_commitment(ctx: Context<AssertInformationCommitment>) -> Result<()> {
        require!(ctx.accounts.information.version == INFORMATION_COMMITMENT_VERSION, BridgeError::InformationCommitmentVersionMismatch);
        require!(ctx.accounts.information.commitment == INFORMATION_COMMITMENT, BridgeError::InformationCommitmentMismatch);
        Ok(())
    }

    pub fn set_authority(ctx: Context<SetAuthority>, new_authority: Pubkey) -> Result<()> {
        require!(new_authority != Pubkey::default(), BridgeError::InvalidAuthority);
        require!(new_authority != crate::ID, BridgeError::ProgramCannotBeAuthority);

        let config = &mut ctx.accounts.config;
        assert_config_version(config)?;
        let previous_authority = config.authority;
        config.authority = new_authority;

        emit!(BridgeAuthorityUpdated { previous_authority, new_authority });
        Ok(())
    }

    pub fn set_paused(ctx: Context<SetPaused>, paused: bool) -> Result<()> {
        let config = &mut ctx.accounts.config;
        assert_config_version(config)?;
        config.paused = paused;
        emit!(BridgePauseUpdated { paused, authority: ctx.accounts.authority.key() });
        Ok(())
    }

    /// Records an auxiliary PowerChain intent. Wormhole NTT remains solely
    /// responsible for locking/burning, attestation, minting/unlocking and
    /// cross-chain principal settlement.
    pub fn record_intent(ctx: Context<RecordIntent>, args: RecordIntentArgs) -> Result<()> {
        validate_record_intent_args(&args)?;

        let config = &mut ctx.accounts.config;
        assert_config_version(config)?;
        require!(!config.paused, BridgeError::BridgePaused);
        let operation_nonce = config.next_nonce;
        config.next_nonce = config.next_nonce.checked_add(1).ok_or(BridgeError::NonceOverflow)?;

        let authority = ctx.accounts.authority.key();
        let destination = args.destination;
        emit!(BridgeIntentRecorded {
            authority,
            operation_nonce,
            quote_hash: args.quote_hash,
            direction: args.direction,
            amount_base_units: args.amount_base_units,
            destination: destination.clone(),
        });
        let clock = Clock::get()?;
        emit!(BridgeIntentRecordedV2 {
            event_version: BRIDGE_INTENT_EVENT_VERSION,
            authority,
            operation_nonce,
            quote_hash: args.quote_hash,
            direction: args.direction,
            amount_base_units: args.amount_base_units,
            destination,
            observed_slot: clock.slot,
            observed_unix_timestamp: clock.unix_timestamp,
        });
        Ok(())
    }
}

fn assert_config_version(config: &BridgeConfig) -> Result<()> {
    require!(config.version == BRIDGE_CONFIG_VERSION, BridgeError::ConfigVersionMismatch);
    Ok(())
}

fn validate_record_intent_args(args: &RecordIntentArgs) -> Result<()> {
    require!(args.amount_base_units > 0, BridgeError::InvalidAmount);
    require!(
        args.direction == DIRECTION_SOLANA_TO_SUI || args.direction == DIRECTION_SUI_TO_SOLANA,
        BridgeError::InvalidDirection
    );
    require!(!args.destination.trim().is_empty(), BridgeError::DestinationRequired);
    require!(args.destination.len() <= 128, BridgeError::DestinationTooLong);
    require!(args.quote_hash != [0u8; 32], BridgeError::InvalidQuoteHash);
    Ok(())
}

#[account]
pub struct BridgeConfig {
    pub authority: Pubkey,
    pub bump: u8,
    pub paused: bool,
    pub version: u16,
    pub next_nonce: u64,
}

#[account]
pub struct InformationCommitment {
    pub authority: Pubkey,
    pub bump: u8,
    pub version: u16,
    pub commitment: [u8; 32],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct RecordIntentArgs {
    pub quote_hash: [u8; 32],
    pub direction: u8,
    pub amount_base_units: u64,
    pub destination: String,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(
        init,
        payer = authority,
        space = BRIDGE_CONFIG_SPACE,
        seeds = [BRIDGE_CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, BridgeConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializeInformationCommitment<'info> {
    #[account(
        seeds = [BRIDGE_CONFIG_SEED],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BridgeError::UnauthorizedAuthority
    )]
    pub config: Account<'info, BridgeConfig>,
    #[account(
        init,
        payer = authority,
        space = INFORMATION_COMMITMENT_SPACE,
        seeds = [INFORMATION_COMMITMENT_SEED],
        bump
    )]
    pub information: Account<'info, InformationCommitment>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AssertInformationCommitment<'info> {
    #[account(seeds = [INFORMATION_COMMITMENT_SEED], bump = information.bump)]
    pub information: Account<'info, InformationCommitment>,
}

#[derive(Accounts)]
pub struct SetAuthority<'info> {
    #[account(
        mut,
        seeds = [BRIDGE_CONFIG_SEED],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BridgeError::UnauthorizedAuthority
    )]
    pub config: Account<'info, BridgeConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct SetPaused<'info> {
    #[account(
        mut,
        seeds = [BRIDGE_CONFIG_SEED],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BridgeError::UnauthorizedAuthority
    )]
    pub config: Account<'info, BridgeConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct RecordIntent<'info> {
    #[account(
        mut,
        seeds = [BRIDGE_CONFIG_SEED],
        bump = config.bump,
        constraint = config.authority == authority.key() @ BridgeError::UnauthorizedAuthority
    )]
    pub config: Account<'info, BridgeConfig>,
    pub authority: Signer<'info>,
}

#[event]
pub struct InformationCommitmentInitialized {
    pub authority: Pubkey,
    pub version: u16,
    pub commitment: [u8; 32],
}

#[event]
pub struct BridgeIntentRecorded {
    pub authority: Pubkey,
    pub operation_nonce: u64,
    pub quote_hash: [u8; 32],
    pub direction: u8,
    pub amount_base_units: u64,
    pub destination: String,
}

#[event]
pub struct BridgeIntentRecordedV2 {
    pub event_version: u16,
    pub authority: Pubkey,
    pub operation_nonce: u64,
    pub quote_hash: [u8; 32],
    pub direction: u8,
    pub amount_base_units: u64,
    pub destination: String,
    pub observed_slot: u64,
    pub observed_unix_timestamp: i64,
}

#[event]
pub struct BridgeAuthorityUpdated {
    pub previous_authority: Pubkey,
    pub new_authority: Pubkey,
}

#[event]
pub struct BridgePauseUpdated {
    pub paused: bool,
    pub authority: Pubkey,
}

#[error_code]
pub enum BridgeError {
    #[msg("Bridge amount must be greater than zero")]
    InvalidAmount,
    #[msg("Bridge direction is unsupported")]
    InvalidDirection,
    #[msg("Destination identifier is required")]
    DestinationRequired,
    #[msg("Destination identifier is too long")]
    DestinationTooLong,
    #[msg("Quote hash cannot be the all-zero digest")]
    InvalidQuoteHash,
    #[msg("Bridge authority is not authorized")]
    UnauthorizedAuthority,
    #[msg("Bridge authority cannot be the default public key")]
    InvalidAuthority,
    #[msg("The executable bridge program account cannot be used as the signer authority")]
    ProgramCannotBeAuthority,
    #[msg("Bridge intent recording is paused")]
    BridgePaused,
    #[msg("Bridge operation nonce overflowed")]
    NonceOverflow,
    #[msg("Bridge configuration version does not match the canonical version")]
    ConfigVersionMismatch,
    #[msg("PowerChain token information commitment version does not match the canonical version")]
    InformationCommitmentVersionMismatch,
    #[msg("PowerChain token information commitment does not match the canonical commitment")]
    InformationCommitmentMismatch,
}
