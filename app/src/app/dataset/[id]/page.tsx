"use client";

import { DatasetObject } from "@/lib/types";
import { fromHex } from "@mysten/sui/utils";
import { useSuiClient } from "@mysten/dapp-kit";
import { use, useState, useEffect } from "react";
import { getBlob, getDataset } from "@/lib/actions";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { EncryptedObject, SealClient } from "@mysten/seal";
import { getAllowlistedKeyServers, SessionKey } from "@mysten/seal";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dataset, setDataset] = useState<DatasetObject | null>(null);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: getAllowlistedKeyServers("testnet"),
    verifyKeyServers: false,
  });

  const decryptBlob = async (data: Uint8Array, dataset: DatasetObject): Promise<Uint8Array> => {
    const tx = new Transaction();

    const id = EncryptedObject.parse(data).id;

    tx.moveCall({
      target: `${TESTNET_PACKAGE_ID}::dataset::seal_approve`,
      arguments: [tx.pure.vector("u8", fromHex(id)), tx.object(dataset!.id)],
    });

    const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

    const sessionKey = new SessionKey({
      address: currentAccount!.address,
      packageId: TESTNET_PACKAGE_ID,
      ttlMin: 10,
    });

    console.log(txBytes);

    const decryptedBytes = await sealClient.decrypt({
      data,
      sessionKey,
      txBytes,
    });

    return decryptedBytes;
  }

  useEffect(() => {
    getDataset(id).then((dataset) => {
      setDataset(dataset);
    });
  }, []);

  useEffect(() => {
    if (!dataset || !currentAccount) {
      return;
    }

    getBlob(dataset!.blobId).then((blob) => {
      console.log(blob);
      decryptBlob(blob, dataset).then((decryptedBytes) => {
        console.log(decryptedBytes);
      });
    });
  }, [dataset, currentAccount]);

  return (
    <div>
      <h1>Dataset</h1>
    </div>
  );
}
