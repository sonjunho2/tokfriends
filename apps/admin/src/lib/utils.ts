// admin-web/src/lib/utils.ts
import { type ClassValue } from "clsx";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind 클래스 병합 유틸
 * 사용: className={cn("p-2", cond && "opacity-50")}
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
