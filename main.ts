import { chromium } from "playwright";
import { canong7xiiiHandler } from "./canong7xiiiHandler.js";
import { Telegraf } from "telegraf";
import { exit } from "process";
import { sleep } from "./utils.js";


export const productPageHandlers = [canong7xiiiHandler];

(async () => {
  if (!process.env.BOT_TOKEN) {
    console.log("Please set the BOT_TOKEN environment variable.");
    exit(-1);
  }
  if (!process.env.TELEGRAM_CHAT_ID) {
    console.log("Please set the TELEGRAM_CHAT_ID environment variable.");
    exit(-1);
  }
  const bot = new Telegraf(process.env.BOT_TOKEN);
  bot.start((ctx) => ctx.reply("Welcome!"));
  bot.launch();

  // const browser = await chromium.launch({ headless: false });
  const browser = await chromium.connectOverCDP("http://localhost:9222");

  process.on("SIGINT", async () => {
    console.log("Received SIGINT. Exiting gracefully...");
    await browser.close();
    bot.stop();
    process.exit();
  });
  const context = await browser.newContext();
  const pages = [];
  console.log("Running product page handlers...");
  while (true) {
    for (let i = 0; i < productPageHandlers.length; i++) {
      const handler = productPageHandlers[i];
      const page = pages.length <= i ? null : pages[i];
      const productInfo = await handler(context, page, bot);
      if (!page) {
        pages.push(productInfo.page);
      }
    }
    await sleep(3000);
  }
})();
