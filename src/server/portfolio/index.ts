import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { Portfolio } from "@/domain/schema";
import { loadPortfolio } from "./repository";

/** The published portfolio, cached for a few minutes so published changes appear without a deploy. */
export async function getPortfolio(): Promise<Portfolio> {
  "use cache";
  cacheLife("minutes");
  cacheTag("portfolio");
  return loadPortfolio();
}
