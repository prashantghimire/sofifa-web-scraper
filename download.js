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
 * club_id,club_name,club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,
 * country_id,country_name,country_flag,country_logo,country_rating,country_position,country_kit_number,
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

    // profile content
    // player_id,version,full_name,description,image,height,weight,dob,positions,

    const content_profile = content.find('.profile');
    const full_name = content_profile.find('h1').text();
    const image = content_profile.find('img').attr('data-src');

    // 22y.o. (Jul 21, 2000) 195cm / 6'5" 94kg / 207lbs
    const profile_string = content_profile.find('p').text();

    let dateMatch = profile_string.match(/\((.*?)\)/);
    const dob = dateMatch ? dateMatch[1] : 'na';

    const weightMatch = profile_string.match(/(\d+)kg/);
    const weight = weightMatch ? weightMatch[1] : 'na';

    const heightMatch = profile_string.match(/(\d+)cm/);
    const height = heightMatch ? heightMatch[1] : 'na';

    const position = content_profile.find('p span').map((i, el) => $(el).text()).get().join(',');

    // overall content
    // overall_rating,potential,value,wage
    const grids = content.find('.grid').get();

    const content_overall = $(grids[0]).find('.col').map((i, el) => $(el).find('em').text()).get();

    const overall_rating = content_overall[0],
        potential = content_overall[1],
        value = content_overall[2],
        wage = content_overall[3];

    // preferred_foot,weak_foot,skill_moves,international_reputation,work_rate,body_type,real_face,release_clause,
    const content_player_info = $(grids[1]).find('.col');
    
    const content_player_profile = $(content_player_info[0]).find('p').map((i, el) => $(el).text()).get();
    const content_player_specialities = $(content_player_info[1]).find('p').map((i, el) => $(el).text()).get();
    const content_player_club = $(content_player_info[2]).find('p').map((i, el) => $(el).text()).get();
    const content_player_national_team = $(content_player_info[3]).find('p').map((i, el) => $(el).text()).get();
    
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

