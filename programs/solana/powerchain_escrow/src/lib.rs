use anchor_lang::prelude::*;
use anchor_lang::solana_program::{instruction::{AccountMeta, Instruction}, program::invoke};
use anchor_spl::token_interface::{self, Mint, TokenAccount, TokenInterface, TransferChecked};
use spl_token_2022::{extension::{BaseStateWithExtensions, StateWithExtensions}, state::Mint as Token2022Mint};

declare_id!("8AQLAvN5gcV1nbWoEfaPqnorsqJLPjmvEFeZBHkWCKBw");

const ESCROW_SEED: &[u8] = b"escrow";
const RECEIPT_SEED: &[u8] = b"receipt";
const ALLOWED_MINT_SEED: &[u8] = b"allowed_mint";
const EXTENSIONS_SEED: &[u8] = b"extensions";
const VAULT_SEED: &[u8] = b"vault";
const VERSION: u16 = 1;
const HOOK_DOMAIN: &[u8] = b"PCESCROW1";

#[program]
pub mod powerchain_escrow {
    use super::*;

    pub fn create_escrow(ctx: Context<CreateEscrow>, escrow_seed: [u8; 32], args: EscrowExtensionArgs) -> Result<()> {
        require!(ctx.accounts.admin.key() != crate::ID, EscrowError::InvalidAdmin);
        validate_hook(ctx.accounts.admin.key(), args.hook_program)?;
        let escrow=&mut ctx.accounts.escrow;
        escrow.admin=ctx.accounts.admin.key(); escrow.escrow_seed=escrow_seed; escrow.immutable=false; escrow.bump=ctx.bumps.escrow; escrow.version=VERSION;
        let extensions=&mut ctx.accounts.extensions;
        extensions.escrow=escrow.key(); extensions.timelock_slots=args.timelock_slots; extensions.hook_program=args.hook_program;
        extensions.block_permanent_delegate=args.block_permanent_delegate; extensions.block_non_transferable=args.block_non_transferable;
        extensions.block_pausable=args.block_pausable; extensions.block_transfer_hook=args.block_transfer_hook; extensions.immutable=false; extensions.bump=ctx.bumps.extensions; extensions.version=VERSION;
        emit!(EscrowCreated{escrow:escrow.key(),admin:escrow.admin,hook_program:extensions.hook_program,timelock_slots:extensions.timelock_slots}); Ok(())
    }

    pub fn set_allowed_mint(ctx: Context<SetAllowedMint>, allowed: bool) -> Result<()> {
        assert_mutable(&ctx.accounts.escrow)?;
        let marker=&mut ctx.accounts.allowed_mint; marker.escrow=ctx.accounts.escrow.key(); marker.mint=ctx.accounts.mint.key(); marker.allowed=allowed; marker.bump=ctx.bumps.allowed_mint; marker.version=VERSION;
        emit!(AllowedMintUpdated{escrow:marker.escrow,mint:marker.mint,allowed}); Ok(())
    }

    pub fn set_extensions(ctx: Context<SetExtensions>, args: EscrowExtensionArgs) -> Result<()> {
        assert_mutable(&ctx.accounts.escrow)?; require!(!ctx.accounts.extensions.immutable, EscrowError::EscrowImmutable); validate_hook(ctx.accounts.admin.key(), args.hook_program)?;
        let ext=&mut ctx.accounts.extensions; ext.timelock_slots=args.timelock_slots; ext.hook_program=args.hook_program;
        ext.block_permanent_delegate=args.block_permanent_delegate; ext.block_non_transferable=args.block_non_transferable; ext.block_pausable=args.block_pausable; ext.block_transfer_hook=args.block_transfer_hook;
        emit!(EscrowExtensionsUpdated{escrow:ctx.accounts.escrow.key(),hook_program:ext.hook_program,timelock_slots:ext.timelock_slots}); Ok(())
    }

    pub fn make_immutable(ctx: Context<SetExtensions>) -> Result<()> {
        assert_mutable(&ctx.accounts.escrow)?; ctx.accounts.escrow.immutable=true; ctx.accounts.extensions.immutable=true;
        emit!(EscrowMadeImmutable{escrow:ctx.accounts.escrow.key(),hook_program:ctx.accounts.extensions.hook_program}); Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, receipt_seed: [u8; 32], amount_base_units: u64) -> Result<()> {
        require!(amount_base_units>0, EscrowError::InvalidAmount); assert_version(&ctx.accounts.escrow,&ctx.accounts.extensions,ctx.accounts.escrow.key())?;
        require!(ctx.accounts.allowed_mint.allowed, EscrowError::MintNotAllowed); validate_mint_extensions(&ctx.accounts.mint,&ctx.accounts.extensions)?;
        invoke_hook(&ctx.accounts.extensions, HookPoint::PreDeposit, ctx.accounts.escrow.key(), ctx.accounts.depositor.key(), ctx.accounts.mint.key(), ctx.accounts.receipt.key(), amount_base_units, ctx.remaining_accounts)?;
        let before=ctx.accounts.vault.amount;
        let cpi=TransferChecked{from:ctx.accounts.depositor_token_account.to_account_info(),mint:ctx.accounts.mint.to_account_info(),to:ctx.accounts.vault.to_account_info(),authority:ctx.accounts.depositor.to_account_info()};
        token_interface::transfer_checked(CpiContext::new(ctx.accounts.token_program.to_account_info(),cpi),amount_base_units,ctx.accounts.mint.decimals)?;
        ctx.accounts.vault.reload()?; let credited=ctx.accounts.vault.amount.checked_sub(before).ok_or(EscrowError::VaultBalanceInvariant)?; require!(credited>0,EscrowError::TransferCreditedZero);
        let slot=Clock::get()?.slot; let receipt=&mut ctx.accounts.receipt; receipt.escrow=ctx.accounts.escrow.key(); receipt.depositor=ctx.accounts.depositor.key(); receipt.mint=ctx.accounts.mint.key(); receipt.receipt_seed=receipt_seed; receipt.deposited_base_units=credited; receipt.deposited_slot=slot; receipt.unlock_slot=slot.checked_add(ctx.accounts.extensions.timelock_slots).ok_or(EscrowError::ArithmeticOverflow)?; receipt.redeemed=false; receipt.bump=ctx.bumps.receipt; receipt.version=VERSION;
        invoke_hook(&ctx.accounts.extensions, HookPoint::PostDeposit, ctx.accounts.escrow.key(), ctx.accounts.depositor.key(), ctx.accounts.mint.key(), receipt.key(), credited, ctx.remaining_accounts)?;
        emit!(Deposited{escrow:receipt.escrow,receipt:receipt.key(),depositor:receipt.depositor,mint:receipt.mint,requested_base_units:amount_base_units,credited_base_units:credited,unlock_slot:receipt.unlock_slot}); Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>) -> Result<()> {
        assert_version(&ctx.accounts.escrow,&ctx.accounts.extensions,ctx.accounts.escrow.key())?; require!(!ctx.accounts.receipt.redeemed,EscrowError::ReceiptAlreadyRedeemed); let slot=Clock::get()?.slot; require!(slot>=ctx.accounts.receipt.unlock_slot,EscrowError::TimelockActive);
        let amount=ctx.accounts.receipt.deposited_base_units; require!(amount>0&&ctx.accounts.vault.amount>=amount,EscrowError::VaultUnderfunded);
        invoke_hook(&ctx.accounts.extensions, HookPoint::PreWithdraw, ctx.accounts.escrow.key(), ctx.accounts.depositor.key(), ctx.accounts.mint.key(), ctx.accounts.receipt.key(), amount, ctx.remaining_accounts)?;
        let before=ctx.accounts.depositor_token_account.amount; let seed=ctx.accounts.escrow.escrow_seed; let bump=[ctx.accounts.escrow.bump]; let signer:&[&[u8]]=&[ESCROW_SEED,&seed,&bump];
        let cpi=TransferChecked{from:ctx.accounts.vault.to_account_info(),mint:ctx.accounts.mint.to_account_info(),to:ctx.accounts.depositor_token_account.to_account_info(),authority:ctx.accounts.escrow.to_account_info()};
        token_interface::transfer_checked(CpiContext::new_with_signer(ctx.accounts.token_program.to_account_info(),cpi,&[signer]),amount,ctx.accounts.mint.decimals)?;
        ctx.accounts.depositor_token_account.reload()?; let received=ctx.accounts.depositor_token_account.amount.checked_sub(before).ok_or(EscrowError::VaultBalanceInvariant)?; require!(received>0,EscrowError::TransferCreditedZero); ctx.accounts.receipt.redeemed=true;
        invoke_hook(&ctx.accounts.extensions, HookPoint::PostWithdraw, ctx.accounts.escrow.key(), ctx.accounts.depositor.key(), ctx.accounts.mint.key(), ctx.accounts.receipt.key(), received, ctx.remaining_accounts)?;
        emit!(Withdrawn{escrow:ctx.accounts.escrow.key(),receipt:ctx.accounts.receipt.key(),depositor:ctx.accounts.depositor.key(),mint:ctx.accounts.mint.key(),debited_base_units:amount,received_base_units:received}); Ok(())
    }
}

fn assert_mutable(escrow:&Escrow)->Result<()>{require!(escrow.version==VERSION,EscrowError::VersionMismatch);require!(!escrow.immutable,EscrowError::EscrowImmutable);Ok(())}
fn assert_version(escrow:&Escrow,extensions:&EscrowExtensions,escrow_key:Pubkey)->Result<()>{require!(escrow.version==VERSION&&extensions.version==VERSION,EscrowError::VersionMismatch);require_keys_eq!(extensions.escrow,escrow_key,EscrowError::EscrowMismatch);Ok(())}
fn validate_hook(admin:Pubkey,hook:Pubkey)->Result<()>{require!(hook!=crate::ID,EscrowError::RecursiveHookForbidden);require!(hook!=admin,EscrowError::InvalidHookProgram);Ok(())}

fn validate_mint_extensions(mint:&InterfaceAccount<Mint>,policy:&EscrowExtensions)->Result<()> {
    let mint_info=mint.to_account_info();
    if mint_info.owner != &anchor_spl::token_2022::ID { return Ok(()); }
    let data=mint_info.try_borrow_data()?; let state=StateWithExtensions::<Token2022Mint>::unpack(&data).map_err(|_|error!(EscrowError::MintExtensionDecodeFailed))?;
    let names=state.get_extension_types().map_err(|_|error!(EscrowError::MintExtensionDecodeFailed))?.into_iter().map(|ext|format!("{:?}",ext)).collect::<Vec<_>>();
    if policy.block_permanent_delegate && names.iter().any(|name|name=="PermanentDelegate"){return err!(EscrowError::BlockedPermanentDelegate)}
    if policy.block_non_transferable && names.iter().any(|name|name=="NonTransferable"){return err!(EscrowError::BlockedNonTransferable)}
    if policy.block_pausable && names.iter().any(|name|name=="Pausable"){return err!(EscrowError::BlockedPausable)}
    if policy.block_transfer_hook && names.iter().any(|name|name=="TransferHook"){return err!(EscrowError::BlockedTransferHook)}
    Ok(())
}

#[derive(Clone,Copy)] enum HookPoint{PreDeposit=0,PostDeposit=1,PreWithdraw=2,PostWithdraw=3}
fn invoke_hook<'info>(extensions:&EscrowExtensions,point:HookPoint,escrow:Pubkey,actor:Pubkey,mint:Pubkey,receipt:Pubkey,amount:u64,remaining:&[AccountInfo<'info>])->Result<()> {
    let hook=extensions.hook_program; if hook==Pubkey::default(){return Ok(())}
    require!(remaining.iter().any(|account|account.key()==hook),EscrowError::HookProgramAccountMissing);
    let metas=remaining.iter().filter(|account|account.key()!=hook).map(|account|if account.is_writable{AccountMeta::new(*account.key,false)}else{AccountMeta::new_readonly(*account.key,false)}).collect::<Vec<_>>();
    let mut data=HOOK_DOMAIN.to_vec(); data.push(point as u8); data.extend_from_slice(escrow.as_ref()); data.extend_from_slice(actor.as_ref()); data.extend_from_slice(mint.as_ref()); data.extend_from_slice(receipt.as_ref()); data.extend_from_slice(&amount.to_le_bytes());
    invoke(&Instruction{program_id:hook,accounts:metas,data},remaining).map_err(|_|error!(EscrowError::HookRejected))
}

#[derive(AnchorSerialize,AnchorDeserialize,Clone,Copy)] pub struct EscrowExtensionArgs{pub timelock_slots:u64,pub hook_program:Pubkey,pub block_permanent_delegate:bool,pub block_non_transferable:bool,pub block_pausable:bool,pub block_transfer_hook:bool}
#[account] #[derive(InitSpace)] pub struct Escrow{pub admin:Pubkey,pub escrow_seed:[u8;32],pub immutable:bool,pub bump:u8,pub version:u16}
#[account] #[derive(InitSpace)] pub struct Receipt{pub escrow:Pubkey,pub depositor:Pubkey,pub mint:Pubkey,pub receipt_seed:[u8;32],pub deposited_base_units:u64,pub deposited_slot:u64,pub unlock_slot:u64,pub redeemed:bool,pub bump:u8,pub version:u16}
#[account] #[derive(InitSpace)] pub struct AllowedMint{pub escrow:Pubkey,pub mint:Pubkey,pub allowed:bool,pub bump:u8,pub version:u16}
#[account] #[derive(InitSpace)] pub struct EscrowExtensions{pub escrow:Pubkey,pub timelock_slots:u64,pub hook_program:Pubkey,pub block_permanent_delegate:bool,pub block_non_transferable:bool,pub block_pausable:bool,pub block_transfer_hook:bool,pub immutable:bool,pub bump:u8,pub version:u16}

#[derive(Accounts)] #[instruction(escrow_seed:[u8;32])] pub struct CreateEscrow<'info>{#[account(mut)]pub admin:Signer<'info>,#[account(init,payer=admin,space=8+Escrow::INIT_SPACE,seeds=[ESCROW_SEED,&escrow_seed],bump)]pub escrow:Account<'info,Escrow>,#[account(init,payer=admin,space=8+EscrowExtensions::INIT_SPACE,seeds=[EXTENSIONS_SEED,escrow.key().as_ref()],bump)]pub extensions:Account<'info,EscrowExtensions>,pub system_program:Program<'info,System>}
#[derive(Accounts)] pub struct SetAllowedMint<'info>{#[account(seeds=[ESCROW_SEED,&escrow.escrow_seed],bump=escrow.bump,has_one=admin)]pub escrow:Account<'info,Escrow>,#[account(mut)]pub admin:Signer<'info>,pub mint:InterfaceAccount<'info,Mint>,#[account(init_if_needed,payer=admin,space=8+AllowedMint::INIT_SPACE,seeds=[ALLOWED_MINT_SEED,escrow.key().as_ref(),mint.key().as_ref()],bump)]pub allowed_mint:Account<'info,AllowedMint>,pub system_program:Program<'info,System>}
#[derive(Accounts)] pub struct SetExtensions<'info>{#[account(mut,seeds=[ESCROW_SEED,&escrow.escrow_seed],bump=escrow.bump,has_one=admin)]pub escrow:Account<'info,Escrow>,#[account(mut)]pub admin:Signer<'info>,#[account(mut,seeds=[EXTENSIONS_SEED,escrow.key().as_ref()],bump=extensions.bump,constraint=extensions.escrow==escrow.key()@EscrowError::EscrowMismatch)]pub extensions:Account<'info,EscrowExtensions>}
#[derive(Accounts)] #[instruction(receipt_seed:[u8;32],amount_base_units:u64)] pub struct Deposit<'info>{#[account(seeds=[ESCROW_SEED,&escrow.escrow_seed],bump=escrow.bump)]pub escrow:Account<'info,Escrow>,#[account(seeds=[EXTENSIONS_SEED,escrow.key().as_ref()],bump=extensions.bump)]pub extensions:Account<'info,EscrowExtensions>,#[account(seeds=[ALLOWED_MINT_SEED,escrow.key().as_ref(),mint.key().as_ref()],bump=allowed_mint.bump,constraint=allowed_mint.escrow==escrow.key()@EscrowError::EscrowMismatch,constraint=allowed_mint.mint==mint.key()@EscrowError::MintMismatch)]pub allowed_mint:Account<'info,AllowedMint>,#[account(mut)]pub depositor:Signer<'info>,pub mint:InterfaceAccount<'info,Mint>,#[account(mut,token::mint=mint,token::authority=depositor,token::token_program=token_program)]pub depositor_token_account:InterfaceAccount<'info,TokenAccount>,#[account(init_if_needed,payer=depositor,seeds=[VAULT_SEED,escrow.key().as_ref(),mint.key().as_ref()],bump,token::mint=mint,token::authority=escrow,token::token_program=token_program)]pub vault:InterfaceAccount<'info,TokenAccount>,#[account(init,payer=depositor,space=8+Receipt::INIT_SPACE,seeds=[RECEIPT_SEED,escrow.key().as_ref(),depositor.key().as_ref(),mint.key().as_ref(),&receipt_seed],bump)]pub receipt:Account<'info,Receipt>,pub token_program:Interface<'info,TokenInterface>,pub system_program:Program<'info,System>}
#[derive(Accounts)] pub struct Withdraw<'info>{#[account(seeds=[ESCROW_SEED,&escrow.escrow_seed],bump=escrow.bump)]pub escrow:Account<'info,Escrow>,#[account(seeds=[EXTENSIONS_SEED,escrow.key().as_ref()],bump=extensions.bump)]pub extensions:Account<'info,EscrowExtensions>,#[account(mut,seeds=[RECEIPT_SEED,escrow.key().as_ref(),depositor.key().as_ref(),mint.key().as_ref(),&receipt.receipt_seed],bump=receipt.bump,constraint=receipt.escrow==escrow.key()@EscrowError::EscrowMismatch,constraint=receipt.depositor==depositor.key()@EscrowError::DepositorMismatch,constraint=receipt.mint==mint.key()@EscrowError::MintMismatch)]pub receipt:Account<'info,Receipt>,#[account(mut)]pub depositor:Signer<'info>,pub mint:InterfaceAccount<'info,Mint>,#[account(mut,token::mint=mint,token::authority=depositor,token::token_program=token_program)]pub depositor_token_account:InterfaceAccount<'info,TokenAccount>,#[account(mut,seeds=[VAULT_SEED,escrow.key().as_ref(),mint.key().as_ref()],bump,token::mint=mint,token::authority=escrow,token::token_program=token_program)]pub vault:InterfaceAccount<'info,TokenAccount>,pub token_program:Interface<'info,TokenInterface>}

#[event] pub struct EscrowCreated{pub escrow:Pubkey,pub admin:Pubkey,pub hook_program:Pubkey,pub timelock_slots:u64}
#[event] pub struct AllowedMintUpdated{pub escrow:Pubkey,pub mint:Pubkey,pub allowed:bool}
#[event] pub struct EscrowExtensionsUpdated{pub escrow:Pubkey,pub hook_program:Pubkey,pub timelock_slots:u64}
#[event] pub struct EscrowMadeImmutable{pub escrow:Pubkey,pub hook_program:Pubkey}
#[event] pub struct Deposited{pub escrow:Pubkey,pub receipt:Pubkey,pub depositor:Pubkey,pub mint:Pubkey,pub requested_base_units:u64,pub credited_base_units:u64,pub unlock_slot:u64}
#[event] pub struct Withdrawn{pub escrow:Pubkey,pub receipt:Pubkey,pub depositor:Pubkey,pub mint:Pubkey,pub debited_base_units:u64,pub received_base_units:u64}

#[error_code] pub enum EscrowError{
    #[msg("Admin is invalid.")]InvalidAdmin,#[msg("Escrow configuration is immutable.")]EscrowImmutable,#[msg("Escrow version is unsupported.")]VersionMismatch,#[msg("Escrow account mismatch.")]EscrowMismatch,#[msg("Mint account mismatch.")]MintMismatch,#[msg("Depositor does not own this receipt.")]DepositorMismatch,#[msg("Mint is not allowlisted for this escrow.")]MintNotAllowed,#[msg("Deposit amount must be positive.")]InvalidAmount,#[msg("Receipt was already redeemed.")]ReceiptAlreadyRedeemed,#[msg("Receipt timelock is active.")]TimelockActive,#[msg("Escrow vault is underfunded.")]VaultUnderfunded,#[msg("Arithmetic overflow.")]ArithmeticOverflow,#[msg("Vault balance invariant failed.")]VaultBalanceInvariant,#[msg("Token transfer credited no spendable amount.")]TransferCreditedZero,#[msg("Token-2022 mint extensions could not be decoded.")]MintExtensionDecodeFailed,#[msg("PermanentDelegate is blocked by escrow policy.")]BlockedPermanentDelegate,#[msg("NonTransferable is blocked by escrow policy.")]BlockedNonTransferable,#[msg("Pausable is blocked by escrow policy.")]BlockedPausable,#[msg("TransferHook is blocked by escrow policy.")]BlockedTransferHook,#[msg("Hook program must be a separate deployed program.")]RecursiveHookForbidden,#[msg("Hook program configuration is invalid.")]InvalidHookProgram,#[msg("Configured hook program account is missing from the instruction.")]HookProgramAccountMissing,#[msg("Configured escrow hook rejected the operation.")]HookRejected,
}
