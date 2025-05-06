
import { use } from "react";

export default function DatasetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  return (
    <div>
      <h1>Dataset</h1>
    </div>
  );
}
