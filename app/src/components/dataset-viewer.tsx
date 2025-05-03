"use client";

import { useEffect, useState } from "react";
import { HFDataset } from "@/lib/types";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function DatasetViewer({
  dataset
}: {
  dataset: HFDataset | null;
}) {
  const [data, setData] = useState<any[] | null>(null);
  const [features, setFeatures] = useState<string[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!dataset) return;
      const response = await fetch(`https://datasets-server.huggingface.co/first-rows?dataset=${dataset.path}&config=${dataset.config}&split=${dataset.split}`);
      const data = await response.json();
      setData(data.rows.map((row: any) => row));
      setFeatures(data.features.map((feature: any) => feature.name));
    }
    fetchData();
  }, [dataset]);

  return data && features && (
    <div className="space-y-4">
      <Table>
        <TableHeader>
              <TableRow>
              {features.map((feature) => (
                <TableHead key={feature}>{feature}</TableHead>
              ))}
            </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => (
            <TableRow key={row.row_idx}>
              {features.map((feature) => (
                <TableCell 
                key={feature} 
                className="text-xs max-w-[250px] whitespace-pre-wrap break-words overflow-hidden"
              >
                {row.row[feature].length > 100 ? `${row.row[feature].slice(0, 100)}...` : row.row[feature]}
              </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
