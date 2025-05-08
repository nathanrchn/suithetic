module suithetic::suithetic {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
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

    public fun add_to_balance(suithetic: &mut Suithetic, coin: Coin<SUI>) {
        coin::put(&mut suithetic.balance, coin)
    }
}
