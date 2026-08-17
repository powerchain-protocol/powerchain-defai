module powerchain_bridge::powerchain_bridge {
    use std::string::String;
    use std::vector;
    use sui::event;
    use sui::object::{Self, UID};
    use sui::transfer;
    use sui::tx_context::{Self, TxContext};

    const E_INVALID_AMOUNT: u64 = 1;
    const E_UNAUTHORIZED: u64 = 2;
    const E_PAUSED: u64 = 3;
    const E_INVALID_DIRECTION: u64 = 4;
    const E_INVALID_QUOTE_HASH: u64 = 5;
    const E_INVALID_AUTHORITY: u64 = 6;
    const E_NONCE_OVERFLOW: u64 = 7;
    const E_INVALID_INFORMATION_COMMITMENT: u64 = 8;
    const E_INVALID_DESTINATION: u64 = 9;
    const E_CONFIG_VERSION_MISMATCH: u64 = 10;

    const BRIDGE_CONFIG_VERSION: u16 = 1;
    const DIRECTION_SOLANA_TO_SUI: u8 = 0;
    const DIRECTION_SUI_TO_SOLANA: u8 = 1;
    const INFORMATION_COMMITMENT_VERSION: u16 = 1;
    const INFORMATION_COMMITMENT: vector<u8> = x"f6bfd1627686fbff066ee68045a0808be4c1fc69350f3ff35fb501fa28ce51b5";
    const BRIDGE_INTENT_EVENT_VERSION: u16 = 2;

    /// Auxiliary PowerChain guard/config state. This object does not custody,
    /// mint, burn, lock or unlock PWRC/wPWRC; Wormhole NTT owns principal flow.
    public struct BridgeConfig has key {
        id: UID,
        authority: address,
        paused: bool,
        version: u16,
        next_nonce: u64,
    }

    /// Separate shared commitment object so BridgeConfig layout stays upgrade-safe.
    public struct InformationCommitment has key {
        id: UID,
        authority: address,
        version: u16,
        digest: vector<u8>,
    }

    public struct InformationCommitmentCreated has copy, drop {
        authority: address,
        version: u16,
        digest: vector<u8>,
    }

    public struct BridgeIntent has copy, drop {
        authority: address,
        operation_nonce: u64,
        quote_hash: vector<u8>,
        direction: u8,
        amount_base_units: u64,
        destination: String,
    }


    public struct BridgeIntentV2 has copy, drop {
        event_version: u16,
        authority: address,
        operation_nonce: u64,
        quote_hash: vector<u8>,
        direction: u8,
        amount_base_units: u64,
        destination: String,
        observed_epoch: u64,
    }

    public struct BridgeAuthorityUpdated has copy, drop {
        previous_authority: address,
        new_authority: address,
    }

    public struct BridgePauseUpdated has copy, drop {
        authority: address,
        paused: bool,
    }

    fun init(ctx: &mut TxContext) {
        let authority = tx_context::sender(ctx);
        let config = BridgeConfig {
            id: object::new(ctx),
            authority,
            paused: false,
            version: BRIDGE_CONFIG_VERSION,
            next_nonce: 0,
        };
        transfer::share_object(config);
        event::emit(BridgeAuthorityUpdated {
            previous_authority: @0x0,
            new_authority: authority,
        });
        event::emit(BridgePauseUpdated { authority, paused: false });
    }

    /// Creates the canonical token-information commitment object for an upgraded
    /// deployment. The object is separate from BridgeConfig and does not custody assets.
    public entry fun create_information_commitment(
        config: &BridgeConfig,
        ctx: &mut TxContext,
    ) {
        assert_config_version(config);
        assert_authority(config, ctx);
        let digest = INFORMATION_COMMITMENT;
        assert!(vector::length(&digest) == 32, E_INVALID_INFORMATION_COMMITMENT);
        let information = InformationCommitment {
            id: object::new(ctx),
            authority: config.authority,
            version: INFORMATION_COMMITMENT_VERSION,
            digest,
        };
        let event_digest = INFORMATION_COMMITMENT;
        event::emit(InformationCommitmentCreated {
            authority: config.authority,
            version: INFORMATION_COMMITMENT_VERSION,
            digest: event_digest,
        });
        transfer::share_object(information);
    }

    public entry fun set_authority(
        config: &mut BridgeConfig,
        new_authority: address,
        ctx: &mut TxContext,
    ) {
        assert_config_version(config);
        assert_authority(config, ctx);
        assert!(new_authority != @0x0, E_INVALID_AUTHORITY);
        let previous_authority = config.authority;
        config.authority = new_authority;
        event::emit(BridgeAuthorityUpdated { previous_authority, new_authority });
    }

    public entry fun set_paused(
        config: &mut BridgeConfig,
        paused: bool,
        ctx: &mut TxContext,
    ) {
        assert_config_version(config);
        assert_authority(config, ctx);
        config.paused = paused;
        event::emit(BridgePauseUpdated { authority: config.authority, paused });
    }

    public entry fun record_intent(
        config: &mut BridgeConfig,
        quote_hash: vector<u8>,
        direction: u8,
        amount_base_units: u64,
        destination: String,
        ctx: &mut TxContext,
    ) {
        assert_config_version(config);
        assert_authority(config, ctx);
        assert!(!config.paused, E_PAUSED);
        assert_valid_intent(&quote_hash, direction, amount_base_units, &destination);

        let operation_nonce = config.next_nonce;
        assert!(operation_nonce < 18446744073709551615, E_NONCE_OVERFLOW);
        config.next_nonce = operation_nonce + 1;

        event::emit(BridgeIntent {
            authority: config.authority,
            operation_nonce,
            quote_hash: vector::copy(&quote_hash),
            direction,
            amount_base_units,
            destination: std::string::utf8(vector::copy(std::string::bytes(&destination))),
        });
        event::emit(BridgeIntentV2 {
            event_version: BRIDGE_INTENT_EVENT_VERSION,
            authority: config.authority,
            operation_nonce,
            quote_hash,
            direction,
            amount_base_units,
            destination,
            observed_epoch: tx_context::epoch(ctx),
        });
    }

    public fun information_commitment(information: &InformationCommitment): &vector<u8> { &information.digest }
    public fun information_commitment_version(information: &InformationCommitment): u16 { information.version }

    public fun authority(config: &BridgeConfig): address { config.authority }
    public fun paused(config: &BridgeConfig): bool { config.paused }
    public fun version(config: &BridgeConfig): u16 { config.version }
    public fun next_nonce(config: &BridgeConfig): u64 { config.next_nonce }

    fun assert_valid_intent(quote_hash: &vector<u8>, direction: u8, amount_base_units: u64, destination: &String) {
        assert!(amount_base_units > 0, E_INVALID_AMOUNT);
        assert!(direction == DIRECTION_SOLANA_TO_SUI || direction == DIRECTION_SUI_TO_SOLANA, E_INVALID_DIRECTION);
        assert!(vector::length(quote_hash) == 32, E_INVALID_QUOTE_HASH);
        assert!(!is_all_zero(quote_hash), E_INVALID_QUOTE_HASH);
        let destination_bytes = std::string::bytes(destination);
        assert!(vector::length(destination_bytes) > 0 && vector::length(destination_bytes) <= 128, E_INVALID_DESTINATION);
    }

    fun is_all_zero(bytes: &vector<u8>): bool {
        let i = 0;
        while (i < vector::length(bytes)) {
            if (*vector::borrow(bytes, i) != 0) return false;
            i = i + 1;
        };
        true
    }

    fun assert_config_version(config: &BridgeConfig) {
        assert!(config.version == BRIDGE_CONFIG_VERSION, E_CONFIG_VERSION_MISMATCH);
    }

    fun assert_authority(config: &BridgeConfig, ctx: &TxContext) {
        assert!(tx_context::sender(ctx) == config.authority, E_UNAUTHORIZED);
    }
}
