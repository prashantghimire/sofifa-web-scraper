const fs = require('fs');
const axios = require('axios');
const cheerio = require('cheerio');
const {readPage} = require('./crawler');
const {formatDate} = require('./utils');
const sofifaBaseUrl = `https://sofifa.com`;
const _ = require('lodash');
const log = require('loglevel');

const countries = JSON.parse(fs.readFileSync('./data/countries.json').toString());
const playersIdsFilePath = './output/player_ids.csv';
const playersDataFilePath = './output/player_data.csv';

const cliProgress = require('cli-progress');
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

/**
 * This method will scan the player list page of sofifa and load the file with player ids.
 * @param options
 * @returns {Promise<{success: boolean}>}
 */
const loadAllPlayerIds = async (options) => {
    options = options || {};
    fs.writeFileSync(playersIdsFilePath, ``);
    let path = `/players?col=oa&sort=desc`;
    bar.start(options.testScan ? 1 : 310, 0); // approximately 310 pages on sofifa.
    let count = 0;
    while (true) {
        bar.update(++count);
        const url = sofifaBaseUrl + path;
        log.info('url=' + url);
        let html;
        try {
            html = await readPage(url);
        } catch (e) {
            log.error('read page error', e);
            continue;
        }
        const $ = cheerio.load(html);
        const playerListTable = $('div.card table.table.table-hover.persist-area tbody tr');
        const players = playerListTable
            .map((i, el) => {
                const link = $(el).find('td.col-name a').attr('href');
                const parts = link.split('/');
                return parts[2];
            })
            .get();
        const content = players.join('\n') + '\n';
        fs.appendFileSync(playersIdsFilePath, content);
        // update path to scan next page
        path = $('div.pagination a:last-child').attr('href');
        const isLastPage = !$('div.pagination a').text().includes('Next');
        if (isLastPage || options.testScan) {
            log.info('\nPlayer ids loaded successfully!\n');
            break;
        }
    }
    bar.stop();
    return {success: true};
};

/**
 * Helper for getting stats
 * @param text
 * @returns {string}
 */
const getStatsBoxType = (text) => {
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
    const playerStats = ['attacking', 'skill', 'movement', 'power', 'mentality', 'defending', 'goalkeeping', 'traits'];
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
                    profile.profile_preferred_foot = profileListText.replace(preferredFoot, '').trim();
                } else if (profileListText.endsWith(weakFoot)) {
                    profile.profile_weak_foot = parseInt(profileListText.replace(weakFoot, '').trim(),);
                } else if (profileListText.endsWith(skillMoves)) {
                    profile.profile_skill_moves = parseInt(profileListText.replace(skillMoves, '').trim(),);
                } else if (profileListText.endsWith(internationalReputation)) {
                    profile.profile_international_reputation = parseInt(profileListText.replace(internationalReputation, '').trim());
                } else if (profileListText.startsWith(workRate)) {
                    profile.profile_work_rate = profileListText
                        .replace(workRate, '')
                        .replace(' ', '')
                        .trim();
                } else if (profileListText.startsWith(bodyType)) {
                    profile.profile_body_type = profileListText.replace(bodyType, '').trim();
                } else if (profileListText.startsWith(realFace)) {
                    profile.profile_real_face = profileListText.replace(realFace, '').trim();
                } else if (profileListText.startsWith(releaseClause)) {
                    profile.profile_release_clause = profileListText
                        .replace(releaseClause, '')
                        .trim();
                } else if (profileListText.startsWith(id)) {
                    profile.profile_id = profileListText.replace(id, '').trim();
                }
            }).get();
        return profile;
    } else if (type === 'player_specialities') {
        let specialities = $('ul li')
            .map((i, el) => $(el).text().replace('#', '').trim())
            .get();
        return {specialities: specialities.join(',')};
    } else if (type === 'club') {
        const club_name = $('.card h5 a').text().trim();
        const club_logo = $('.card > img').attr('data-src');
        const club_id = parseInt(club_logo.split('/')[4]);
        const club_others = {};
        $('.card ul li').each((i, el) => {
            const text = $(el).text().toLowerCase();
            const position = 'position';
            const kitNumber = 'kit number';
            const joined = 'joined';
            const contractValidUntil = 'contract valid until';
            if (i === 0) {
                club_others.club_rating = text.trim();
            } else if (text.startsWith(position)) {
                club_others.club_position = text.replace(position, '')?.toUpperCase();
            } else if (text.startsWith(kitNumber)) {
                club_others.club_kit_number = text.replace(kitNumber, '');
            } else if (text.startsWith(joined)) {
                club_others.club_joined = formatDate(text.replace(joined, ''));
            } else if (text.startsWith(contractValidUntil)) {
                club_others.club_contract_valid_until = text
                    .replace(contractValidUntil, '')
                    .trim();
            }
        });
        return {
            club_id, club_name, club_logo, ...club_others,
        };
    } else if (type === 'country') {
        const country = {
            country_id: $('.card h5 a').attr('href').split('/')[2],
            country_name: $('.card h5 a').text().trim(),
            country_logo: $('.card > img').attr('data-src'),
        };
        const country_other = {};
        $('.card > ul li').each((i, el) => {
            const text = $(el).text().toLowerCase();
            const position = 'position';
            const kitNumber = 'kit number';
            if (i === 0) {
                country_other.country_rating = text.trim();
            } else if (text.startsWith(position)) {
                country_other.country_position = text.replace(position, '');
            } else if (text.startsWith(kitNumber)) {
                country_other.country_kit_number = text.replace(kitNumber, '');
            }
        });

        return {...country, ...country_other};
    } else if (type === 'traits') {
        let traits = $('.card ul li')
            .map((i, el) => $(el).find('span:first-child').text())
            .get().join(',');
        return {traits};
    } else if (playerStats.includes(type)) {
        const stats = {};
        $('.card ul li').each((i, el) => {
            const val = $(el).find('span:first-child').text();
            const attr = $(el).find('span:last-child').text().toLowerCase();
            const attrKey = _.snakeCase(attr);
            stats[attrKey] = val;
        });
        return stats;
    }
    return '';
};

const getBasicInfo = (html) => {
    const $ = cheerio.load(html);
    const basic = $('div.bp3-card.player');
    const header = $('header');
    const title = $('title').text();
    const description = $('meta[name=description]').attr('content');
    const name = title.substring(0, title.indexOf('FIFA ') - 1);
    const full_name = basic.find('.info h1').html();
    const short_name = header.find('h1.ellipsis').html();
    const country_flag = basic.find().attr('data-src');
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
        name, full_name, short_name, country_flag, description, image, height, weight, positions, dob,
    };
};

const getAllPlayerDetailById = async (playerId) => {
    try {
        playerId = playerId.trim();
        const url = `${sofifaBaseUrl}/player/${playerId}/`;
        const html = await readPage(url);
        const $ = cheerio.load(html);

        let dataMap = {};
        dataMap.version = $('input.bp3-input.player-suggest.suggest').attr('data-roster',);
        const date = $($('.bp3-menu').get(2))
            .find('a.bp3-menu-item:nth-child(1)')
            .text();
        dataMap.version_date = formatDate(date);
        const basicInfo = getBasicInfo(html);
        dataMap = {...dataMap, ...basicInfo};
        $('body > .center .grid .col.col-12 .block-quarter').each((index, el) => {
            const html = $(el).html().trim();
            if (!html) return;
            const text = $(el)
                .text()
                .toLowerCase()
                .replace(/(\r\n|\n|\r)/gm, '');
            const type = getStatsBoxType(text);
            let extractData1 = extractData(type, html);
            dataMap = {...dataMap, ...extractData1};
        });
        return dataMap;
    } catch (e) {
        console.log('error: ', e.message + ', player id = ' + playerId);
    }
};
/**
 *
 * @param options {{testScan: boolean}}
 * @returns {Promise<void>}
 */
const writePlayersData = async (options) => {

    await loadAllPlayerIds(options); // pass {testScan: true} for scanning few players

    let playerIdList = fs.readFileSync(playersIdsFilePath).toString().trim().split('\n');
    bar.start(playerIdList.length, 0);

    let count = 0;
    fs.writeFileSync(playersDataFilePath, '');
    const line = `version,version_date,name,full_name,short_name,country_flag,description,image,height,weight,positions,dob,overall_rating,potential,value,wage,profile_preferred_foot,profile_weak_foot,profile_skill_moves,profile_international_reputation,profile_work_rate,profile_body_type,profile_real_face,profile_release_clause,profile_id,specialities,club_id,club_name,club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,country_id,country_name,country_logo,country_rating,country_position,country_kit_number,crossing,finishing,heading_accuracy,short_passing,volleys,dribbling,curve,fk_accuracy,long_passing,ball_control,acceleration,sprint_speed,agility,reactions,balance,shot_power,jumping,stamina,strength,long_shots,aggression,interceptions,positioning,vision,penalties,composure,defensive_awareness,standing_tackle,sliding_tackle,gk_diving,gk_handling,gk_kicking,gk_positioning,gk_reflexes,traits`;
    fs.appendFileSync(playersDataFilePath, line + '\n', {encoding: 'utf-8'});
    for await (const playerId of playerIdList) {
        try {
            const playerDetails = await getAllPlayerDetailById(playerId);
            const {
                version,
                version_date,
                name,
                full_name,
                short_name,
                country_flag,
                description,
                image,
                height,
                weight,
                positions,
                dob,
                overall_rating,
                potential,
                value,
                wage,
                profile_preferred_foot,
                profile_weak_foot,
                profile_skill_moves,
                profile_international_reputation,
                profile_work_rate,
                profile_body_type,
                profile_real_face,
                profile_release_clause,
                profile_id,
                specialities,
                club_id,
                club_name,
                club_logo,
                club_rating,
                club_position,
                club_kit_number,
                club_joined,
                club_contract_valid_until,
                country_id,
                country_name,
                country_logo,
                country_rating,
                country_position,
                country_kit_number,
                crossing,
                finishing,
                heading_accuracy,
                short_passing,
                volleys,
                dribbling,
                curve,
                fk_accuracy,
                long_passing,
                ball_control,
                acceleration,
                sprint_speed,
                agility,
                reactions,
                balance,
                shot_power,
                jumping,
                stamina,
                strength,
                long_shots,
                aggression,
                interceptions,
                positioning,
                vision,
                penalties,
                composure,
                defensive_awareness,
                standing_tackle,
                sliding_tackle,
                gk_diving,
                gk_handling,
                gk_kicking,
                gk_positioning,
                gk_reflexes,
                traits
            } = playerDetails;

            const detailsRow = `"${version}","${version_date}","${name}","${full_name}","${short_name}",${country_flag}","${description}","${image}","${height}","${weight}","${positions}","${dob}","${overall_rating}","${potential}","${value}","${wage}","${profile_preferred_foot}","${profile_weak_foot}","${profile_skill_moves}","${profile_international_reputation}","${profile_work_rate}","${profile_body_type}","${profile_real_face}","${profile_release_clause}","${profile_id}","${specialities}","${club_id}","${club_name}","${club_logo}","${club_rating}","${club_position}","${club_kit_number}","${club_joined}","${club_contract_valid_until}","${country_id}","${country_name}","${country_logo}","${country_rating}","${country_position}","${country_kit_number}","${crossing}","${finishing}","${heading_accuracy}","${short_passing}","${volleys}","${dribbling}","${curve}","${fk_accuracy}","${long_passing}","${ball_control}","${acceleration}","${sprint_speed}","${agility}","${reactions}","${balance}","${shot_power}","${jumping}","${stamina}","${strength}","${long_shots}","${aggression}","${interceptions}","${positioning}","${vision}","${penalties}","${composure}","${defensive_awareness}","${standing_tackle}","${sliding_tackle}","${gk_diving}","${gk_handling}","${gk_kicking}","${gk_positioning}","${gk_reflexes}","${traits}"`;
            fs.appendFileSync(playersDataFilePath, detailsRow + '\n', {encoding: 'utf-8'});
            bar.update(++count);
        } catch (e) {
            log.error(`failed to get playerId=${playerId}`);
        }
    }

    bar.stop();
};

module.exports = {writePlayersData};