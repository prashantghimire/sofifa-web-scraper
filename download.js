const cheerio = require('cheerio');
const Humanoid = require('humanoid-js');
const humanoid = new Humanoid();

/**
 *
 * @param url
 * @returns {Promise<String>}
 */
const readPage = async (url) => {
    const response = await humanoid.get(url);
    if (response.statusCode !== 200) {
        throw new Error('Cannot read page: ' + url);
    }
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(response.body);
        }, 300);
    });
};

/**
 * player_id,version,full_name,description,image,height,weight,dob,positions,
 * overall_rating,potential,value,wage,
 * preferred_foot,weak_foot,skill_moves,international_reputation,work_rate,body_type,real_face,release_clause,
 * specialities
 * club_id,club_name,club_league_id,club_league_name,club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,
 * country_id,country_name,country_league_id,country_league_name,country_flag,country_rating,country_position,country_kit_number,
 * crossing,finishing,heading_accuracy,short_passing,volleys,
 * dribbling,curve,fk_accuracy,long_passing,ball_control,
 * acceleration,sprint_speed,agility,reactions,balance,
 * shot_power,jumping,stamina,strength,long_shots,
 * aggression,interceptions,positioning,vision,penalties,composure,
 * defensive_awareness,standing_tackle,sliding_tackle,
 * gk_diving,gk_handling,gk_kicking,gk_positioning,gk_reflexes,play_styles
 */
async function getPlayerDetailsRow(url) {
    const html = await readPage(url);
    const player_id = url.split('/')[4];
    const version = url.split('/')[6];

    const $ = cheerio.load(html);
    const description = $('head meta[name=description]').attr('content');

    const content = $('body main article');

    // 1. profile content
    // player_id,version,full_name,description,image,height,weight,dob,positions,
    const content_profile = content.find('.profile');
    const full_name = content_profile.find('h1').text();
    const image = content_profile.find('img').attr('data-src');

    // 22y.o. (Jul 21, 2000) 195cm / 6'5" 94kg / 207lbs
    const profile_string = content_profile.find('p').text();

    let dateMatch = profile_string.match(/\((.*?)\)/);
    const dob = dateMatch ? dateMatch[1] : '';

    const weightMatch = profile_string.match(/(\d+)kg/);
    const weight = weightMatch ? weightMatch[1] : '';

    const heightMatch = profile_string.match(/(\d+)cm/);
    const height = heightMatch ? heightMatch[1] : '';

    const position = content_profile.find('p span').map((i, el) => $(el).text()).get().join(',');

    // 2. overall content
    // overall_rating,potential,value,wage
    const grids = content.find('.grid').get();

    const content_overall = $(grids[0]).find('.col').map((i, el) => $(el).find('em').text()).get();

    const overall_rating = content_overall[0],
        potential = content_overall[1],
        value = content_overall[2],
        wage = content_overall[3];

    const content_player_info = $(grids[1]).find('.col');

    // 3. preferred_foot,weak_foot,skill_moves,international_reputation,work_rate,body_type,real_face,release_clause,
    function getPlayerProfileAttrs() {
        const results = ['', '', '', '', '', '', '', ''];
        const index = $(content_player_info).find('h5').map((i, el) => $(el).text().includes('Profile')).get().indexOf(true);

        if (index < 0) {
            return results;
        }

        const content_player_profile = $(content_player_info[index]).find('p').map((i, el) => $(el).text()).get();
        results[0] = content_player_profile.find(s => s.includes('Preferred foot'))?.replace('Preferred foot ', '') || '';
        results[1] = content_player_profile.find(s => s.includes('Weak foot'))?.replace(' Weak foot', '') || '';
        results[2] = content_player_profile.find(s => s.includes('Skill moves'))?.replace(' Skill moves', '') || '';
        results[3] = content_player_profile.find(s => s.includes('International reputation'))?.replace(' International reputation', '') || '';
        results[4] = content_player_profile.find(s => s.includes('Work rate'))?.replace('Work rate ', '') || '';
        results[5] = content_player_profile.find(s => s.includes('Body type'))?.replace('Body type ', '') || '';
        results[6] = content_player_profile.find(s => s.includes('Real face'))?.replace('Real face ', '') || '';
        results[7] = content_player_profile.find(s => s.includes('Release clause'))?.replace('Release clause ', '') || '';
        return results;
    }


    // 4. specialities
    function getPlayerSpecialities() {
        const index = $(content_player_info).find('h5').map((i, el) => $(el).text().includes('Player specialities')).get().indexOf(true);
        if (index < 0) {
            return [''];
        }
        const content_player_specialities = $(content_player_info[index]).find('p').map((i, el) => $(el).text()).get();
        return content_player_specialities.map(s => s.replace('#', '')).join(',');
    }

    // 5. club_id,club_name,league_id, league_name, club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,
    function getPlayerClub() {
        let results = ['', '', '', '', '', '', '', ''];
        const index = $(content_player_info).find('h5').map((i, el) => $(el).text().includes('Club')).get().indexOf(true);
        if (index < 0) {
            return results;
        }
        const content_player_club_html = $(content_player_info[index]).find('p').map((i, el) => $(el).html()).get();

        const club_elem = content_player_club_html.find(e => e.includes('/team/'));
        const club_href = $(club_elem).attr('href');
        const club_id = club_href.split('/')[2] || '';
        const club_name = $(club_elem).text().trim() || '';
        const club_logo = $(club_elem).find('img').attr('data-src') || '';

        const club_league_elem = content_player_club_html.find(e => e.includes('/league/'));
        const club_league_href = $(club_league_elem).attr('href');
        const club_league_id = club_league_href.split('/')[2];
        const club_league_name = $(club_league_elem).text().trim() || '';

        const club_rating_elem = content_player_club_html.find(e => e.includes('<svg viewBox'));
        const club_rating = $(club_rating_elem).text().trim() || '';

        const content_player_club_elements = $(content_player_info[index]).find('p').map((i, el) => $(el).text()).get();
        const club_position = content_player_club_elements.find(s => s.includes('Position')).replace('Position', '').trim() || '';
        const club_kit_number = content_player_club_elements.find(s => s.includes('Kit number')).replace('Kit number', '').trim() || '';
        const club_joined = content_player_club_elements.find(s => s.includes('Joined')).replace('Joined', '').trim() || '';
        const club_contract_valid_util = content_player_club_elements.find(s => s.includes('Contract valid until')).replace('Contract valid until', '').trim() || '';
        results = [club_id, club_name, club_league_id, club_league_name, club_logo, club_rating, club_position, club_kit_number, club_joined, club_contract_valid_util];

        return results;
    }

    // country_id,country_name,country_league_id,country_league_name,country_flag,country_rating,country_position,country_kit_number,
    function getPlayerNationalTeam() {
        let results = ['', '', '', '', '', '', ''];
        const index = $(content_player_info).find('h5').map((i, el) => $(el).text().includes('National team')).get().indexOf(true);
        if (index < 0) {
            return results;
        }
        const content_player_national_team = $(content_player_info[index]).find('p').map((i, el) => $(el).html()).get();

        const country_elem = content_player_national_team.find(e => e.includes('/team/'));
        const country_href = $(country_elem).attr('href');
        const country_id = country_elem.split('/')[2] || '';
        const country_name = $(country_elem).text().trim() || '';
        const country_flag = $(country_elem).find('img').attr('data-src') || '';

        const country_league_elem = content_player_national_team.find(e => e.includes('/league/'));
        const country_league_href = $(country_league_elem).attr('href');
        const country_league_id = country_league_href.split('/')[2];
        const country_league_name = $(country_league_elem).text().trim() || '';

        const country_rating_elem = content_player_national_team.find(e => e.includes('<svg viewBox'));
        const country_rating = $(country_rating_elem).text().trim() || '';
        
        const content_player_country_elements = $(content_player_info[index]).find('p').map((i, el) => $(el).text()).get();
        const country_position = content_player_country_elements.find(s => s.includes('Position')).replace('Position', '').trim() || '';
        const country_kit_number = content_player_country_elements.find(s => s.includes('Kit number')).replace('Kit number', '').trim() || '';
        results = [country_id, country_name, country_league_id, country_league_name, country_flag, country_rating, country_position, country_kit_number];

        return results;
    }

    const player_profile_attrs = getPlayerProfileAttrs();
    const player_specialities = getPlayerSpecialities();
    const player_club = getPlayerClub();
    const player_national_team = getPlayerNationalTeam();

    const preferred_foot = '',
        weak_foot = '',
        skill_moves = '';

    const line_array = [
        player_id,
        version,
        full_name,
        description,
        image,
        height,
        weight,
        dob,
        position,
        overall_rating,
        potential,
        value,
        wage,
        preferred_foot,
        weak_foot,
        skill_moves
    ];

    const row = line_array.join('|');
    console.log(row);
}


(async function () {
    const row = await getPlayerDetailsRow('https://sofifa.com/player/231747/kylian-mbappe/240033/');
})();

