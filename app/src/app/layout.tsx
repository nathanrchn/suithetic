import type { Metadata } from "next";
import "@mysten/dapp-kit/dist/index.css";

import "./globals.css";
import Context from "./context";

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
          {children}
        </Context>
      </body>
    </html>
  );
}
