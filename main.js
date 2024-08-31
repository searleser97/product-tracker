import { chromium } from 'playwright';
import { canong7xiiiHandler } from './canong7xiiiHandler.js';

// function to sleep for a given number of milliseconds
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const productPageHandlers = [
  canong7xiiiHandler
];

(async () => {
  const browser = await chromium.launch({ headless: false });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Exiting gracefully...');
    await browser.close();
    process.exit();
  });
  const context = await browser.newContext();
  const pages = [];
  console.log('Running product page handlers...');
  for (let i = 0; i < productPageHandlers.length; i++) {
    const handler = productPageHandlers[i];
    if (pages.length <= i) {
      pages.push(await handler(context));
    } else {
      const cachedPage = pages[i];
      await handler(context, cachedPage);
    }
    await sleep(5000);
  }
})();
