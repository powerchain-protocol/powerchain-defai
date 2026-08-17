use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};

// Compile-time development placeholder only. Runtime and production checks reject
// this value as a deployed staking identifier. Generate the real program keypair,
// then run the repository staking program-id sync before deployment.
declare_id!("Stake11111111111111111111111111111111111111");

const PWRC_MINT: Pubkey = pubkey!("PWRCRXXZxbg6FdQZfK3PMD7KP8xfxs9acvifJiG46wc");
const STAKING_CONFIG_SEED: &[u8] = b"staking-config";
const VAULT_AUTHORITY_SEED: &[u8] = b"staking-vault-authority";
const STAKE_VAULT_SEED: &[u8] = b"staking-stake-vault";
const REWARD_VAULT_SEED: &[u8] = b"staking-reward-vault";
const POSITION_SEED: &[u8] = b"staking-position";
const STAKING_CONFIG_VERSION: u16 = 1;
const STAKE_POSITION_VERSION: u16 = 1;
const PPM_DENOMINATOR: u128 = 1_000_000;
const MAX_REWARD_RATE_PPM_PER_EPOCH: u64 = 1_000_000;

#[program]
pub mod powerchain_staking {
    use super::*;

    pub fn initialize_config(ctx: Context<InitializeConfig>, args: InitializeConfigArgs) -> Result<()> {
        validate_reward_policy(args.reward_allocation_cap_base_units, args.reward_rate_ppm_per_epoch, args.epoch_slots, args.min_stake_base_units)?;
        require!(ctx.accounts.authority.key() != crate::ID, StakingError::ProgramCannotBeAuthority);
        require_keys_eq!(ctx.accounts.mint.key(), PWRC_MINT, StakingError::InvalidMint);

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.mint = ctx.accounts.mint.key();
        config.stake_vault = ctx.accounts.stake_vault.key();
        config.reward_vault = ctx.accounts.reward_vault.key();
        config.reward_allocation_cap_base_units = args.reward_allocation_cap_base_units;
        config.total_rewards_funded_base_units = 0;
        config.total_rewards_distributed_base_units = 0;
        config.total_staked_base_units = 0;
        config.reward_rate_ppm_per_epoch = args.reward_rate_ppm_per_epoch;
        config.epoch_slots = args.epoch_slots;
        config.cooldown_slots = args.cooldown_slots;
        config.min_stake_base_units = args.min_stake_base_units;
        config.paused = false;
        config.bump = ctx.bumps.config;
        config.vault_authority_bump = ctx.bumps.vault_authority;
        config.version = STAKING_CONFIG_VERSION;

        emit!(StakingConfigInitialized {
            authority: config.authority,
            mint: config.mint,
            stake_vault: config.stake_vault,
            reward_vault: config.reward_vault,
            reward_allocation_cap_base_units: config.reward_allocation_cap_base_units,
            reward_rate_ppm_per_epoch: config.reward_rate_ppm_per_epoch,
            epoch_slots: config.epoch_slots,
            cooldown_slots: config.cooldown_slots,
            min_stake_base_units: config.min_stake_base_units,
        });
        Ok(())
    }

    pub fn initialize_position(ctx: Context<InitializePosition>) -> Result<()> {
        assert_config_active(&ctx.accounts.config)?;
        let position = &mut ctx.accounts.position;
        position.owner = ctx.accounts.owner.key();
        position.staked_base_units = 0;
        position.pending_unstake_base_units = 0;
        position.accrued_rewards_base_units = 0;
        position.last_reward_slot = Clock::get()?.slot;
        position.unstake_available_slot = 0;
        position.bump = ctx.bumps.position;
        position.version = STAKE_POSITION_VERSION;
        emit!(StakePositionInitialized { owner: position.owner });
        Ok(())
    }

    pub fn set_authority(ctx: Context<AdminConfig>, new_authority: Pubkey) -> Result<()> {
        require!(new_authority != Pubkey::default(), StakingError::InvalidAuthority);
        require!(new_authority != crate::ID, StakingError::ProgramCannotBeAuthority);
        let previous_authority = ctx.accounts.config.authority;
        ctx.accounts.config.authority = new_authority;
        emit!(StakingAuthorityUpdated { previous_authority, new_authority });
        Ok(())
    }

    pub fn set_paused(ctx: Context<AdminConfig>, paused: bool) -> Result<()> {
        ctx.accounts.config.paused = paused;
        emit!(StakingPauseUpdated { paused, authority: ctx.accounts.authority.key() });
        Ok(())
    }

    pub fn set_reward_policy(ctx: Context<AdminConfig>, reward_rate_ppm_per_epoch: u64, epoch_slots: u64) -> Result<()> {
        require!(ctx.accounts.config.total_staked_base_units == 0, StakingError::RewardPolicyLockedWhileStaked);
        validate_reward_policy(ctx.accounts.config.reward_allocation_cap_base_units, reward_rate_ppm_per_epoch, epoch_slots, ctx.accounts.config.min_stake_base_units)?;
        ctx.accounts.config.reward_rate_ppm_per_epoch = reward_rate_ppm_per_epoch;
        ctx.accounts.config.epoch_slots = epoch_slots;
        emit!(RewardPolicyUpdated { reward_rate_ppm_per_epoch, epoch_slots });
        Ok(())
    }

    pub fn fund_rewards(ctx: Context<FundRewards>, amount_base_units: u64) -> Result<()> {
        assert_config_active(&ctx.accounts.config)?;
        require!(amount_base_units > 0, StakingError::InvalidAmount);
        let before = ctx.accounts.reward_vault.amount;
        transfer_user_tokens(
            &ctx.accounts.token_program,
            &ctx.accounts.reward_source,
            &ctx.accounts.reward_vault,
            &ctx.accounts.mint,
            &ctx.accounts.authority,
            amount_base_units,
        )?;
        ctx.accounts.reward_vault.reload()?;
        let received = ctx.accounts.reward_vault.amount.checked_sub(before).ok_or(StakingError::VaultBalanceInvariant)?;
        require!(received > 0, StakingError::TransferAmountTooSmall);
        let next_funded = ctx.accounts.config.total_rewards_funded_base_units
            .checked_add(received)
            .ok_or(StakingError::ArithmeticOverflow)?;
        require!(next_funded <= ctx.accounts.config.reward_allocation_cap_base_units, StakingError::RewardAllocationExceeded);
        ctx.accounts.config.total_rewards_funded_base_units = next_funded;
        emit!(RewardPoolFunded { authority: ctx.accounts.authority.key(), requested_base_units: amount_base_units, credited_base_units: received, total_funded_base_units: next_funded });
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>, amount_base_units: u64) -> Result<()> {
        assert_config_active(&ctx.accounts.config)?;
        require!(amount_base_units >= ctx.accounts.config.min_stake_base_units, StakingError::StakeBelowMinimum);
        let slot = Clock::get()?.slot;
        checkpoint_rewards(&ctx.accounts.config, &mut ctx.accounts.position, slot)?;

        let before = ctx.accounts.stake_vault.amount;
        transfer_user_tokens(
            &ctx.accounts.token_program,
            &ctx.accounts.owner_token_account,
            &ctx.accounts.stake_vault,
            &ctx.accounts.mint,
            &ctx.accounts.owner,
            amount_base_units,
        )?;
        ctx.accounts.stake_vault.reload()?;
        let received = ctx.accounts.stake_vault.amount.checked_sub(before).ok_or(StakingError::VaultBalanceInvariant)?;
        require!(received >= ctx.accounts.config.min_stake_base_units, StakingError::StakeBelowMinimumAfterTransferFee);

        ctx.accounts.position.staked_base_units = ctx.accounts.position.staked_base_units
            .checked_add(received)
            .ok_or(StakingError::ArithmeticOverflow)?;
        ctx.accounts.config.total_staked_base_units = ctx.accounts.config.total_staked_base_units
            .checked_add(received)
            .ok_or(StakingError::ArithmeticOverflow)?;
        emit!(StakeDeposited { owner: ctx.accounts.owner.key(), requested_base_units: amount_base_units, credited_base_units: received, total_staked_base_units: ctx.accounts.position.staked_base_units });
        Ok(())
    }

    pub fn request_unstake(ctx: Context<PositionAction>, amount_base_units: u64) -> Result<()> {
        assert_config_active(&ctx.accounts.config)?;
        require!(amount_base_units > 0, StakingError::InvalidAmount);
        let slot = Clock::get()?.slot;
        checkpoint_rewards(&ctx.accounts.config, &mut ctx.accounts.position, slot)?;
        require!(amount_base_units <= ctx.accounts.position.staked_base_units, StakingError::InsufficientStakedBalance);

        ctx.accounts.position.staked_base_units = ctx.accounts.position.staked_base_units
            .checked_sub(amount_base_units)
            .ok_or(StakingError::ArithmeticOverflow)?;
        ctx.accounts.position.pending_unstake_base_units = ctx.accounts.position.pending_unstake_base_units
            .checked_add(amount_base_units)
            .ok_or(StakingError::ArithmeticOverflow)?;
        ctx.accounts.position.unstake_available_slot = slot
            .checked_add(ctx.accounts.config.cooldown_slots)
            .ok_or(StakingError::ArithmeticOverflow)?;
        ctx.accounts.config.total_staked_base_units = ctx.accounts.config.total_staked_base_units
            .checked_sub(amount_base_units)
            .ok_or(StakingError::ArithmeticOverflow)?;
        emit!(UnstakeRequested {
            owner: ctx.accounts.owner.key(),
            amount_base_units,
            pending_base_units: ctx.accounts.position.pending_unstake_base_units,
            available_slot: ctx.accounts.position.unstake_available_slot,
        });
        Ok(())
    }

    pub fn withdraw_unstaked(ctx: Context<WithdrawUnstaked>) -> Result<()> {
        assert_config_version(&ctx.accounts.config)?;
        let slot = Clock::get()?.slot;
        let amount = ctx.accounts.position.pending_unstake_base_units;
        require!(amount > 0, StakingError::NothingToWithdraw);
        require!(slot >= ctx.accounts.position.unstake_available_slot, StakingError::CooldownActive);
        require!(ctx.accounts.stake_vault.amount >= amount, StakingError::StakeVaultUnderfunded);

        let before = ctx.accounts.owner_token_account.amount;
        transfer_vault_tokens(
            &ctx.accounts.token_program,
            &ctx.accounts.stake_vault,
            &ctx.accounts.owner_token_account,
            &ctx.accounts.mint,
            &ctx.accounts.vault_authority,
            ctx.accounts.config.vault_authority_bump,
            amount,
        )?;
        ctx.accounts.owner_token_account.reload()?;
        let received = ctx.accounts.owner_token_account.amount.checked_sub(before).ok_or(StakingError::VaultBalanceInvariant)?;
        require!(received > 0, StakingError::TransferAmountTooSmall);
        ctx.accounts.position.pending_unstake_base_units = 0;
        ctx.accounts.position.unstake_available_slot = 0;
        emit!(UnstakeWithdrawn { owner: ctx.accounts.owner.key(), debited_base_units: amount, received_base_units: received });
        Ok(())
    }

    pub fn claim_rewards(ctx: Context<ClaimRewards>) -> Result<()> {
        assert_config_active(&ctx.accounts.config)?;
        let slot = Clock::get()?.slot;
        checkpoint_rewards(&ctx.accounts.config, &mut ctx.accounts.position, slot)?;
        let amount = ctx.accounts.position.accrued_rewards_base_units;
        require!(amount > 0, StakingError::NoRewardsAvailable);
        require!(ctx.accounts.reward_vault.amount >= amount, StakingError::RewardVaultUnderfunded);
        let next_distributed = ctx.accounts.config.total_rewards_distributed_base_units
            .checked_add(amount)
            .ok_or(StakingError::ArithmeticOverflow)?;
        require!(next_distributed <= ctx.accounts.config.total_rewards_funded_base_units, StakingError::RewardFundingInsufficient);
        require!(next_distributed <= ctx.accounts.config.reward_allocation_cap_base_units, StakingError::RewardAllocationExceeded);

        let before = ctx.accounts.owner_token_account.amount;
        transfer_vault_tokens(
            &ctx.accounts.token_program,
            &ctx.accounts.reward_vault,
            &ctx.accounts.owner_token_account,
            &ctx.accounts.mint,
            &ctx.accounts.vault_authority,
            ctx.accounts.config.vault_authority_bump,
            amount,
        )?;
        ctx.accounts.owner_token_account.reload()?;
        let received = ctx.accounts.owner_token_account.amount.checked_sub(before).ok_or(StakingError::VaultBalanceInvariant)?;
        require!(received > 0, StakingError::TransferAmountTooSmall);
        ctx.accounts.position.accrued_rewards_base_units = 0;
        ctx.accounts.config.total_rewards_distributed_base_units = next_distributed;
        emit!(RewardsClaimed { owner: ctx.accounts.owner.key(), debited_base_units: amount, received_base_units: received, total_distributed_base_units: next_distributed });
        Ok(())
    }
}

fn validate_reward_policy(reward_allocation_cap_base_units: u64, reward_rate_ppm_per_epoch: u64, epoch_slots: u64, min_stake_base_units: u64) -> Result<()> {
    require!(reward_allocation_cap_base_units > 0, StakingError::InvalidRewardAllocation);
    require!(reward_rate_ppm_per_epoch > 0 && reward_rate_ppm_per_epoch <= MAX_REWARD_RATE_PPM_PER_EPOCH, StakingError::InvalidRewardRate);
    require!(epoch_slots > 0, StakingError::InvalidEpochSlots);
    require!(min_stake_base_units > 0, StakingError::InvalidMinimumStake);
    Ok(())
}

fn assert_config_version(config: &StakingConfig) -> Result<()> {
    require!(config.version == STAKING_CONFIG_VERSION, StakingError::ConfigVersionMismatch);
    require_keys_eq!(config.mint, PWRC_MINT, StakingError::InvalidMint);
    require!(config.reward_allocation_cap_base_units > 0, StakingError::InvalidRewardAllocation);
    Ok(())
}

fn assert_config_active(config: &StakingConfig) -> Result<()> {
    assert_config_version(config)?;
    require!(!config.paused, StakingError::StakingPaused);
    Ok(())
}

fn checkpoint_rewards(config: &StakingConfig, position: &mut StakePosition, current_slot: u64) -> Result<()> {
    require!(position.version == STAKE_POSITION_VERSION, StakingError::PositionVersionMismatch);
    if position.last_reward_slot == 0 {
        position.last_reward_slot = current_slot;
        return Ok(());
    }
    let elapsed_slots = current_slot.checked_sub(position.last_reward_slot).ok_or(StakingError::ArithmeticOverflow)?;
    if elapsed_slots == 0 || position.staked_base_units == 0 {
        position.last_reward_slot = current_slot;
        return Ok(());
    }
    let numerator = u128::from(position.staked_base_units)
        .checked_mul(u128::from(config.reward_rate_ppm_per_epoch)).ok_or(StakingError::ArithmeticOverflow)?
        .checked_mul(u128::from(elapsed_slots)).ok_or(StakingError::ArithmeticOverflow)?;
    let denominator = PPM_DENOMINATOR
        .checked_mul(u128::from(config.epoch_slots)).ok_or(StakingError::ArithmeticOverflow)?;
    let accrued_u128 = numerator.checked_div(denominator).ok_or(StakingError::ArithmeticOverflow)?;
    let accrued = u64::try_from(accrued_u128).map_err(|_| error!(StakingError::ArithmeticOverflow))?;
    position.accrued_rewards_base_units = position.accrued_rewards_base_units
        .checked_add(accrued)
        .ok_or(StakingError::ArithmeticOverflow)?;
    position.last_reward_slot = current_slot;
    Ok(())
}

fn transfer_user_tokens<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    authority: &Signer<'info>,
    amount: u64,
) -> Result<()> {
    let accounts = TransferChecked {
        from: from.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: authority.to_account_info(),
    };
    token_interface::transfer_checked(CpiContext::new(token_program.to_account_info(), accounts), amount, mint.decimals)
}

fn transfer_vault_tokens<'info>(
    token_program: &Interface<'info, TokenInterface>,
    from: &InterfaceAccount<'info, TokenAccount>,
    to: &InterfaceAccount<'info, TokenAccount>,
    mint: &InterfaceAccount<'info, Mint>,
    vault_authority: &UncheckedAccount<'info>,
    vault_authority_bump: u8,
    amount: u64,
) -> Result<()> {
    let bump = [vault_authority_bump];
    let signer_seeds: &[&[u8]] = &[VAULT_AUTHORITY_SEED, &bump];
    let accounts = TransferChecked {
        from: from.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: vault_authority.to_account_info(),
    };
    token_interface::transfer_checked(
        CpiContext::new_with_signer(token_program.to_account_info(), accounts, &[signer_seeds]),
        amount,
        mint.decimals,
    )
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub struct InitializeConfigArgs {
    pub reward_allocation_cap_base_units: u64,
    pub reward_rate_ppm_per_epoch: u64,
    pub epoch_slots: u64,
    pub cooldown_slots: u64,
    pub min_stake_base_units: u64,
}

#[account]
#[derive(InitSpace)]
pub struct StakingConfig {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_allocation_cap_base_units: u64,
    pub total_rewards_funded_base_units: u64,
    pub total_rewards_distributed_base_units: u64,
    pub total_staked_base_units: u64,
    pub reward_rate_ppm_per_epoch: u64,
    pub epoch_slots: u64,
    pub cooldown_slots: u64,
    pub min_stake_base_units: u64,
    pub paused: bool,
    pub bump: u8,
    pub vault_authority_bump: u8,
    pub version: u16,
}

#[account]
#[derive(InitSpace)]
pub struct StakePosition {
    pub owner: Pubkey,
    pub staked_base_units: u64,
    pub pending_unstake_base_units: u64,
    pub accrued_rewards_base_units: u64,
    pub last_reward_slot: u64,
    pub unstake_available_slot: u64,
    pub bump: u8,
    pub version: u16,
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(address = PWRC_MINT)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(init, payer = authority, space = 8 + StakingConfig::INIT_SPACE, seeds = [STAKING_CONFIG_SEED], bump)]
    pub config: Account<'info, StakingConfig>,
    /// CHECK: PDA signer only; no data is read or written.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(init, payer = authority, seeds = [STAKE_VAULT_SEED], bump, token::mint = mint, token::authority = vault_authority, token::token_program = token_program)]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(init, payer = authority, seeds = [REWARD_VAULT_SEED], bump, token::mint = mint, token::authority = vault_authority, token::token_program = token_program)]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(address = anchor_spl::token_2022::ID @ StakingError::InvalidTokenProgram)]
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePosition<'info> {
    #[account(seeds = [STAKING_CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(init, payer = owner, space = 8 + StakePosition::INIT_SPACE, seeds = [POSITION_SEED, owner.key().as_ref()], bump)]
    pub position: Account<'info, StakePosition>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AdminConfig<'info> {
    #[account(mut, seeds = [STAKING_CONFIG_SEED], bump = config.bump, constraint = config.authority == authority.key() @ StakingError::UnauthorizedAuthority)]
    pub config: Account<'info, StakingConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct FundRewards<'info> {
    #[account(mut, seeds = [STAKING_CONFIG_SEED], bump = config.bump, constraint = config.authority == authority.key() @ StakingError::UnauthorizedAuthority, has_one = mint, has_one = reward_vault)]
    pub config: Account<'info, StakingConfig>,
    pub authority: Signer<'info>,
    #[account(address = PWRC_MINT)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = authority, token::token_program = token_program)]
    pub reward_source: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = config.reward_vault, token::mint = mint, token::token_program = token_program)]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(address = anchor_spl::token_2022::ID @ StakingError::InvalidTokenProgram)]
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct Stake<'info> {
    #[account(mut, seeds = [STAKING_CONFIG_SEED], bump = config.bump, has_one = mint, has_one = stake_vault)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut, seeds = [POSITION_SEED, owner.key().as_ref()], bump = position.bump, constraint = position.owner == owner.key() @ StakingError::PositionOwnerMismatch)]
    pub position: Account<'info, StakePosition>,
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(address = PWRC_MINT)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = config.stake_vault, token::mint = mint, token::token_program = token_program)]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,
    #[account(address = anchor_spl::token_2022::ID @ StakingError::InvalidTokenProgram)]
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct PositionAction<'info> {
    #[account(mut, seeds = [STAKING_CONFIG_SEED], bump = config.bump)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut, seeds = [POSITION_SEED, owner.key().as_ref()], bump = position.bump, constraint = position.owner == owner.key() @ StakingError::PositionOwnerMismatch)]
    pub position: Account<'info, StakePosition>,
    pub owner: Signer<'info>,
}

#[derive(Accounts)]
pub struct WithdrawUnstaked<'info> {
    #[account(seeds = [STAKING_CONFIG_SEED], bump = config.bump, has_one = mint, has_one = stake_vault)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut, seeds = [POSITION_SEED, owner.key().as_ref()], bump = position.bump, constraint = position.owner == owner.key() @ StakingError::PositionOwnerMismatch)]
    pub position: Account<'info, StakePosition>,
    pub owner: Signer<'info>,
    #[account(address = PWRC_MINT)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = config.stake_vault, token::mint = mint, token::token_program = token_program)]
    pub stake_vault: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA signer only; constrained by the canonical seed and stored bump.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(address = anchor_spl::token_2022::ID @ StakingError::InvalidTokenProgram)]
    pub token_program: Interface<'info, TokenInterface>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut, seeds = [STAKING_CONFIG_SEED], bump = config.bump, has_one = mint, has_one = reward_vault)]
    pub config: Account<'info, StakingConfig>,
    #[account(mut, seeds = [POSITION_SEED, owner.key().as_ref()], bump = position.bump, constraint = position.owner == owner.key() @ StakingError::PositionOwnerMismatch)]
    pub position: Account<'info, StakePosition>,
    pub owner: Signer<'info>,
    #[account(address = PWRC_MINT)]
    pub mint: InterfaceAccount<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token_account: InterfaceAccount<'info, TokenAccount>,
    #[account(mut, address = config.reward_vault, token::mint = mint, token::token_program = token_program)]
    pub reward_vault: InterfaceAccount<'info, TokenAccount>,
    /// CHECK: PDA signer only; constrained by the canonical seed and stored bump.
    #[account(seeds = [VAULT_AUTHORITY_SEED], bump = config.vault_authority_bump)]
    pub vault_authority: UncheckedAccount<'info>,
    #[account(address = anchor_spl::token_2022::ID @ StakingError::InvalidTokenProgram)]
    pub token_program: Interface<'info, TokenInterface>,
}

#[event]
pub struct StakingConfigInitialized {
    pub authority: Pubkey,
    pub mint: Pubkey,
    pub stake_vault: Pubkey,
    pub reward_vault: Pubkey,
    pub reward_allocation_cap_base_units: u64,
    pub reward_rate_ppm_per_epoch: u64,
    pub epoch_slots: u64,
    pub cooldown_slots: u64,
    pub min_stake_base_units: u64,
}

#[event]
pub struct StakePositionInitialized { pub owner: Pubkey }
#[event]
pub struct StakingAuthorityUpdated { pub previous_authority: Pubkey, pub new_authority: Pubkey }
#[event]
pub struct StakingPauseUpdated { pub paused: bool, pub authority: Pubkey }
#[event]
pub struct RewardPolicyUpdated { pub reward_rate_ppm_per_epoch: u64, pub epoch_slots: u64 }
#[event]
pub struct RewardPoolFunded { pub authority: Pubkey, pub requested_base_units: u64, pub credited_base_units: u64, pub total_funded_base_units: u64 }
#[event]
pub struct StakeDeposited { pub owner: Pubkey, pub requested_base_units: u64, pub credited_base_units: u64, pub total_staked_base_units: u64 }
#[event]
pub struct UnstakeRequested { pub owner: Pubkey, pub amount_base_units: u64, pub pending_base_units: u64, pub available_slot: u64 }
#[event]
pub struct UnstakeWithdrawn { pub owner: Pubkey, pub debited_base_units: u64, pub received_base_units: u64 }
#[event]
pub struct RewardsClaimed { pub owner: Pubkey, pub debited_base_units: u64, pub received_base_units: u64, pub total_distributed_base_units: u64 }

#[error_code]
pub enum StakingError {
    #[msg("The configured authority is invalid.")]
    InvalidAuthority,
    #[msg("The program account cannot be its own staking authority.")]
    ProgramCannotBeAuthority,
    #[msg("The staking mint must be the canonical PWRC Token-2022 mint.")]
    InvalidMint,
    #[msg("Staking requires the canonical Solana Token-2022 program.")]
    InvalidTokenProgram,
    #[msg("The staking configuration version is unsupported.")]
    ConfigVersionMismatch,
    #[msg("The stake position version is unsupported.")]
    PositionVersionMismatch,
    #[msg("Reward allocation cap must be greater than zero and is set by the verified deployment configuration.")]
    InvalidRewardAllocation,
    #[msg("The caller is not the configured staking authority.")]
    UnauthorizedAuthority,
    #[msg("The staking program is paused.")]
    StakingPaused,
    #[msg("The reward rate is invalid.")]
    InvalidRewardRate,
    #[msg("Reward epoch slots must be greater than zero.")]
    InvalidEpochSlots,
    #[msg("Minimum stake must be greater than zero.")]
    InvalidMinimumStake,
    #[msg("Reward policy cannot change while principal is actively staked.")]
    RewardPolicyLockedWhileStaked,
    #[msg("Amount must be greater than zero.")]
    InvalidAmount,
    #[msg("Stake amount is below the configured minimum.")]
    StakeBelowMinimum,
    #[msg("The position does not have enough active stake.")]
    InsufficientStakedBalance,
    #[msg("The connected wallet does not own this stake position.")]
    PositionOwnerMismatch,
    #[msg("The unstake cooldown has not completed.")]
    CooldownActive,
    #[msg("There is no pending unstake amount to withdraw.")]
    NothingToWithdraw,
    #[msg("There are no accrued rewards to claim.")]
    NoRewardsAvailable,
    #[msg("The stake vault does not contain enough principal.")]
    StakeVaultUnderfunded,
    #[msg("The reward vault does not contain enough funded rewards.")]
    RewardVaultUnderfunded,
    #[msg("Reward funding is insufficient for this claim.")]
    RewardFundingInsufficient,
    #[msg("The fixed staking reward allocation cap would be exceeded.")]
    RewardAllocationExceeded,
    #[msg("Token-2022 transfer credited no spendable amount after extension processing.")]
    TransferAmountTooSmall,
    #[msg("Stake received after Token-2022 extension processing is below the configured minimum.")]
    StakeBelowMinimumAfterTransferFee,
    #[msg("A vault balance invariant failed.")]
    VaultBalanceInvariant,
    #[msg("Arithmetic overflow or underflow.")]
    ArithmeticOverflow,
}
