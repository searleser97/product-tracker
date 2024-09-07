import { BrowserContext, Page } from "playwright";
import { Telegraf } from "telegraf";
import { sleep } from "./utils.js";

export async function canong7xiiiHandler(
  browserContext: BrowserContext,
  cachedPage: Page | null,
  bot: Telegraf
) {
  console.log("checking Canon G7X Mark III page...");
  const page = await (async () => {
    if (cachedPage) {
      return cachedPage;
    } else {
      return await browserContext.newPage();
    }
  })();
  const url =
    "https://www.usa.canon.com/shop/p/powershot-g7-x-mark-iii?color=Black&type=New";
  const productName = "Canon G7X Mark III";
  await page.goto(url);
  await page.route("**/*", (route, request) => {
    if (request.resourceType() === "image" || request.resourceType() === "media") {
        route.abort();
    } else {
        route.continue();
    }
});
  await page.waitForLoadState("domcontentloaded");
  await page
    .getByText(/^3637c001$/gi)
    .waitFor({ state: "attached", timeout: 10000 });
  const addToCartLocator = page.getByText(/add to cart/gi);
  let intervalBetweenNotAvailableMessages = 20 * 60 * 1000;
  const lastMessageSentTime = Date.now() - (intervalBetweenNotAvailableMessages);

  try {
    await addToCartLocator.waitFor({ state: "attached", timeout: 10000 });
    console.log(Date.now(), productName, "is available!");
    if (process.env.TELEGRAM_CHAT_ID) {
      const screenshotPath = "canong7xiii.png";
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await bot.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: screenshotPath });
      for (let i = 0; i < 5; i++) {
        await bot.telegram.sendMessage(
          process.env.TELEGRAM_CHAT_ID,
          `${productName} is available!`
        );
        intervalBetweenNotAvailableMessages = Date.now();
        await sleep(5000);
      }
    }
  } catch (e) {
    if (process.env.TELEGRAM_CHAT_ID) {
      // send a message only if it's been more than 20 minutes since the last message
      if (Date.now() - lastMessageSentTime >= intervalBetweenNotAvailableMessages) {
        await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, `${productName} is NOT available yet.`);
        intervalBetweenNotAvailableMessages = Date.now();
      }
    }
  }
  return { page };
}
