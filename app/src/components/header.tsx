"use client";

import { ConnectButton } from "@mysten/dapp-kit";

export default function Header() {
  return (
    <div className="flex justify-between items-center p-4 w-full">
      <h1 className="text-2xl font-bold">Suithetic</h1>
      <ConnectButton />
    </div>
  );
}