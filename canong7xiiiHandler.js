export async function canong7xiiiHandler(browserContext, cachedPage) {
  console.log("checking Canon G7X Mark III page...");
  if (cachedPage) {
    await cachedPage.bringToFront();
    await cachedPage.reload();
    await cachedPage.screenshot({ path: 'canong7xiii.png', fullPage: true });
    return cachedPage;
  } else {
    const page = await browserContext.newPage();
    const url = 'https://www.usa.canon.com/shop/p/powershot-g7-x-mark-iii?color=Black&type=New';
    await page.goto(url);
    await page.screenshot({ path: 'canong7xiii.png', fullPage: true });
    return page;
  }
}