const puppeteer = require('puppeteer');

const { createObjectCsvWriter } = require('csv-writer');

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

async function scrapeUserData(page, userLink, mainPageLinks, csvWriter) {
    await page.goto(userLink);

   await page.waitForSelector('strong[data-e2e="followers-count"]');
    await page.waitForSelector('strong[data-e2e="likes-count"]');
    await page.waitForSelector('strong[data-e2e="video-views"]');

    const followersCount = await page.$eval('strong[data-e2e="followers-count"]', (element) => element.textContent);
    const likesCount = await page.$eval('strong[data-e2e="likes-count"]', (element) => element.textContent);
    const videoData = await page.$$eval('strong[data-e2e="video-views"]', (elements) => {
        const lastFiveVideos = elements.slice(0, 5).map((element) => element.textContent);
        return { lastFiveVideos };
    });

    await page.waitForSelector('a[href*="/video/"]', { timeout: 50000, visible: true });

    const videoDetails = [];

    const videoLinks = await page.$$eval('a[href*="/video/"]', (elements) => {
        return elements.slice(0, 5).map((element) => element.href);
    });

    for (const videoLink of videoLinks) {
        await page.goto(videoLink, { waitUntil: 'networkidle2' });

        await page.waitForSelector('strong[data-e2e="like-count"]', { timeout: 50000, visible: true });

        const likesCountForVideo = await page.$eval('strong[data-e2e="like-count"]', (element) => element.textContent).catch(() => 'N/A');
        videoDetails.push({ videoLink, likesCount: likesCountForVideo });
    }

    const uniqueVideoDetails = videoDetails.filter((video, index, self) =>
            index === self.findIndex((v) => (
                v.videoLink === video.videoLink
            ))
    );

    console.log('Followers Count:', followersCount);
    console.log('Likes Count:', likesCount);
    console.log('Views Count for Last 5 Videos:', videoData.lastFiveVideos);
    console.log('Video Details for Last 5 Videos:', uniqueVideoDetails);

    const records = mainPageLinks.map((mainPageLink) => ({
        userLink: mainPageLink,
        followersCount,
        likesCount,
        viewsCount: videoData.lastFiveVideos.join(', '),
        videoDetails: uniqueVideoDetails.map((video) => `${video.videoLink}: ${video.likesCount}`).join(', '),
    }));

    await csvWriter.writeRecords(records);
    console.log('Data has been written to the CSV file');
}
(async () => {
    let browser;
    try {
        browser = await puppeteer.launch({ headless: false });
        const page = await browser.newPage();
        page.setDefaultNavigationTimeout(2 * 60 * 1000);

        const csvWriter = createObjectCsvWriter({
            path: 'output.csv',
            header: [
                { id: 'userLink', title: 'User Link' },
                { id: 'followersCount', title: 'Followers Count' },
                { id: 'likesCount', title: 'Likes Count' },
                { id: 'viewsCount', title: 'Views Count for Last 5 Videos' },
                { id: 'videoDetails', title: 'Video Details for Last 5 Videos' },
            ],
        });

        for (const link of tikTokLinks) {
            console.log(`Navigation to the page: ${link}`);
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
                await scrapeUserData(page, mainPageLink, [mainPageLink], csvWriter);
            }
        }
    } catch (e) {
        console.error('Scrape failed', e);
    } finally {
        await browser?.close();
    }
})();