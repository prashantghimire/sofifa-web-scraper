const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const {readPage} = require('./crawler');
const sofifaBaseUrl = `https://sofifa.com`;
const playersIdFilePath = './output/player_list.csv';

const getAllPlayerIds = async (options) => {
    fs.writeFileSync(playersIdFilePath, ``);
    let path = `/players?col=oa&sort=desc`;
    while (true) {
        const url = sofifaBaseUrl + path;
        console.log('url = ' + url);
        let html;
        try {
            html = await readPage(url);
        } catch (e) {
            console.log('error', e);
            continue;
        }
        const $ = cheerio.load(html);
        const table = $('div.card table.table.table-hover.persist-area tbody tr');
        const players = table
            .map((i, el) => {
                const link = $(el).find('td.col-name a').attr('href');
                const parts = link.split('/');
                return parts[2];
            })
            .get();
        const content = players.join('\n') + '\n';
        fs.appendFileSync(playersIdFilePath, content);
        path = $('div.pagination a:last-child').attr('href');
        const isLastPage = !$('div.pagination a').text().includes('Next');
        console.log(path);
        if (isLastPage || options.testScan) {
            console.log('--- scan complete successfully.---');
            break;
        }
    }
    return {success: true};
};


module.exports = {getAllPlayerIds};