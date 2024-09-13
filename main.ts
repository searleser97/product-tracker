import { chromium } from "playwright";
import { Telegraf } from "telegraf";
import { exit } from "process";
import { sleep } from "./utils.js";
import { siteHandlerCanon } from "./SiteHandlerCanon.js";
import * as fs from "fs";


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
  bot.stop();
  process.exit();
});
bot.start((ctx) => ctx.reply("Welcome!"));
bot.launch();
bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, "product tracker started");

const main = (async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const intervalBetweenNotAvailableMessages = 40 * 60 * 1000;
  let lastMessageSentTime = { value: Date.now() - (intervalBetweenNotAvailableMessages) };
  const context = browser.contexts()[0];
  const page = await context.newPage();
  console.log("Running product page handlers...");
  const SiteEnum = {
    Canon: 1,
    BestBuy: 2,
    Target: 3,
  };
  const SiteEnumReverse = {
    [SiteEnum.Canon]: "Canon",
    [SiteEnum.BestBuy]: "BestBuy",
    [SiteEnum.Target]: "Target",
  };
  const lastVisitedTimePerSite = {
    [SiteEnum.Canon]: 0,
    [SiteEnum.BestBuy]: 0,
    [SiteEnum.Target]: 0,
  };

  const products = [
    { 
      name: "Canon G7X Mark III",
      locations: [ 
        { url: "https://www.usa.canon.com/shop/p/powershot-g7-x-mark-iii?color=Black&type=New", siteName: SiteEnum.Canon }
       ]
    }
  ];
  const intervalBetweenSameSiteVisit =  45000;
  while (true) {
    for (const product of products) {
      const locations = product.locations;
      for (const location of locations) {
        console.log(`Checking ${product.name} at ${SiteEnumReverse[location.siteName]}`);
        const timeLeftBeforeNextVisit = Math.max(0, intervalBetweenSameSiteVisit - (Date.now() - lastVisitedTimePerSite[location.siteName]));
        if (timeLeftBeforeNextVisit > 0) {
          await sleep(timeLeftBeforeNextVisit);
        }
        const collectedData = await (async () => {
          switch (location.siteName) {
            case SiteEnum.Canon:
              return siteHandlerCanon(page, location.url);
            default:
              return { isAvailable: false };
          }
        })();
        lastVisitedTimePerSite[location.siteName] = Date.now();
        if (collectedData.isAvailable) {
          console.log(Date.now(), product.name, `is available at ${SiteEnumReverse[location.siteName]}!`);
          if (process.env.TELEGRAM_CHAT_ID) {
            if (!fs.existsSync("./screenshots")) {
              fs.mkdirSync("./screenshots");
            }
            const screenshotPath = `./screenshots/${product.name.replace(/ */g, "")}-${SiteEnumReverse[location.siteName]}.png`;
            await page.screenshot({ path: screenshotPath, fullPage: true });
            await bot.telegram.sendPhoto(process.env.TELEGRAM_CHAT_ID, { source: screenshotPath });
            for (let i = 0; i < 5; i++) {
              await bot.telegram.sendMessage(
                process.env.TELEGRAM_CHAT_ID,
                `${product.name} is available at ${location.url}!`
              );
              lastMessageSentTime.value = Date.now();
              await sleep(3000);
            }
          }
        } else {
          console.log(Date.now(), product.name, `is NOT yet available at ${SiteEnumReverse[location.siteName]}!`);
          if (process.env.TELEGRAM_CHAT_ID) {
            if (Date.now() - lastMessageSentTime.value >= intervalBetweenNotAvailableMessages) {
              await bot.telegram.sendMessage(process.env.TELEGRAM_CHAT_ID, `${product.name} is NOT available yet.`);
              lastMessageSentTime.value = Date.now();
            }
          }
        }
      }
      await sleep(45000);
    }
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

