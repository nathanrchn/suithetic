"use client";

import { useEffect, useState } from "react";
import { DatasetObject } from "@/lib/types";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import DatasetCard from "@/components/dataset-card";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { Transaction } from "@mysten/sui/transactions";
import { KioskClient, KioskOwnerCap, Network } from "@mysten/kiosk";
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction, useSuiClientQuery } from "@mysten/dapp-kit";

export default function Home() {
  const [kioskIds, setKioskIds] = useState<string[]>([]);
  const [kioskOwnerCaps, setKioskOwnerCaps] = useState<KioskOwnerCap[]>([]);
  const [listedDatasets, setListedDatasets] = useState<DatasetObject[]>([]);
  const [personalDatasets, setPersonalDatasets] = useState<DatasetObject[]>([]);

  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const kioskClient = new KioskClient({ client: suiClient as any, network: Network.TESTNET });

  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const { data: names } = useSuiClientQuery(
    "resolveNameServiceNames",
    { address: "0xc640b846e5e6e72a77e16d4714115eb670a5814c7ce398f134b44fcc204cfccf" },
    { enabled: true }
  );

  console.log("names", names);

  const handlePlaceAndListDatasetAttempt = async (datasetId: string, price: string, address: string) => {
    const tx = new Transaction();

    let kioskObject: any;
    let kioskCap: any;
    if (kioskIds.length === 0) {
      const [newKiosk, newCap] = tx.moveCall({
        target: '0x2::kiosk::new',
      });

      kioskObject = newKiosk;
      kioskCap = newCap;
    } else {
      kioskObject = kioskIds[0];
      kioskCap = kioskOwnerCaps[0].objectId;
    }

    tx.moveCall({
      target: `${TESTNET_PACKAGE_ID}::dataset::place_and_list_dataset`,
      arguments: [
        tx.object(datasetId),
        tx.pure.u64(BigInt(price) * MIST_PER_SUI),
        tx.object(kioskObject),
        tx.object(kioskCap),
      ]
    })

    signAndExecuteTransaction({ transaction: tx }, { onSuccess: () => {
      getPersonalDatasets().then(datasets => {
        setPersonalDatasets(datasets);
      });
  
      getListedDatasets().then(datasets => {
        setListedDatasets(datasets);
      });
    }});
  };

  const getKioskIdsAndCaps = async (): Promise<{ kioskIds: string[], kioskOwnerCaps: KioskOwnerCap[] }> => {
    if (!currentAccount) return { kioskIds: [], kioskOwnerCaps: [] };
    return await kioskClient.getOwnedKiosks({ address: currentAccount.address! });
  }

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

  const getListedDatasets = async (): Promise<DatasetObject[]> => {
    const { data } = await suiClient.queryEvents({
      query: {
        MoveEventType: `${TESTNET_PACKAGE_ID}::dataset::DatasetListedEvent`
      }
    });

    const objects = await suiClient.multiGetObjects({
      ids: data.map((event) => (event.parsedJson as any).dataset),
      options: {
        showContent: true,
      }
    });

    return objects.map((obj) => {
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
    getListedDatasets().then(datasets => {
      setListedDatasets(datasets);
    });
  }, []);

  useEffect(() => {
    getPersonalDatasets().then(datasets => {
      setPersonalDatasets(datasets);
    });
  }, [currentAccount]);

  useEffect(() => {
    getKioskIdsAndCaps().then(({ kioskIds, kioskOwnerCaps }) => {
      setKioskIds(kioskIds);
      setKioskOwnerCaps(kioskOwnerCaps);
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
            <DatasetCard 
              key={dataset.id} 
              dataset={dataset} 
              currentAddress={currentAccount?.address!}
              isListed={false}
              onListDataset={handlePlaceAndListDatasetAttempt}
            />
          ))}
        </div>
      )}
      {listedDatasets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Listed Datasets</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listedDatasets.map((dataset) => (
              <DatasetCard 
                key={dataset.id} 
                dataset={dataset} 
                currentAddress={currentAccount?.address!}
                isListed={true}
                onListDataset={handlePlaceAndListDatasetAttempt}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
