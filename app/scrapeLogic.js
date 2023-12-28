const puppeteer = require('puppeteer');

async function scrapeUserData(page, userLink) {
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
        videoDetails.push({ likesCount: likesCountForVideo });
    }

    return {
        followersCount,
        likesCount,
        lastFiveVideos: videoData.lastFiveVideos,
        videoDetails: videoDetails.map((video) => video.likesCount),
    };
}
module.exports = {
    scrapeUserData,
};