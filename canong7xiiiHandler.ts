import { BrowserContext, Page } from "playwright";
import { Telegraf } from "telegraf";
import { sleep } from "./utils.js";

export async function canong7xiiiHandler(
  browserContext: BrowserContext,
  cachedPage: Page | null,
  bot: Telegraf,
  lastMessageSentTime: { value: number }
) {
  console.log("checking Canon G7X Mark III page...");
  const page = await (async () => {
    if (cachedPage) {
      return cachedPage;
    } else {
      return await browserContext.newPage();
    }
  })();
  const url = "https://www.usa.canon.com/shop/pus/p/powershot-g7-x-mark-iii?color=Black&type=New";
  // const url = "https://www.usa.canon.com/shop/pus/p/powershot-golf-digital-laser-rangefinder";
  const productName = "Canon G7X Mark III";
  await page.goto(url);
  console.log("waiting for domcontentloaded");
  await page.waitForLoadState("domcontentloaded");
  const intervalBetweenNotAvailableMessages = 20 * 60 * 1000;
  console.log("domcontentloaded");

  try {
    const addToCartLocator = page.locator("button[type='submit'][title='Add to Cart']").first();
    await addToCartLocator.waitFor({ state: "attached", timeout: 15000 });
    console.log(Date.now(), productName, "is available!");
    if (process.env.TELEGRAM_CHAT_ID) {
      await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, `${productName} is available!`);
      const screenshotPath = "canong7xiii.png";
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await bot.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: screenshotPath });
    }
    lastMessageSentTime.value = Date.now();
    await addToCartLocator.click();
    await page.waitForTimeout(5000);
    await page.goto("https://www.usa.canon.com/shop/checkout/#shipping");
    await page.waitForLoadState("domcontentloaded");
    try {
      const editAddressButtonLocator = page.locator("span:has-text('Edit Address')").first();
      await editAddressButtonLocator.waitFor({ state: "attached", timeout: 15000 });
    } catch (e) {
      console.error("No edit address button found. Continuing...");
      const firstnameLocator = page.locator("input[name='firstname']").first();
      const lastnameLocator = page.locator("input[name='lastname']").first();
      const streetAddresssLocator = page.locator("input[name='street[0]']").first();
      const cityLocator = page.locator("input[name='city']").first();
      const stateLocator = page.locator("select[name='region_id']").first();
      const zipLocator = page.locator("input[name='postcode']").first();
      const phoneLocator = page.locator("input[name='telephone']").first();
      await firstnameLocator.waitFor({ state: "attached", timeout: 15000 });
      if (process.env.firstname && process.env.lastname && process.env.streetAddress && process.env.city && process.env.state && process.env.zip && process.env.phone) {
        console.log("filling out shipping info...");
        await firstnameLocator.fill(process.env.firstname);
        await lastnameLocator.fill(process.env.lastname);
        await streetAddresssLocator.fill(process.env.streetAddress);
        await cityLocator.fill(process.env.city);
        await stateLocator.selectOption({ label: process.env.state });
        await zipLocator.fill(process.env.zip);
        await phoneLocator.fill(process.env.phone);
      } else {
        console.error("Please set the following environment variables: firstname, lastname, streetAddress, city, state, zip, phone");
      }
    }

    const continueToPayment = page.locator("button:has-text('continue to payment')").first();
    await continueToPayment.waitFor({ state: "attached", timeout: 15000 });
    await continueToPayment.click();
    if (process.env.cardname && process.env.cardnumber && process.env.securitycode && process.env.expirationmonth && process.env.expirationyear) {
      const nameOnCardLocator = page.locator("input[name='payment[name_on_card]']").first();
      // const iframeForCardNumber = page.locator("iframe[title='secure payment field']").first();
      // iframeForCardNumber.waitFor({ state: "visible", timeout: 15000 });
      // const cardNumberLocator = iframeForCardNumber.locator("#number").first();
      // const securityCodeLocator = page.locator("securityCode").first();
      // const expirationMonthLocator = page.locator("select[name='payment[cc_exp_month]']").first();
      // const expirationYearLocator = page.locator("select[name='payment[cc_exp_year]']").first();
      // await cardNumberLocator.waitFor({ state: "visible", timeout: 15000 });
      // await cardNumberLocator.pressSequentially(process.env.cardnumber);
      // await page.waitForTimeout(5000);
      // await cardNumberLocator.pressSequentially(process.env.cardnumber);
      await nameOnCardLocator.fill(process.env.cardname);
      // await securityCodeLocator.pressSequentially(process.env.securitycode);
      // await expirationMonthLocator.pressSequentially(process.env.expirationmonth);
      // await expirationYearLocator.pressSequentially(process.env.expirationyear)
    } else {
      console.error("Please set the following environment variables: cardname, cardnumber, securitycode, expirationmonth, expirationyear");
    }
    // const continueToReview = page.locator("button:has-text('continue to review')").first();
    // await continueToReview.waitFor({ state: "attached", timeout: 15000 });
    // await continueToReview.click();
    if (process.env.TELEGRAM_CHAT_ID) {
      const screenshotPath = "canong7xiii.png";
      await page.screenshot({ path: screenshotPath, fullPage: true });
      await bot.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: screenshotPath });
      for (let i = 0; i < 5; i++) {
        await bot.telegram.sendMessage(
          process.env.TELEGRAM_CHAT_ID,
          `${productName} is available!`
        );
        lastMessageSentTime.value = Date.now();
        await sleep(5000);
      }
    }
  } catch (e) {
    console.error(e);
    if (process.env.TELEGRAM_CHAT_ID) {
      // send a message only if it's been more than 20 minutes since the last message
      if (Date.now() - lastMessageSentTime.value >= intervalBetweenNotAvailableMessages) {
        // await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, `${productName} is NOT available yet.`);
        lastMessageSentTime.value = Date.now();
      }
    }
  }
  return { page };
}
