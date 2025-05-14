"use client";

import Link from "next/link";
import Avatar from "@/components/avatar";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ConnectModal, useCurrentAccount, useDisconnectWallet } from "@mysten/dapp-kit";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const currentAccount = useCurrentAccount();
  const [isCreating, setIsCreating] = useState(false);
  const { mutate: disconnect } = useDisconnectWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const shortAddress = (address: string) =>
    address.slice(0, 6) + "..." + address.slice(-4);

  useEffect(() => {
    setIsCreating(pathname.includes("create"));
  }, [pathname]);

  useEffect(() => {
    if (currentAccount) {
      setIsModalOpen(false);
      setIsPopoverOpen(false);
    }

  }, [currentAccount]);

  const handleDisconnect = () => {
    disconnect();
    setIsPopoverOpen(false);
  };

  const handleGoToMyPage = () => {
    setIsPopoverOpen(false);
    if (currentAccount) {
      router.push(`/user/${currentAccount.address}`);
      setIsPopoverOpen(false);
    }
  };

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
        {currentAccount ? (
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild onClick={() => setIsPopoverOpen(!isPopoverOpen)}>
              <Button variant="outline">
                <div className="flex items-center space-x-2">
                  <Avatar address={currentAccount.address} />
                  {shortAddress(currentAccount.address)}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-2">
              <div className="grid gap-1">
                <Button variant="ghost" onClick={handleGoToMyPage} className="justify-start px-3 py-1.5">
                  My Page
                </Button>
                <Button variant="ghost" onClick={handleDisconnect} className="justify-start px-3 py-1.5">
                  Disconnect
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        ) : (
          <ConnectModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            trigger={<Button variant="outline">Connect Wallet</Button>}
          />
        )}
      </div>
    </div>
  );
}
