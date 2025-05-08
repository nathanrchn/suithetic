import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";

export const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getExplorerUrl = (objectId: string, type: "object" | "address" = "object") => {
  return `https://testnet.suivision.xyz/${type}/${objectId}`;
}
