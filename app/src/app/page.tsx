"use client";

import { useState } from "react";
import { HFDataset } from "@/lib/types";
import DatasetInput from "@/components/dataset-input";
import DatasetViewer from "@/components/dataset-viewer";

export default function Home() {
  const [dataset, setDataset] = useState<HFDataset | null>(null);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <DatasetInput dataset={dataset} setDataset={setDataset} />
      <div className="h-1/2 w-11/12 flex flex-col space-y-8 p-8 overflow-y-auto rounded-md border">
        <DatasetViewer dataset={dataset} />
      </div>
    </div>
  );
}
