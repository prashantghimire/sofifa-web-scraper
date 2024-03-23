const fs = require('fs');
const {getPlayerDetailsRow} = require('./download');

const playerIdsFile = './player-ids.csv';
const playerDataFile = './player-data.csv';

const row_header = `"player_id","version","full_name","description","image","height","weight","dob","positions","overall_rating","potential","value","wage","preferred_foot","weak_foot","skill_moves","international_reputation","work_rate","body_type","real_face","release_clause","specialities","club_id","club_name","club_league_id","club_league_name","club_logo","club_rating","club_position","club_kit_number","club_joined","club_contract_valid_until","country_id","country_name","country_league_id","country_league_name","country_flag","country_rating","country_position","country_kit_number","crossing","finishing","heading_accuracy","short_passing","volleys","dribbling","curve","fk_accuracy","long_passing","ball_control","acceleration","sprint_speed","agility","reactions","balance","shot_power","jumping","stamina","strength","long_shots","aggression","interceptions","positioning","vision","penalties","composure","defensive_awareness","standing_tackle","sliding_tackle","gk_diving","gk_handling","gk_kicking","gk_positioning","gk_reflexes","play_styles"\n`;
fs.writeFileSync(playerDataFile, row_header, {flag: 'w'});

async function appendToPlayerDataFile(url) {
    let row = await getPlayerDetailsRow(url);
    fs.writeFileSync(playerDataFile, row + '\n', {flag: 'a'});
}

(async function start() {
    let count = 0;
    console.time('test')
    const playerUrlList = fs.readFileSync(playerIdsFile).toString().trim().split('\n');
    for (let url of playerUrlList) {
        await appendToPlayerDataFile(url);
        console.log((++count) + "-" + url);
    }
    console.timeEnd('test')
}());
