module suithetic::dataset {
    use sui::event;
    use sui::sui::SUI;
    use sui::package::claim;
    use std::string::String;
    use sui::coin::{Self, Coin};
    use suithetic::suithetic::{Self, Request};
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{Self, TransferPolicy, TransferRequest};
    
    const ENoAccess: u64 = 0;
    const EInvalidDataset: u64 = 1;
    const EInsufficientAmount: u64 = 2;

    public struct RoyaltyRule has drop {}
    
    public struct RoyaltyConfig has store, drop {
        amount_bp: u16,
    }

    public struct DatasetMetadata has store {
        name: String,
        num_rows: u64,
        num_tokens: u64,
        version: u64,
    }

    public struct Dataset has key, store {
        id: UID,
        owner: address,
        blob_id: String,
        creator: address,
        metadata: DatasetMetadata,
    }

    public struct DatasetListedEvent has copy, drop {
        dataset: ID,
        kiosk: ID,
        version: u64,
    }

    public struct DatasetPurchasedEvent has copy, drop {
        dataset: ID,
        version: u64,
    }

    public struct DATASET has drop {}

    #[allow(lint(share_owned))]
    fun init(otw: DATASET, ctx: &mut TxContext) {
        let publisher = claim(otw, ctx);

        let (mut dataset_policy, dataset_policy_cap) = transfer_policy::new<Dataset>(&publisher, ctx);
        transfer_policy::add_rule(RoyaltyRule {}, &mut dataset_policy, &dataset_policy_cap, RoyaltyConfig { amount_bp: 100 });

        transfer::public_share_object(dataset_policy);
        transfer::public_transfer(dataset_policy_cap, ctx.sender());

        transfer::public_transfer(publisher, ctx.sender());
    }

    public fun create_dataset(blob_id: String, name: String, num_rows: u64, num_tokens: u64, ctx: &mut TxContext): (Dataset, Request) {
        let dataset = Dataset {
            id: object::new(ctx),
            owner: ctx.sender(),
            blob_id,
            creator: ctx.sender(),
            metadata: DatasetMetadata {
                name,
                num_rows,
                num_tokens,
                version: 0,
            },
        };

        (dataset, suithetic::new_request())
    }

    entry public fun place_and_list_dataset(dataset: Dataset, price: u64, kiosk: &mut Kiosk, cap: &KioskOwnerCap) {
        let dataset_id = object::id(&dataset);
        let dataset_version = dataset.metadata.version;

        kiosk::place_and_list(kiosk, cap, dataset, price);

        event::emit(DatasetListedEvent {
            dataset: dataset_id,
            kiosk: object::id(kiosk),
            version: dataset_version,
        });
    }

    entry public fun purchase_dataset(dataset: address, kiosk: &mut Kiosk, payment: Coin<SUI>, policy: &TransferPolicy<Dataset>, ctx: &mut TxContext) {
        let (mut dataset, request) = kiosk::purchase<Dataset>(kiosk, object::id_from_address(dataset), payment);

        transfer_policy::confirm_request<Dataset>(policy, request);

        let new_owner = ctx.sender();

        event::emit(DatasetPurchasedEvent {
            dataset: object::id(&dataset),
            version: dataset.metadata.version,
        });

        dataset.owner = new_owner;
        dataset.metadata.version = dataset.metadata.version + 1;
        transfer::public_transfer(dataset, new_owner);
    }

    public fun payRoyalty(dataset: &Dataset, policy: &TransferPolicy<Dataset>, request: &mut TransferRequest<Dataset>, payment: Coin<SUI>) {
        assert!(object::id(dataset) == request.item(), EInvalidDataset);

        let paid = transfer_policy::paid(request);

        let config: &RoyaltyConfig = transfer_policy::get_rule(RoyaltyRule {}, policy);
        let amount = (((paid as u128) * (config.amount_bp as u128) / 10_000) as u64);

        assert!(coin::value(&payment) == amount, EInsufficientAmount);

        transfer::public_transfer(payment, dataset.owner);
        transfer_policy::add_receipt(RoyaltyRule {}, request)
    }

    fun approve_internal(id: vector<u8>, dataset: &Dataset, caller: address): bool {
        if (!is_prefix(dataset.id.to_bytes(), id)) {
            return false
        };

        dataset.owner == caller
    }

    entry fun seal_approve(id: vector<u8>, dataset: &Dataset, ctx: &TxContext) {
        assert!(approve_internal(id, dataset, ctx.sender()), ENoAccess);
    }

    fun is_prefix(prefix: vector<u8>, word: vector<u8>): bool {
        if (prefix.length() > word.length()) {
            return false
        };
        let mut i = 0;
        while (i < prefix.length()) {
            if (prefix[i] != word[i]) {
                return false
            };
            i = i + 1;
        };
        true
    }
}
