import type { Metadata } from "next";
import "@mysten/dapp-kit/dist/index.css";

import "./globals.css";
import Context from "./context";
import Header from "@/components/header";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Suithetic",
  description: "Generated synthetic data on the SUI blockchain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Context>
          <div className="min-h-[8vh] flex flex-col justify-center items-center">
            <Header />
          </div>
          <Separator />
          <main className="min-h-[92vh]">
            {children}
          </main>
          <Toaster />
        </Context>
      </body>
    </html>
  );
}
