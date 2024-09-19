import { Page, Response } from "playwright";
import { AutoBuyResult, SiteHandlerResult } from "./types.js";


function isSomeStoreOptionAvailable(productFulfillment: any) {
  const store_options: any[] = productFulfillment.store_options;
  if (store_options == null) {
    return false;
  }
  for (const store_option of store_options) {
    if (store_option.location_available_to_promise_quantity > 0
      || store_option.order_pickup.availability_status !== "UNAVAILABLE"
      || store_option.in_store_only.availability_status !== "NOT_SOLD_IN_STORE"
      || store_option.ship_to_store.availability_status !== "UNAVAILABLE") {
      return true;
    }
  }
  return false;
}

export async function siteHandlerTarget(
  page: Page,
  productURL: string,
): Promise<SiteHandlerResult> {
  const availabilityRequestPromise: Promise<Response> = page.waitForResponse(/.*product_fulfillment_v1.*/);
  await page.goto(productURL);
  const availabilityResponse: any = await (await availabilityRequestPromise).json();
  let isCorrectResponse = false;
  for (let i = 0; !isCorrectResponse && i < 3; i++) {
    const productFulfillment = availabilityResponse?.data?.product?.fulfillment;
    if (productFulfillment !== null) {
      isCorrectResponse = true;
    }
    const shipping_options = productFulfillment.shipping_options;
    const scheduled_delivery = productFulfillment.scheduled_delivery;
    if (shipping_options.availability_status !== "OUT_OF_STOCK"
      || shipping_options.loyalty_availability_status !== "OUT_OF_STOCK"
      || shipping_options.available_to_promise_quantity > 0
      || scheduled_delivery.location_available_to_promise_quantity > 0
      || scheduled_delivery.availability_status !== "UNAVAILABLE"
      || isSomeStoreOptionAvailable(productFulfillment)) {
        const autoBuyPromise = autoBuyTarget(page);
        return { isAvailable: true, data: productFulfillment, autoBuyPromise };
    }
  }
  return { isAvailable: false };
}

export async function autoBuyTarget(page: Page): Promise<AutoBuyResult> {
  try {
    const addToCartButtonLocator = page.getByLabel("Add to cart");
    await addToCartButtonLocator.click();
    console.log("clicked Add to cart");
    const protectYourPurchaseButtonLocator = page.locator("button[data-test='espDrawerContent-protectYourPurchasesButton']");
    await protectYourPurchaseButtonLocator.waitFor({ state: "visible", timeout: 10000 });
    await protectYourPurchaseButtonLocator.click();
    const checkoutButtonLocator = page.locator("a[data-test='esp-success-modal-viewCartButton']");
    await checkoutButtonLocator.waitFor({ state: "visible", timeout: 10000 });
    await checkoutButtonLocator.click();
    const checkoutFinalButtonLocator = page.locator("button[data-test='checkout-button']");
    await checkoutFinalButtonLocator.waitFor({ state: "visible", timeout: 10000 });
    await checkoutFinalButtonLocator.click();
    const placeOrderButtonLocator = page.locator("button[data-test='placeOrderButton']");
    await placeOrderButtonLocator.waitFor({ state: "visible", timeout: 10000 });
    await placeOrderButtonLocator.click();
    if (process.env.cvv && process.env.cardNumber) {
      const cvvlocator = page.getByLabel("Enter CVV");
      await cvvlocator.waitFor({ state: "visible", timeout: 10000 });
      await cvvlocator.click();
      await cvvlocator.pressSequentially(process.env.cvv);
      const confirmButtonLocator = page.locator("button[data-test='confirm-button']");
      await confirmButtonLocator.waitFor({ state: "visible", timeout: 10000 });
      await confirmButtonLocator.click();
      const cardNumberLocator = page.getByLabel("Confirm card number");
      await cardNumberLocator.waitFor({ state: "visible", timeout: 10000 });
      await cardNumberLocator.click();
      await cardNumberLocator.pressSequentially(process.env.cardNumber);
      const confirmCardButtonLocator = page.locator("button[data-test='verify-card-button']");
      await confirmCardButtonLocator.waitFor({ state: "visible", timeout: 10000 });
      await confirmCardButtonLocator.click();
      return { result: "succeeded" };
    }
    return { result: "failed" };
  } catch (e) {
    return { result: "failed" };
  }
}