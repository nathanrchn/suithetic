"use client";

import { useEffect, useState } from "react";
import { DatasetObject } from "@/lib/types";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { getListedDatasets, getPersonalDatasets } from "@/lib/actions";
import { DatasetList } from "@/components/dataset-list";

export default function Home() {
  const [listedDatasets, setListedDatasets] = useState<DatasetObject[]>([]);
  const [personalDatasets, setPersonalDatasets] = useState<DatasetObject[]>([]);

  const currentAccount = useCurrentAccount();

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
        <DatasetList datasets={personalDatasets} />
      )}
      {listedDatasets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Listed Datasets</h2>
          <DatasetList datasets={listedDatasets} />
        </div>
      )}
    </div>
  );
}
