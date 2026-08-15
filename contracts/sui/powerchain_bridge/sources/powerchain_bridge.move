module powerchain_bridge::powerchain_bridge {
    use std::string::String;
    use sui::event;
    use sui::tx_context::{Self, TxContext};

    const E_INVALID_AMOUNT: u64 = 1;

    public struct BridgeIntent has copy, drop {
        sender: address,
        quote_hash: vector<u8>,
        direction: u8,
        amount_base_units: u64,
        destination: String,
    }

    public entry fun record_intent(
        quote_hash: vector<u8>,
        direction: u8,
        amount_base_units: u64,
        destination: String,
        ctx: &mut TxContext,
    ) {
        assert!(amount_base_units > 0, E_INVALID_AMOUNT);
        event::emit(BridgeIntent {
            sender: tx_context::sender(ctx),
            quote_hash,
            direction,
            amount_base_units,
            destination,
        });
    }
}
