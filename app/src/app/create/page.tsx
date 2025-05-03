"use client";

import { useState } from "react";
import { HFDataset } from "@/lib/types";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";

export default function CreatePage() {
  const [dataset, setDataset] = useState<HFDataset | null>(null);

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6 h-screen">
      <DatasetInput dataset={dataset} setDataset={setDataset} />
      {dataset && (
        <div className="h-1/2 w-11/12 flex flex-col space-y-8 p-8 overflow-y-auto rounded-md border">
          <DatasetViewer dataset={dataset} />
        </div>
      )}
    </div>
  );
}
