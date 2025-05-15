"use client";

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
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Personal Datasets</h2>
        {personalDatasets.length > 0 && (
          <DatasetList datasets={personalDatasets} />
        )}
      </div>
    </div>
  );
}
