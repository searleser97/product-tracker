import { Page, Response } from "playwright";
import { SiteHandler } from "./types.js";


export async function siteHandlerBestBuy(
  page: Page,
  productURL: string,
): Promise<SiteHandler> {
  await page.goto(productURL);
  await page.waitForLoadState("domcontentloaded");
  console.log(`domcontentloaded at ${Date.now()}`);

  try {
    const addToCartLocator = page.getByLabel("Notify Me");
    await addToCartLocator.waitFor({ state: "visible", timeout: 10000 });
    return { isAvailable: false };
  } catch (e) {
    console.error(e);
    return { isAvailable: true };
  }
}
