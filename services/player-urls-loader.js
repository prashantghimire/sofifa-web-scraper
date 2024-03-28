const {getPageContent} = require('./scraper');
const cheerio = require('cheerio');
const fs = require('fs');

const SOFIFA_BASE_URL = 'https://sofifa.com';
const PLAYER_IDS_SOFIFA_URL = `https://sofifa.com/players?col=oa&sort=desc&offset=`;
const playerUrlsFullFile = './files/player-urls-full.csv';
const playerUrlsTestFile = './files/player-urls-test.csv';

/**
 * This method gets all the players' page urls from sofifa.com
 * @returns {Promise<void>}
 */
async function loadPlayerUrlsFile(scanType = 'full') {
    const playerUrlsFileToWrite = scanType === 'full' ? playerUrlsFullFile : playerUrlsTestFile;
    fs.writeFileSync(playerUrlsFileToWrite, '');
    let currentOffset = 0;
    while (true) {
        let content = await getPageContent(PLAYER_IDS_SOFIFA_URL + currentOffset);
        const $ = cheerio.load(content);
        const playerListTable = $('main article table tbody tr');
        const players = playerListTable
            .map((i, e) => SOFIFA_BASE_URL + $(e).find('td a').attr('href'))
            .get();
        const playerIds = players.join('\n') + '\n';
        fs.appendFileSync(playerUrlsFileToWrite, playerIds);
        const hasNextPath = $('.pagination a').text().includes('Next');
        if (!hasNextPath) {
            console.log('does not have next page. stopping scanning now.');
            break;
        }
        currentOffset += 60;
        console.log(`downloaded player urls count=${currentOffset}`);
        if (scanType === 'test') {
            console.log('completed test urls load.');
            break;
        }
    }
}

module.exports = {
    loadPlayerUrlsFile
};