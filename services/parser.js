const cheerio = require('cheerio');
const {getPageContent} = require('./scraper');
const {formatDate} = require('./utils');

/** scans in following order.
 * 1. player_id,version,name,full_name,description,image,height_cm,weight_kg,dob,positions,
 * 2. overall_rating,potential,value,wage,
 * 3. preferred_foot,weak_foot,skill_moves,international_reputation,work_rate,body_type,real_face,release_clause,
 * 4. specialities
 * 5. club_id,club_name,club_league_id,club_league_name,club_logo,club_rating,club_position,club_kit_number,club_joined,club_contract_valid_until,
 * 6. country_id,country_name,country_league_id,country_league_name,country_flag,country_rating,country_position,country_kit_number,
 * 7. crossing,finishing,heading_accuracy,short_passing,volleys,
 *   dribbling,curve,fk_accuracy,long_passing,ball_control,
 *   acceleration,sprint_speed,agility,reactions,balance,
 *   shot_power,jumping,stamina,strength,long_shots,
 *   aggression,interceptions,positioning,vision,penalties,composure,
 *   defensive_awareness,standing_tackle,sliding_tackle,
 *   gk_diving,gk_handling,gk_kicking,gk_positioning,gk_reflexes
 * 8. play_styles
 */
async function getPlayerDetailsCsvRow(url) {
    const html = await getPageContent(url);
    const player_id = url.split('/')[4];
    
    const $ = cheerio.load(html);
    const description = $('head meta[name=description]').attr('content');
    const version = formatDate($('body select[name=roster] option[selected]').text()) || '';
    
    const content = $('body main article');

    // 1. profile content
    // player_id,version,name,full_name,description,image,height_cm,weight_kg,dob,positions,
    const content_profile = content.find('.profile');
    const name = $('title').text().split(' FC ')[0] || '';
    const full_name = content_profile.find('h1').text();
    const image = content_profile.find('img').attr('data-src');

    // 22y.o. (Jul 21, 2000) 195cm / 6'5" 94kg / 207lbs
    const profile_string = content_profile.find('p').text();

    let dateMatch = profile_string.match(/\((.*?)\)/);
    const dob = dateMatch ? formatDate(dateMatch[1]) : '';

    const weightMatch = profile_string.match(/(\d+)kg/);
    const weight_kg = weightMatch ? weightMatch[1] : '';

    const heightMatch = profile_string.match(/(\d+)cm/);
    const height_cm = heightMatch ? heightMatch[1] : '';

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
    function getPlayerProfile() {
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
        results[4] = content_player_profile.find(s => s.includes('Work rate'))?.replace('Work rate ', '').replace(/\s/g, '') || '';
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
        return [content_player_specialities.map(s => s?.replace('#', '').trim()).join(',')];
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
        const club_position = content_player_club_elements.find(s => s.includes('Position'))?.replace('Position', '').trim() || '';
        const club_kit_number = content_player_club_elements.find(s => s.includes('Kit number'))?.replace('Kit number', '').trim() || '';
        const club_joined = formatDate(content_player_club_elements.find(s => s.includes('Joined'))?.replace('Joined', '').trim()) || '';
        const club_contract_valid_util = content_player_club_elements.find(s => s.includes('Contract valid until'))?.replace('Contract valid until', '').trim() || '';
        results = [club_id, club_name, club_league_id, club_league_name, club_logo, club_rating, club_position, club_kit_number, club_joined, club_contract_valid_util];

        return results;
    }

    // 6. country_id,country_name,country_league_id,country_league_name,country_flag,country_rating,country_position,country_kit_number,
    function getPlayerNationalTeam() {
        let results = ['', '', '', '', '', '', '', ''];
        const index = $(content_player_info).find('h5').map((i, el) => $(el).text().includes('National team')).get().indexOf(true);
        if (index < 0) {
            return results;
        }
        const content_player_national_team = $(content_player_info[index]).find('p').map((i, el) => $(el).html()).get();

        const country_elem = content_player_national_team.find(e => e.includes('/team/'));
        const country_href = $(country_elem).attr('href');
        const country_id = country_href.split('/')[2] || '';
        const country_name = $(country_elem).text().trim() || '';
        const country_flag = $(country_elem).find('img').attr('data-src') || '';

        const country_league_elem = content_player_national_team.find(e => e.includes('/league/'));
        const country_league_href = $(country_league_elem).attr('href');
        const country_league_id = country_league_href.split('/')[2];
        const country_league_name = $(country_league_elem).text().trim() || '';

        const country_rating_elem = content_player_national_team.find(e => e.includes('<svg viewBox'));
        const country_rating = $(country_rating_elem).text().trim() || '';

        const content_player_country_elements = $(content_player_info[index]).find('p').map((i, el) => $(el).text()).get();
        const country_position = content_player_country_elements.find(s => s.includes('Position'))?.replace('Position', '').trim() || '';
        const country_kit_number = content_player_country_elements.find(s => s.includes('Kit number'))?.replace('Kit number', '').trim() || '';
        results = [country_id, country_name, country_league_id, country_league_name, country_flag, country_rating, country_position, country_kit_number];

        return results;
    }

    function getPlayerAttributes() {
        // 7. player_attributes
        const player_attr_grid1 = $(grids[2])
            .find('.col p')
            .each((i, e) => {
                $(e).find('span.plus')?.remove();
                $(e).find('span.minus')?.remove();
            })
            .map((i, el) => $(el).text())
            .get();

        const player_attr_grid2 = $(grids[3]).find('.col p')
            .each((i, e) => {
                $(e).find('span.plus')?.remove();
                $(e).find('span.minus')?.remove();
            })
            .map((i, el) => $(el).text())
            .get();

        // attacking
        // crossing,finishing,heading_accuracy,short_passing,volleys
        const crossing = player_attr_grid1.find(s => s.includes('Crossing'))?.replace('Crossing', '').trim() || '';
        const finishing = player_attr_grid1.find(s => s.includes('Finishing'))?.replace('Finishing', '').trim() || '';
        const heading_accuracy = player_attr_grid1.find(s => s.includes('Heading accuracy'))?.replace('Heading accuracy', '').trim() || '';
        const short_passing = player_attr_grid1.find(s => s.includes('Short passing'))?.replace('Short passing', '').trim() || '';
        const volleys = player_attr_grid1.find(s => s.includes('Volleys'))?.replace('Volleys', '').trim() || '';

        // skill
        // dribbling,curve,fk_accuracy,long_passing,ball_control,
        const dribbling = player_attr_grid1.find(s => s.includes('Dribbling'))?.replace('Dribbling', '').trim() || '';
        const curve = player_attr_grid1.find(s => s.includes('Curve'))?.replace('Curve', '').trim() || '';
        const fk_accuracy = player_attr_grid1.find(s => s.includes('FK Accuracy'))?.replace('FK Accuracy', '').trim() || '';
        const long_passing = player_attr_grid1.find(s => s.includes('Long passing'))?.replace('Long passing', '').trim() || '';
        const ball_control = player_attr_grid1.find(s => s.includes('Ball control'))?.replace('Ball control', '').trim() || '';

        // movement
        // acceleration,sprint_speed,agility,reactions,balance,
        const acceleration = player_attr_grid1.find(s => s.includes('Acceleration'))?.replace('Acceleration', '').trim() || '';
        const sprint_speed = player_attr_grid1.find(s => s.includes('Sprint speed'))?.replace('Sprint speed', '').trim() || '';
        const agility = player_attr_grid1.find(s => s.includes('Agility'))?.replace('Agility', '').trim() || '';
        const reactions = player_attr_grid1.find(s => s.includes('Reactions'))?.replace('Reactions', '').trim() || '';
        const balance = player_attr_grid1.find(s => s.includes('Balance'))?.replace('Balance', '').trim() || '';

        // power
        // shot_power,jumping,stamina,strength,long_shots,
        const shot_power = player_attr_grid1.find(s => s.includes('Shot power'))?.replace('Shot power', '').trim() || '';
        const jumping = player_attr_grid1.find(s => s.includes('Jumping'))?.replace('Jumping', '').trim() || '';
        const stamina = player_attr_grid1.find(s => s.includes('Stamina'))?.replace('Stamina', '').trim() || '';
        const strength = player_attr_grid1.find(s => s.includes('Strength'))?.replace('Strength', '').trim() || '';
        const long_shots = player_attr_grid1.find(s => s.includes('Long shots'))?.replace('Long shots', '').trim() || '';

        // mentality
        // aggression,interceptions,positioning,vision,penalties,composure,
        const aggression = player_attr_grid2.find(s => s.includes('Aggression'))?.replace('Aggression', '').trim() || '';
        const interceptions = player_attr_grid2.find(s => s.includes('Interceptions'))?.replace('Interceptions', '').trim() || '';
        const positioning = player_attr_grid2.find(s => s.includes('Att. Position'))?.replace('Att. Position', '').trim() || '';
        const vision = player_attr_grid2.find(s => s.includes('Vision'))?.replace('Vision', '').trim() || '';
        const penalties = player_attr_grid2.find(s => s.includes('Penalties'))?.replace('Penalties', '').trim() || '';
        const composure = player_attr_grid2.find(s => s.includes('Composure'))?.replace('Composure', '').trim() || '';

        // defending
        // defensive_awareness,standing_tackle,sliding_tackle,
        const defensive_awareness = player_attr_grid2.find(s => s.includes('Defensive awareness'))?.replace('Defensive awareness', '').trim() || '';
        const standing_tackle = player_attr_grid2.find(s => s.includes('Standing tackle'))?.replace('Standing tackle', '').trim() || '';
        const sliding_tackle = player_attr_grid2.find(s => s.includes('Sliding tackle'))?.replace('Sliding tackle', '').trim() || '';

        // goalkeeping
        // gk_diving,gk_handling,gk_kicking,gk_positioning,gk_reflexes
        const gk_diving = player_attr_grid2.find(s => s.includes('GK Diving'))?.replace('GK Diving', '').trim() || '';
        const gk_handling = player_attr_grid2.find(s => s.includes('GK Handling'))?.replace('GK Handling', '').trim() || '';
        const gk_kicking = player_attr_grid2.find(s => s.includes('GK Kicking'))?.replace('GK Kicking', '').trim() || '';
        const gk_positioning = player_attr_grid2.find(s => s.includes('GK Positioning'))?.replace('GK Positioning', '').trim() || '';
        const gk_reflexes = player_attr_grid2.find(s => s.includes('GK Reflexes'))?.replace('GK Reflexes', '').trim() || '';

        // play_styles
        const index_play_styles = $(grids[3]).find('h5').map((i, el) => $(el).text().includes('PlayStyles')).get().indexOf(true);
        let play_styles_array = [];
        if (index_play_styles >= 0) {
            play_styles_array = $($(grids[3]).find('.col')[index_play_styles]).find('p').map((i, el) => $(el).text()).get();
        }
        const play_styles = play_styles_array.join(',');
        return [
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
            play_styles
        ];
    }

    const player_profile_attrs = getPlayerProfile();
    const player_specialities = getPlayerSpecialities();
    const player_club = getPlayerClub();
    const player_national_team = getPlayerNationalTeam();
    const player_attributes = getPlayerAttributes();

    const line_array = [
        player_id,
        version,
        name,
        full_name,
        description,
        image,
        height_cm,
        weight_kg,
        dob,
        position,
        overall_rating,
        potential,
        value,
        wage,
        ...player_profile_attrs,
        ...player_specialities,
        ...player_club,
        ...player_national_team,
        ...player_attributes
    ].map((col) => {
        if (col && col.includes('"')){
            return col.replace(/"/g, '""');
        }
        return col;
    });

    return '"' + line_array.join('","') + '"';
}

module.exports = {
    getPlayerDetailsCsvRow
};
