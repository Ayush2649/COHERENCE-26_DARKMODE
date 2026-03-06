/**
 * ShadCN-style class name merger utility
 * Combines clsx + tailwind-merge for conditional Tailwind classes
 */
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
