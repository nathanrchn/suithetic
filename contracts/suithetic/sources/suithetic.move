module suithetic::suithetic {
    use sui::sui::SUI;
    use sui::balance::{Self, Balance};

    public struct Suithetic has key {
        id: UID,
        balance: Balance<SUI>
    }

    fun init(ctx: &mut TxContext) {
        let suithetic = Suithetic {
            id: object::new(ctx),
            balance: balance::zero()
        };

        transfer::share_object(suithetic);
    }
}
