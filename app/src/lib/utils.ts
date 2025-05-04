import { customAlphabet } from "nanoid";
import { twMerge } from "tailwind-merge";
import { clsx, type ClassValue } from "clsx";
import { WALRUS_SERVICES } from "./constants";

export const nanoid = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ", 5);

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getWalrusAggregatorUrl(path: string, id: string): string {
  const service = WALRUS_SERVICES.find((s) => s.id === id);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.aggregatorUrl}/v1/${cleanPath}`;
}

export function getWalrusPublisherUrl(path: string, id: string): string {
  const service = WALRUS_SERVICES.find((s) => s.id === id);
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service?.publisherUrl}/v1/${cleanPath}`;
}
