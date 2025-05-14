"use client";

import { useEffect, useState } from "react";
import { DatasetObject } from "@/lib/types";
import { getLockedDatasets } from "@/lib/actions";
import { DatasetList } from "@/components/dataset-list";

export default function Home() {
  const [lockedDatasets, setLockedDatasets] = useState<DatasetObject[]>([]);

  useEffect(() => {
    getLockedDatasets().then(datasets => {
      setLockedDatasets(datasets);
    });
  }, []);

  return (
    <div className="container mx-auto p-4">
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Trending Datasets</h2>
        {lockedDatasets.length > 0 && (
          <DatasetList datasets={lockedDatasets} />
        )}
      </div>
    </div>
  );
}
