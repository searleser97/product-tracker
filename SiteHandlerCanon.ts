import { Page } from "playwright";
import { SiteHandlerResult } from "./types.js";

export async function siteHandlerCanon(
  page: Page,
  productURL: string,
): Promise<SiteHandlerResult> {
  try {
    await page.goto(productURL, { waitUntil: "domcontentloaded" });
    await page.locator('#product_addtocart_form').getByRole('button', { name: 'Notify me when available' }).waitFor({ state: "attached", timeout: 10000 });
    return { isAvailable: false };
  } catch (e) {
    return { isAvailable: true };
  }
}
