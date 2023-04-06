const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const {readPage} = require('./crawler');
const {formatDate} = require('./utils');
const sofifaBaseUrl = `https://sofifa.com`;
const _ = require('lodash');

const countries = JSON.parse(fs.readFileSync('./data/countries.json').toString());
const playersIdFilePath = './output/player_list.csv';
const playerDetailsFilePath = './output/final_data.csv';
const playerStatsFilePath = './output/final_stats.csv';

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

const getBoxType = (text) => {
    const countryNames = countries.map((c) => c.Name.toLowerCase());
    if (text.endsWith('overall rating')) {
        return 'overall_rating';
    } else if (text.endsWith('potential')) {
        return 'potential';
    } else if (text.endsWith('value')) {
        return 'value';
    } else if (text.endsWith('wage')) {
        return 'wage';
    } else if (text.startsWith('profile')) {
        return 'profile';
    } else if (text.startsWith('player specialities')) {
        return 'player_specialities';
    } else if (text.includes('contract valid until')) {
        return 'club';
    } else if (text.startsWith('attacking')) {
        return 'attacking';
    } else if (text.startsWith('skill')) {
        return 'skill';
    } else if (text.startsWith('movement')) {
        return 'movement';
    } else if (text.startsWith('power')) {
        return 'power';
    } else if (text.startsWith('mentality')) {
        return 'mentality';
    } else if (text.startsWith('defending')) {
        return 'defending';
    } else if (text.startsWith('goalkeeping')) {
        return 'goalkeeping';
    } else if (text.startsWith('traits')) {
        return 'traits';
    } else {
        const isCountry = countryNames.some((c) => text.includes(c));
        if (isCountry) {
            return 'country';
        }
    }
    throw new Error('Box not recognized error: ' + text);
};

const extractData = (type, html) => {
    const $ = cheerio.load(html);
    const playerStats = ['attacking', 'skill', 'movement', 'power', 'mentality', 'defending', 'goalkeeping', 'traits',];
    if (type === 'overall_rating') {
        return {overall_rating: $('div span').text()};
    } else if (type === 'potential') {
        return {potential: $('div span').text()};
    } else if (type === 'value') {
        return {value: $('div').remove('.sub').html()};
    } else if (type === 'wage') {
        return {wage: $('div').remove('.sub').html()};
    } else if (type === 'profile') {
        const profile = {};
        $('ul li')
            .each((i, el) => {
                const profileListText = $(el).text().toLowerCase();
                const preferredFoot = 'preferred foot';
                const weakFoot = 'weak foot';
                const skillMoves = 'skill moves';
                const internationalReputation = 'international reputation';
                const workRate = 'work rate';
                const bodyType = 'body type';
                const realFace = 'real face';
                const releaseClause = 'release clause';
                const id = 'id';
                if (profileListText.startsWith(preferredFoot)) {
                    profile.preferredFoot = profileListText
                        .replace(preferredFoot, '')
                        .trim();
                } else if (profileListText.endsWith(weakFoot)) {
                    profile.weakFoot = parseInt(profileListText.replace(weakFoot, '').trim(),);
                } else if (profileListText.endsWith(skillMoves)) {
                    profile.skillMoves = parseInt(profileListText.replace(skillMoves, '').trim(),);
                } else if (profileListText.endsWith(internationalReputation)) {
                    profile.internationalReputation = parseInt(profileListText.replace(internationalReputation, '').trim(),);
                } else if (profileListText.startsWith(workRate)) {
                    profile.workRate = profileListText
                        .replace(workRate, '')
                        .replace(' ', '')
                        .trim();
                } else if (profileListText.startsWith(bodyType)) {
                    profile.bodyType = profileListText.replace(bodyType, '').trim();
                } else if (profileListText.startsWith(realFace)) {
                    profile.realFace = profileListText.replace(realFace, '').trim();
                } else if (profileListText.startsWith(releaseClause)) {
                    profile.releaseClause = profileListText
                        .replace(releaseClause, '')
                        .trim();
                } else if (profileListText.startsWith(id)) {
                    profile.id = profileListText.replace(id, '').trim();
                }
            })
            .get();
        return profile;
    } else if (type === 'player_specialities') {
        let specialities = $('ul li')
            .map((i, el) => $(el).text().replace('#', '').trim())
            .get();
        return {specialities: specialities.join(',')};
    } else if (type === 'club') {
        const name = $('.card h5 a').text().trim();
        const logo = $('.card > img').attr('data-src');
        const id = parseInt(logo.split('/')[4]);
        const other = {};
        $('.card ul li').each((i, el) => {
            const text = $(el).text().toLowerCase();
            const position = 'position';
            const kitNumber = 'kit number';
            const joined = 'joined';
            const contractValidUntil = 'contract valid until';
            if (i === 0) {
                other.rating = text;
            } else if (text.startsWith(position)) {
                other.position = text.replace(position, '')?.toUpperCase();
            } else if (text.startsWith(kitNumber)) {
                other.kitNumber = text.replace(kitNumber, '');
            } else if (text.startsWith(joined)) {
                other.joined = formatDate(text.replace(joined, ''));
            } else if (text.startsWith(contractValidUntil)) {
                other.contractValidUntil = text
                    .replace(contractValidUntil, '')
                    .trim();
            }
        });
        return {
            id, name, logo, ...other,
        };
    } else if (type === 'country') {
        const country = {
            id: $('.card h5 a').attr('href').split('/')[2],
            name: $('.card h5 a').text().trim(),
            logo: $('.card > img').attr('data-src'),
        };
        const other = {};
        $('.card > ul li').each((i, el) => {
            const text = $(el).text().toLowerCase();
            const position = 'position';
            const kitNumber = 'kit number';
            if (i === 0) {
                other.rating = text;
            } else if (text.startsWith(position)) {
                other.position = text.replace(position, '');
            } else if (text.startsWith(kitNumber)) {
                other.kitNumber = text.replace(kitNumber, '');
            }
        });

        return {...country, ...other};
    } else if (type === 'traits') {
        return {
            'traits': $('.card ul li')
                .map((i, el) => $(el).find('span:first-child').text())
                .get().join(',')
        };
    } else if (playerStats.includes(type)) {
        const stats = {};
        $('.card ul li').each((i, el) => {
            const val = $(el).find('span:first-child').text();
            const attr = $(el).find('span:last-child').text().toLowerCase();
            const attrKey = _.camelCase(attr);
            stats[attrKey] = val;
        });
        return stats;
    }
    return '';
};

const getBasicInfo = (html) => {
    const $ = cheerio.load(html);
    const basic = $('div.bp3-card.player');
    const title = $('title').text();
    const description = $('meta[name=description]').attr('content');
    const name = title.substring(0, title.indexOf('FIFA ') - 1);
    const fullName = basic.find('.info h1').html();
    const countryFlag = basic.find('.info .meta a img').attr('data-src');
    const image = basic.find('img[data-type="player"]').attr('data-src');
    const otherAttrs = basic.find('.info .meta').text().split(' ');
    const weight = parseInt(otherAttrs[otherAttrs.length - 1] || '0');
    const height = parseInt(otherAttrs[otherAttrs.length - 6] || '0');

    const positions = (basic
        .find('.info .meta span.pos')
        .map((i, e) => $(e).html())
        .get()).join(',');

    const infoMeta = $(basic.find('.info .meta').contents()).text();
    const dob = formatDate(infoMeta.substring(infoMeta.indexOf('(') + 1, infoMeta.indexOf(')')),);

    return {
        name, fullName, countryFlag, description, image, height, weight, positions, dob,
    };
};

const getAllPlayerDetailById = async (playerId) => {
    try {
        const url = `${sofifaBaseUrl}/player/${playerId}/`;
        const html = await readPage(url);
        const $ = cheerio.load(html);

        let dataMap = {};
        dataMap.version = $('input.bp3-input.player-suggest.suggest').attr('data-roster',);
        const date = $($('.bp3-menu').get(2))
            .find('a.bp3-menu-item:nth-child(1)')
            .text();
        dataMap.versionDate = formatDate(date);
        const basicInfo = getBasicInfo(html);
        dataMap = {...dataMap, ...basicInfo};
        $('body > .center .grid .col.col-12 .block-quarter').each((index, el) => {
            const html = $(el).html().trim();
            if (!html) return;
            const text = $(el)
                .text()
                .toLowerCase()
                .replace(/(\r\n|\n|\r)/gm, '');
            const type = getBoxType(text);
            let extractData1 = extractData(type, html);
            dataMap = {...dataMap, ...extractData1};
        });
        return dataMap;
    } catch (e) {
        console.log('error: ', e.message + ', player id = ' + playerId);
    }
};

module.exports = {getAllPlayerIds, getAllPlayerDetailById};