import { chromium } from "playwright";
import { Telegraf } from "telegraf";
import { exit } from "process";
import { sleep } from "./utils.js";
import { siteHandlerCanon } from "./SiteHandlerCanon.js";
import * as fs from "fs";
import { siteHandlerTarget } from "./SiteHandlerTarget.js";
import { siteHandlerBestBuy } from "./SiteHandlerBestBuy.js";
import { siteHandlerApple } from "./SiteHandlerApple.js";


if (!process.env.BOT_TOKEN) {
  console.log("Please set the BOT_TOKEN environment variable.");
  exit(-1);
}

const bot = new Telegraf(process.env.BOT_TOKEN);
process.on("SIGINT", async () => {
  console.log("Received SIGINT. Exiting gracefully...");
  bot.stop();
  process.exit();
});
process.once('SIGTERM', () => bot.stop('SIGTERM'));
let bot_chat_id = 0; 
bot.start((ctx) => {
  bot_chat_id = ctx.message.chat.id;
  ctx.reply("Welcome!")
  fs.writeFileSync("chat_id.txt", bot_chat_id.toString());
});

try {
  bot_chat_id = parseInt(fs.readFileSync("chat_id.txt").toString());
  console.log("saved bot chat id", bot_chat_id);
} catch (_e) {
  console.log("there is no saved bot chat id");
}

const main = (async () => {
  bot.launch().catch((e) => { console.log(e); exit(-1); });
  await sleep(1000);
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const intervalBetweenNotAvailableMessages = 8 * 60 * 60 * 1000;
  let lastMessageSentTime = { value: Date.now() - (intervalBetweenNotAvailableMessages) };
  const context = browser.contexts()[0];
  const page = await context.newPage();
  console.log("Running product page handlers...");
  const SiteEnum = {
    Canon: 1,
    BestBuy: 2,
    Target: 3,
    Apple: 4,
  };
  const SiteEnumReverse = {
    [SiteEnum.Canon]: "Canon",
    [SiteEnum.BestBuy]: "BestBuy",
    [SiteEnum.Target]: "Target",
    [SiteEnum.Apple]: "Apple",
  };
  const lastVisitedTimePerSite = {
    [SiteEnum.Canon]: 0,
    [SiteEnum.BestBuy]: 0,
    [SiteEnum.Target]: 0,
  };

  const products = [
    {
      name: "Iphone 16 Pro",
      locations: [
        { url: "https://www.apple.com/shop/buy-iphone/iphone-16-pro/6.3-inch-display-128gb-black-titanium-unlocked", siteName: SiteEnum.Apple },
      ]
    },
    { 
      name: "Canon G7X Mark III",
      locations: [ 
        { url: "https://www.bestbuy.com/site/canon-powershot-g7-x-mark-iii-20-1-megapixel-digital-camera-black/6359935.p?skuId=6359935", siteName: SiteEnum.BestBuy },
        { url: "https://www.target.com/p/canon-powershot-g7-x-mark-iii-20-1-megapixel-digital-camera-black/-/A-91467769", siteName: SiteEnum.Target },
        { url: "https://www.usa.canon.com/shop/p/powershot-g7-x-mark-iii?color=Black&type=New", siteName: SiteEnum.Canon }
       ]
    }
  ];
  const intervalBetweenSameSiteVisit =  20000;
  while (true) {
    for (const product of products) {
      const locations = product.locations;
      for (const location of locations) {
        const timeLeftBeforeNextVisit = Math.max(0, intervalBetweenSameSiteVisit - (Date.now() - lastVisitedTimePerSite[location.siteName]));
        const currentSiteName = SiteEnumReverse[location.siteName];
        if (timeLeftBeforeNextVisit > 0) {
          console.log(`waiting ${timeLeftBeforeNextVisit}ms before next visit to ${currentSiteName}`);
          await sleep(timeLeftBeforeNextVisit);
        }
        console.log(`Checking ${product.name} at ${SiteEnumReverse[location.siteName]}`);
        const siteHandlerResult = await (async () => {
          switch (location.siteName) {
            case SiteEnum.Canon:
              return siteHandlerCanon(page, location.url);
            case SiteEnum.Target:
              return siteHandlerTarget(page, location.url);
            case SiteEnum.BestBuy:
              return siteHandlerBestBuy(page, location.url);
            case SiteEnum.Apple:
              return siteHandlerApple(page, location.url);
            default:
              return { isAvailable: false };
          }
        })();
        lastVisitedTimePerSite[location.siteName] = Date.now();
        if (siteHandlerResult.isAvailable) {
          console.log(Date.now(), product.name, `is available at ${currentSiteName}!`);
          if (bot_chat_id !== 0) {
            await bot.telegram.sendMessage(
              bot_chat_id,
              `${product.name} is available at ${location.url}!`
            );
            lastMessageSentTime.value = Date.now();
          }
          if (siteHandlerResult.autoBuyPromise) {
            const autoBuyResult = await siteHandlerResult.autoBuyPromise;
            console.log("auto buy result:", autoBuyResult);
            if (bot_chat_id !== 0) {
              await bot.telegram.sendMessage(
                bot_chat_id,
                `Auto Buy at ${currentSiteName} ${autoBuyResult}`
              );
            }
          }
          if (bot_chat_id !== 0) {
            if (!fs.existsSync("./screenshots")) {
              fs.mkdirSync("./screenshots");
            }
            const screenshotPath = `./screenshots/${product.name.replace(/ */g, "")}-${currentSiteName}.png`;
            await page.screenshot({ path: screenshotPath });
            await bot.telegram.sendPhoto(bot_chat_id, { source: screenshotPath });
          }
        } else {
          console.log(Date.now(), product.name, `is NOT yet available at ${currentSiteName}!`);
          if (bot_chat_id !== 0) {
            if (Date.now() - lastMessageSentTime.value >= intervalBetweenNotAvailableMessages) {
              // await bot.telegram.sendMessage(bot_chat_id, `${product.name} is NOT available yet.`);
              lastMessageSentTime.value = Date.now();
            }
          }
        }
      }
    }
  }
});

main();