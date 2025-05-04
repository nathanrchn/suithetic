"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";

export default function DatasetViewer({
  features,
  data,
  maxLength = 100,
}: {
  features: string[];
  data: any[];
  maxLength?: number;
}) {
  return data.length > 0 && features.length > 0 && (
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
                {row.row[feature].length > maxLength ? `${row.row[feature].slice(0, maxLength)}...` : row.row[feature]}
              </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
