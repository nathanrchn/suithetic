import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Suithetic - Synthetic Data Generation on SUI Blockchain",
  description: "Generate secure, private, and efficient synthetic data with Suithetic - powered by SUI blockchain, Atoma Network, Walrus storage, and Seal encryption.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
