import { WalrusService } from "./types";
import { Ed25519Keypair } from "@mysten/sui/keypairs/ed25519";

export const WALRUS_SERVICES: WalrusService[] = [
  {
    id: "service1",
    name: "walrus.space",
    publisherUrl: "https://publisher.walrus-testnet.walrus.space",
    aggregatorUrl: "https://aggregator.walrus-testnet.walrus.space",
  },
  {
    id: "service2",
    name: "staketab.org",
    publisherUrl: "https://wal-publisher-testnet.staketab.org",
    aggregatorUrl: "https://wal-aggregator-testnet.staketab.org",
  },
  {
    id: "service3",
    name: "redundex.com",
    publisherUrl: "https://walrus-testnet-publisher.redundex.com",
    aggregatorUrl: "https://walrus-testnet-aggregator.redundex.com",
  },
  {
    id: "service4",
    name: "nodes.guru",
    publisherUrl: "https://walrus-testnet-publisher.nodes.guru",
    aggregatorUrl: "https://walrus-testnet-aggregator.nodes.guru",
  },
  {
    id: "service5",
    name: "banansen.dev",
    publisherUrl: "https://publisher.walrus.banansen.dev",
    aggregatorUrl: "https://aggregator.walrus.banansen.dev",
  },
  {
    id: "service6",
    name: "everstake.one",
    publisherUrl: "https://walrus-testnet-publisher.everstake.one",
    aggregatorUrl: "https://walrus-testnet-aggregator.everstake.one",
  },
];

export const UNITS_PER_USDC = 1_000_000;
export const TESTNET_PACKAGE_ID = "0x4fbab0de0271f7f1d29544c40309602af3c58f0ea59e589e47c36d6e3219fdd9";
export const TESTNET_SUITHETIC_OBJECT = "0x236e7be20173bc25fe730d2d97c5e0da650cc1a4a922b61fb89a4b5f613ea367";
