import { Page } from "playwright";
import { SiteHandlerResult } from "./types.js";


export async function siteHandlerApple(
  page: Page,
  productURL: string,
): Promise<SiteHandlerResult> {
  try {
    await page.goto(productURL, { waitUntil: "domcontentloaded" });
    await page.getByText('Check back later for').nth(1).waitFor({ state: "attached", timeout: 5000 });
    return { isAvailable: false };
  } catch (_e) {
    return { isAvailable: true };
  }
}
