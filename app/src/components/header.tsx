"use client";

import Link from "next/link";
import Avatar from "@/components/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { ConnectModal, useCurrentAccount } from "@mysten/dapp-kit";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const currentAccount = useCurrentAccount();
  const [isCreating, setIsCreating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const shortAddress = (address: string) => address.slice(0, 6) + "..." + address.slice(-4);

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
        <ConnectModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          trigger={
            <Button variant="outline">
              {currentAccount ? (
                <div className="flex items-center space-x-2">
                  <Avatar address={currentAccount.address} />
                  {shortAddress(currentAccount.address)}
                </div>
              ) : (
                "Connect Wallet"
              )}
            </Button>
          }
        />
      </div>
    </div>
  );
}
