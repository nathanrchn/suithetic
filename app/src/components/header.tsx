"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setIsCreating(pathname.includes("create"));
  }, [pathname]);

  return (
    <div className="flex items-center justify-between w-full p-4">
      <div className="flex items-center w-1/2 ml-4">
        <Link href="/">
          <h1 className="text-2xl font-bold">Suithetic</h1>
        </Link>
      </div>
      <div className="flex items-center justify-end w-1/2 mr-4">
        {!isCreating && (
          <div className="flex justify-between pr-4">
            <Button variant="outline" onClick={() => router.push("/create")}>
              Create
            </Button>
          </div>
        )}
        <ConnectButton />
      </div>
    </div>
  );
}
