import { chromium } from "playwright";
import { canong7xiiiHandler } from "./canong7xiiiHandler.js";
import { Telegraf } from "telegraf";
import { exit } from "process";
import { sleep } from "./utils.js";


export const productPageHandlers = [canong7xiiiHandler];

if (!process.env.BOT_TOKEN) {
  console.log("Please set the BOT_TOKEN environment variable.");
  exit(-1);
}
if (!process.env.TELEGRAM_CHAT_ID) {
  console.log("Please set the TELEGRAM_CHAT_ID environment variable.");
  exit(-1);
}
const bot = new Telegraf(process.env.BOT_TOKEN);
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Exiting gracefully...");
  // await browser.close();
  bot.stop();
  process.exit();
});
bot.start((ctx) => ctx.reply("Welcome!"));
bot.launch();
bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, "product tracker started, ensure you are signed in to the sites you are tracking");
const main = (async () => {

  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const intervalBetweenNotAvailableMessages = 20 * 60 * 1000;
  let lastMessageSentTime = { value: Date.now() - (intervalBetweenNotAvailableMessages) };
  const context = await browser.contexts()[0];
  const pages = [];
  console.log("Running product page handlers...");
  while (true) {
    for (let i = 0; i < productPageHandlers.length; i++) {
      const handler = productPageHandlers[i];
      const page = pages.length <= i ? null : pages[i];
      const productInfo = await handler(context, page, bot, lastMessageSentTime);
      if (!page) {
        pages.push(productInfo.page);
      }
    }
    await sleep(45000);
  }
});

(async () => {
  while (true) {
    try {
      console.log("starting main");
      await main();
    } catch (e) {
      console.log("global error");
      console.error(e);
      bot.stop();
      process.exit();
    }
  }
})();

