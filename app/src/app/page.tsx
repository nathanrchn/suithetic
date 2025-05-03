"use client";

import { useState } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import DatasetInput, { HFDataset } from "@/components/dataset-input";

export default function Home() {
  const [dataset, setDataset] = useState<HFDataset>({
    path: "",
    split: "train"
  });

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <DatasetInput setDataset={setDataset} />
    </div>
  );
}
