"use client";

import { getDataset } from "@/lib/actions";
import { DatasetObject } from "@/lib/types";
import { fromHex } from "@mysten/sui/utils";
import { use, useState, useEffect } from "react";
import { getWalrusPublisherUrl } from "@/lib/utils";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import { EncryptedObject, SealClient } from "@mysten/seal";
import { getAllowlistedKeyServers, SessionKey } from "@mysten/seal";
import { useSignPersonalMessage, useSuiClient } from "@mysten/dapp-kit";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [dataset, setDataset] = useState<DatasetObject | null>(null);
  const [decryptedBytes, setDecryptedBytes] = useState<Uint8Array | null>(null);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const sealClient = new SealClient({
    suiClient,
    serverObjectIds: [getAllowlistedKeyServers("testnet")[0]],
    verifyKeyServers: false,
  });

  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  const getBlob = async (id: string) => {
    return fetch(`${getWalrusPublisherUrl(`/v1/blobs/${id}`, "service1")}`)
      .then((res) => res.arrayBuffer())
      .then((buffer) => new Uint8Array(buffer));
  }

  const decryptBlob = async (data: Uint8Array, dataset: DatasetObject) => {
    const tx = new Transaction();

    console.log(data);

    const id = EncryptedObject.parse(data).id;

    const sessionKey = new SessionKey({
      address: currentAccount!.address,
      packageId: TESTNET_PACKAGE_ID,
      ttlMin: 10,
    });

    signPersonalMessage({ message: sessionKey.getPersonalMessage() }, { onSuccess: async (result) => {
      await sessionKey.setPersonalMessageSignature(result.signature);

      tx.moveCall({
        target: `${TESTNET_PACKAGE_ID}::dataset::seal_approve`,
        arguments: [tx.pure.vector("u8", fromHex(id)), tx.object(dataset!.id)],
      });
  
      const txBytes = await tx.build({ client: suiClient, onlyTransactionKind: true });

      await sealClient.fetchKeys({
        ids: [id],
        txBytes,
        sessionKey,
        threshold: 1,
      });

      const keyServers = await sealClient.getKeyServers();
      console.log(keyServers);
  
      const decryptedBytes = await sealClient.decrypt({
        data,
        sessionKey,
        txBytes,
      });

      console.log(decryptedBytes);

      setDecryptedBytes(decryptedBytes);
    }});
  };

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
      decryptBlob(blob, dataset);
    });
  }, [dataset, currentAccount]);

  return (
    <div>
      <h1>Dataset</h1>
    </div>
  );
}
