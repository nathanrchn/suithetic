"use client";

import Link from "next/link";
import Avatar from "@/components/avatar";
import { notFound } from "next/navigation";
import { DatasetObject } from "@/lib/types";
import { use, useEffect, useState } from "react";
import { getPersonalDatasets } from "@/lib/actions";
import { DatasetList } from "@/components/dataset-list";

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [personalDatasets, setPersonalDatasets] = useState<DatasetObject[]>([]);

  const isSuiAddress = (address: string) => {
    return address.startsWith("0x") && address.length === 66
  }

  const shortAddress = (address: string) => address.slice(0, 6) + "..." + address.slice(-4);

  const getExplorerUrl = (address: string) => {
    return `https://testnet.suivision.xyz/address/${address}`;
  }

  if (!isSuiAddress(id)) {
    notFound();
  }

  useEffect(() => {
    getPersonalDatasets(id).then(datasets => {
      setPersonalDatasets(datasets);
    });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-4 p-4 border-b border-gray-200">
      <Avatar address={id} />
      <div>
        <Link href={getExplorerUrl(id)} target="_blank" rel="noopener noreferrer" className="text-xl font-semibold hover:underline">
          {shortAddress(id)}
        </Link>
        <p className="text-sm text-gray-600">{personalDatasets.length} Datasets</p>
      </div>
    </div>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Personal Datasets</h2>
        {personalDatasets.length > 0 ? (
          <DatasetList datasets={personalDatasets} />
        ) : (
          <p>No datasets found for this user.</p>
        )}
      </div>
    </div>
  );
}
