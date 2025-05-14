import { use } from "react";

export default function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return <div>
    <h1>User {id}</h1>
  </div>;
}
