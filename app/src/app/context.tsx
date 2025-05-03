"use client";

import { getFullnodeUrl } from "@mysten/sui/client";
import { ThemeProvider } from "@/components/theme-provider"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createNetworkConfig, SuiClientProvider, WalletProvider } from "@mysten/dapp-kit";

const { networkConfig } = createNetworkConfig({
	testnet: { url: getFullnodeUrl("testnet") },
  mainnet: { url: getFullnodeUrl("mainnet") },
});

const queryClient = new QueryClient();

export default function Context({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <SuiClientProvider networks={networkConfig} defaultNetwork={"testnet"}>
          <WalletProvider autoConnect>
            {children}
          </WalletProvider>
        </SuiClientProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
