import { Page } from "playwright";

export async function siteHandlerCanon(
  page: Page,
  productURL: string,
) {
  await page.goto(productURL);
  await page.waitForLoadState("domcontentloaded");
  console.log(`domcontentloaded at ${Date.now()}`);

  try {
    const addToCartLocator = page.locator("button[type='submit'][title='Add to Cart']").first();
    await addToCartLocator.waitFor({ state: "attached", timeout: 15000 });
    return { isAvailable: true };
  } catch (e) {
    console.error(e);
    return { isAvailable: false };
  }
}
