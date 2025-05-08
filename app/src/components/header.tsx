"use client";

import Link from "next/link";
import { Button } from "./ui/button";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useState, useEffect } from "react";
import { ConnectButton } from "@mysten/dapp-kit";
import { usePathname, useRouter } from "next/navigation";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const {theme, setTheme} = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setIsCreating(pathname.includes("create"));
  }, [pathname]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
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
        <ConnectButton />
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleTheme}
            className="ml-2"
            aria-label="Toggle theme"
          >
            {theme === "light" ? (
              <Moon className="h-[1.2rem] w-[1.2rem]" />
            ) : (
              <Sun className="h-[1.2rem] w-[1.2rem]" />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
