import { Page, Response } from "playwright";
import { SiteHandlerResult } from "./types.js";


export async function siteHandlerBestBuy(
  page: Page,
  productURL: string,
): Promise<SiteHandlerResult> {
  await page.goto(productURL);
  await page.waitForLoadState("domcontentloaded");
  console.log(`domcontentloaded at ${Date.now()}`);

  try {
    await page.getByRole("button", { name: "Sold Out" }).waitFor({ state: "attached", timeout: 3000 });
    return { isAvailable: false };
  } catch (e) {
    console.error(e);
    return { isAvailable: true };
  }
}
