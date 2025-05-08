import Link from "next/link";
import { DatasetObject } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DatasetCard({ dataset }: { dataset: DatasetObject }) {
  return (
    <Link href={`/dataset/${dataset.id}`} className="block hover:shadow-lg transition-shadow duration-200">
      <Card>
        <CardHeader>
          <CardTitle>{dataset.metadata.name}</CardTitle>
          <CardDescription>ID: {dataset.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <p><strong>Owner:</strong> {dataset.owner}</p>
          <p><strong>Creator:</strong> {dataset.creator}</p>
          <p><strong>Version:</strong> {dataset.version}</p>
          <p><strong>Blob ID:</strong> {dataset.blobId}</p>
          <p><strong>Number of Rows:</strong> {dataset.metadata.numRows}</p>
          <p><strong>Number of Tokens:</strong> {dataset.metadata.numTokens}</p>
        </CardContent>
      </Card>
    </Link>
  );
}
