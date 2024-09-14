import { Page, Response } from "playwright";
import { SiteHandler } from "./types.js";


export async function siteHandlerBestBuy(
  page: Page,
  productURL: string,
): Promise<SiteHandler> {
  let resolveRequest = (_: Response) => {};
  const availabilityRequestPromise: Promise<Response> = new Promise((resolve, reject) => {
    resolveRequest = resolve;
  });
  await page.route(/.*graphql.*/, async (route, request) => {
    console.log(request.postDataJSON());
    if (request.postData()?.includes("query MyQuery")) {
      const response = await (await request.response())?.json();
      console.log(JSON.stringify(response, null, 2));
      if (response?.data?.productBySkuId?.buyingOptions) {
        resolveRequest(response);
      }
    }
  });
  // await page.waitForTimeout(1000);
  // await page.goto(productURL);
  // const response = await availabilityRequestPromise;
  // console.log(JSON.stringify(response, null, 2));
  return { isAvailable: false };
}
