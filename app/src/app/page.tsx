"use client";

import { useEffect, useState } from "react";
import { DatasetObject } from "@/lib/types";
import { useSuiClient, useCurrentAccount } from "@mysten/dapp-kit";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import DatasetCard from "@/components/dataset-card";

export default function Home() {
  const [personalDatasets, setPersonalDatasets] = useState<DatasetObject[]>([]);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();

  const getPersonalDatasets = async (): Promise<DatasetObject[]> => {
    if (!currentAccount) return [];

    const res = await suiClient.getOwnedObjects({
      owner: currentAccount.address,
      filter: {
        MoveModule: {
          module: "dataset",
          package: TESTNET_PACKAGE_ID
        }
      }
    });

    const objects = await suiClient.multiGetObjects({
      ids: res.data.map((obj) => obj.data!.objectId),
      options: {
        showContent: true,
      }
    });

    return objects.filter((obj) => {
      const content = obj.data!.content! as any;
      return content.fields.version > 0;
    }).map((obj) => {
      const content = obj.data!.content! as any;

      return {
        id: obj.data!.objectId,
        owner: content.fields.owner,
        creator: content.fields.creator,
        version: content.fields.version,
        metadata: {
          name: content.fields.metadata.fields.name,
          numRows: content.fields.metadata.fields.num_rows,
          numTokens: content.fields.metadata.fields.num_tokens,
        },
        data: content.fields.data,
        blobId: content.fields.blob_id,
        signatures: content.fields.signatures,
      }
    });
  }

  useEffect(() => {
    getPersonalDatasets().then(datasets => {
      setPersonalDatasets(datasets);
    });
  }, [currentAccount]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">My Datasets</h1>
      {currentAccount && personalDatasets.length === 0 && (
        <p>No datasets found for your account.</p>
      )}
      {!currentAccount && (
        <p>Please connect your wallet to see your datasets.</p>
      )}
      {personalDatasets.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {personalDatasets.map((dataset) => (
            <DatasetCard key={dataset.id} dataset={dataset} />
          ))}
        </div>
      )}
    </div>
  );
}
