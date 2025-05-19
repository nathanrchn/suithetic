"use client";

import Link from "next/link";
import Image from "next/image";
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
    }
  };

  return (
    <header className="top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="Suithetic Logo"
              width={32}
              height={32}
              className="rounded-md"
            />
            <h1 className="text-xl font-bold">Suithetic</h1>
          </Link>
        </div>

        <div className="flex items-center justify-end gap-4">
          {!isCreating && (
            <Button variant="outline" onClick={() => router.push("/create")} className="hover:bg-[#6750A4] hover:text-white">
              Create
            </Button>
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
              <PopoverContent className="w-auto p-2 mt-1">
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
              trigger={
                <Button variant="outline">
                  Connect Wallet
                </Button>
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
