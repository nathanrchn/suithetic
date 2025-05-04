module suithetic::dataset_rules {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use suithetic::dataset::Dataset;
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap, TransferRequest};

    const EIncorrectArgument: u64 = 0;
    const EInsufficientAmount: u64 = 1;

    const MAX_BPS: u16 = 10_000;

    public struct RoyaltyRule has drop {}
    
    public struct RoyaltyConfig has store, drop {
        amount_bp: u16,
    }

    public fun addRoyaltyRule<T: key + store>(policy: &mut TransferPolicy<T>, cap: &TransferPolicyCap<T>, amount_bp: u16) {
        assert!(amount_bp <= MAX_BPS, EIncorrectArgument);
        transfer_policy::add_rule(RoyaltyRule {}, policy, cap, RoyaltyConfig { amount_bp })
    }

    public fun payRoyalty<T: key + store>(dataset: &Dataset, policy: &TransferPolicy<T>, request: &mut TransferRequest<T>, payment: Coin<SUI>) {
        let paid = transfer_policy::paid(request);

        let config: &RoyaltyConfig = transfer_policy::get_rule(RoyaltyRule {}, policy);
        let amount = (((paid as u128) * (config.amount_bp as u128) / 10_000) as u64);

        assert!(coin::value(&payment) == amount, EInsufficientAmount);

        transfer::public_transfer(payment, dataset.get_owner());
        transfer_policy::add_receipt(RoyaltyRule {}, request)
    }
}
