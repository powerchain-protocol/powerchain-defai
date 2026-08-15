#[test_only]
module powerchain_bridge::powerchain_bridge_tests {
    // Deployment-level tests are run by scripts/test-sui-move.sh against the
    // installed Sui CLI. Wormhole NTT remains the sole principal bridge.
    #[test]
    fun smoke() { assert!(1 + 1 == 2, 0); }
}
