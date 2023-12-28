const puppeteer = require('puppeteer');
const { scrapeUserData } = require('./scrapeLogic');
const { generateCSV } = require('./csvGenerator');

const tikTokLinks = [
    'https://www.tiktok.com/search?q=latvie%C5%A1utiktok&t=1679913963503',
    'https://www.tiktok.com/search?q=latviesutiktok&t=1679914008172',
    'https://www.tiktok.com/search?q=%23r%C4%ABga&t=1679914077948',
    'https://www.tiktok.com/search?q=%23riga&t=1679914093241',
    'https://www.tiktok.com/search?q=%23latvija&t=1679914138954',
    'https://www.tiktok.com/search?q=%D0%BB%D0%B0%D1%82%D0%B2%D0%B8%D1%8F&t=1683100658756',
    'https://www.tiktok.com/search?q=%23tiktoklatvia&t=1683102332617',
    'https://www.tiktok.com/search?q=%23latviantiktok&t=1683102479276',
    'https://www.tiktok.com/search?q=%23latviatiktok&t=1683102521058',
    'https://www.tiktok.com/search?q=%23rekl%C4%81ma&t=1683102843919'
];

(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);

        const records = [];

        for (const link of tikTokLinks) {
            console.log(`Navigating to the page: ${link}`);
            await page.goto(link, { waitUntil: 'networkidle2' });

            await page.waitForSelector('.css-2zn17v-PUniqueId', { timeout: 60000 });

            const mainPageLinks = await page.$$eval('.css-2zn17v-PUniqueId', elements => {
                return elements.map(element => {
                    const uniqueId = element.textContent.trim();
                    return `https://www.tiktok.com/@${uniqueId}`;
                });
            });

            for (const mainPageLink of mainPageLinks) {
                console.log(`Navigating to main page: ${mainPageLink}`);
                const userData = await scrapeUserData(page, mainPageLink);
                records.push({
                    userLink: mainPageLink,
                    followersCount: userData.followersCount,
                    likesCount: userData.likesCount,
                    viewsCount: userData.lastFiveVideos.join(', '),
                    videoDetails: userData.videoDetails.join(', '),
                });
            }
        }

        await generateCSV(records, 'output.csv');
    } catch (e) {
        console.error('Scrape failed', e);
    } finally {
        await browser?.close();
    }
})();
