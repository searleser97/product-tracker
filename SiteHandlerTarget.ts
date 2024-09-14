import { Page, Response } from "playwright";
import { SiteHandler } from "./types.js";


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
): Promise<SiteHandler> {
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
        return { isAvailable: true };
    }
  }
  return { isAvailable: false };
}
