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
    const addToCartLocator = page.locator("button[type='button'][data-button-state='ADD_TO_CART']").first();
    await addToCartLocator.waitFor({ state: "attached", timeout: 10000 });
    return { isAvailable: true };
  } catch (e) {
    console.error(e);
    return { isAvailable: false };
  }
}
