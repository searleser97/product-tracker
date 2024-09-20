import { Page, Response } from "playwright";
import { SiteHandlerResult } from "./types.js";


export async function siteHandlerBestBuy(
  page: Page,
  productURL: string,
): Promise<SiteHandlerResult> {
  try {
    await page.goto(productURL, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "Sold Out" }).waitFor({ state: "attached", timeout: 5000 });
    return { isAvailable: false };
  } catch (e) {
    console.error(e);
    return { isAvailable: true };
  }
}
