module suithetic::dataset {
    use sui::sui::SUI;
    use sui::coin::Coin;
    use sui::package::claim;
    use std::string::String;
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{Self, TransferPolicy, TransferRequest};

    const ENoAccess: u64 = 0;

    public struct DatasetMetadata has store {
        name: String,
        num_rows: u64,
    }

    public struct Dataset has key, store {
        id: UID,
        owner: address,
        blob_id: String,
        metadata: DatasetMetadata,
    }

    public struct DATASET has drop {}

    #[allow(lint(share_owned))]
    fun init(otw: DATASET, ctx: &mut TxContext) {
        let publisher = claim(otw, ctx);

        let (dataset_policy, dataset_policy_cap) = transfer_policy::new<Dataset>(&publisher, ctx);

        transfer::public_share_object(dataset_policy);
        transfer::public_transfer(dataset_policy_cap, ctx.sender());

        transfer::public_transfer(publisher, ctx.sender());
    }

    entry public fun create_dataset(blob_id: String, name: String, num_rows: u64, ctx: &mut TxContext) {
        let dataset = Dataset {
            id: object::new(ctx),
            owner: ctx.sender(),
            blob_id,
            metadata: DatasetMetadata {
                name,
                num_rows,
            },
        };

        transfer::public_transfer(dataset, ctx.sender());
    }

    entry public fun publish_dataset(dataset: Dataset, price: u64, kiosk: &mut Kiosk, cap: &KioskOwnerCap) {
        kiosk::place_and_list(kiosk, cap, dataset, price)
    }

    entry public fun purchase_dataset(dataset: address, kiosk: &mut Kiosk, payment: Coin<SUI>, policy: &TransferPolicy<Dataset>, ctx: &mut TxContext) {
        let (mut dataset, request) = kiosk::purchase<Dataset>(kiosk, object::id_from_address(dataset), payment);
        confirm_request(policy, request);

        let new_owner = ctx.sender();

        dataset.owner = new_owner;
        transfer::public_transfer(dataset, new_owner);
    }

    public fun confirm_request(policy: &TransferPolicy<Dataset>, request: TransferRequest<Dataset>) {
        transfer_policy::confirm_request<Dataset>(policy, request);
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
