import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export const TESTNET_WALRUS_PACKAGE_CONFIG = {
	systemObjectId: "0x6c2547cbbc38025cf3adac45f63cb0a8d12ecf777cdc75a4971612bf97fdf6af",
	stakingPoolId: "0xbe46180321c30aab2f8b3501e24048377287fa708018a5b7c2792b35fe339ee3",
	subsidiesObjectId: "0xda799d85db0429765c8291c594d334349ef5bc09220e79ad397b30106161a0af",
	exchangeIds: [
		"0xf4d164ea2def5fe07dc573992a029e010dba09b1a8dcbc44c5c2e79567f39073",
		"0x19825121c52080bb1073662231cfea5c0e4d905fd13e95f21e9a018f2ef41862",
		"0x83b454e524c71f30803f4d6c302a86fb6a39e96cdfb873c2d1e93bc1c26a3bc5",
		"0x8d63209cf8589ce7aef8f262437163c67577ed09f3e636a9d8e0813843fb8bf1",
	],
}

export const TESTNET_KEYPAIR = Ed25519Keypair.fromSecretKey(
  "suiprivkey1qzmcxscyglnl9hnq82crqsuns0q33frkseks5jw0fye3tuh83l7e6ajfhxx",
);

export const MIST_PER_USDC = 1_000_000;
export const ED25519_SIGNATURE_LENGTH = 64;
export const TESTNET_PACKAGE_ID = "0x5f06493bc9eda711f57467ce7b24453cf17c5c35367a8f2a34941855ad0e5c7d";
export const TESTNET_SUITHETIC_OBJECT = "0x06315d83386268da6b2eb8f0fe82c44544a41be2a9c66af58a89c21eed432ee4";
export const TESTNET_USDC_TYPE = "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
