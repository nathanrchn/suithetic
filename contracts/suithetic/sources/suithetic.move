module suithetic::suithetic {
    use sui::sui::SUI;
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};

    public struct Suithetic has key {
        id: UID,
        balance: Balance<SUI>
    }

    public struct Request {}

    fun init(ctx: &mut TxContext) {
        let suithetic = Suithetic {
            id: object::new(ctx),
            balance: balance::zero()
        };

        transfer::share_object(suithetic);
    }

    public fun new_request(): Request {
        Request {}
    }

    public fun confirm_request(request: Request, payment: Coin<SUI>, suithetic: &mut Suithetic) {
        coin::put(&mut suithetic.balance, payment);

        let Request {} = request;
    }
}
