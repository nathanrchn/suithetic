"use client";

import { useEffect, useState } from "react";
import { DatasetObject } from "@/lib/types";
import { MIST_PER_SUI } from "@mysten/sui/utils";
import DatasetCard from "@/components/dataset-card";
import { TESTNET_PACKAGE_ID } from "@/lib/constants";
import { Transaction } from "@mysten/sui/transactions";
import { KioskClient, KioskOwnerCap, Network } from "@mysten/kiosk";
import { getListedDatasets, getPersonalDatasets } from "@/lib/actions";
import { useSuiClient, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";

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
      if (currentAccount) {
        getPersonalDatasets(currentAccount.address).then(datasets => {
          setPersonalDatasets(datasets);
        });
      }
  
      getListedDatasets().then(datasets => {
        setListedDatasets(datasets);
      });
    }});
  };

  const getKioskIdsAndCaps = async (): Promise<{ kioskIds: string[], kioskOwnerCaps: KioskOwnerCap[] }> => {
    if (!currentAccount) return { kioskIds: [], kioskOwnerCaps: [] };
    return await kioskClient.getOwnedKiosks({ address: currentAccount.address! });
  }

  useEffect(() => {
    getListedDatasets().then(datasets => {
      setListedDatasets(datasets);
    });
  }, []);

  useEffect(() => {
    if (currentAccount) {
      getPersonalDatasets(currentAccount.address).then(datasets => {
        setPersonalDatasets(datasets);
      });
    }
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
