const fs = require('fs');
const {getPlayerDetailsCsvRow} = require('./services/parser');

const playerUrlsFullFile = './files/player-urls-full.csv';
const playerUrlsTestFile = './files/player-urls-test.csv';

const playerDataFullFile = './output/player-data-full.csv';
const playerDataTestFile = './output/player-data-test.csv';

const scanType = process.argv[2];

const row_header = `"player_id","version","name","full_name","description","image","height_cm","weight_kg","dob","positions","overall_rating","potential","value","wage","preferred_foot","weak_foot","skill_moves","international_reputation","work_rate","body_type","real_face","release_clause","specialities","club_id","club_name","club_league_id","club_league_name","club_logo","club_rating","club_position","club_kit_number","club_joined","club_contract_valid_until","country_id","country_name","country_league_id","country_league_name","country_flag","country_rating","country_position","country_kit_number","crossing","finishing","heading_accuracy","short_passing","volleys","dribbling","curve","fk_accuracy","long_passing","ball_control","acceleration","sprint_speed","agility","reactions","balance","shot_power","jumping","stamina","strength","long_shots","aggression","interceptions","positioning","vision","penalties","composure","defensive_awareness","standing_tackle","sliding_tackle","gk_diving","gk_handling","gk_kicking","gk_positioning","gk_reflexes","play_styles"\n`;

async function download(fileToRead, fileToWrite) {
    const playerUrlList = fs.readFileSync(fileToRead).toString().trim().split('\n');
    fs.writeFileSync(fileToWrite, row_header, {flag: 'w'});

    let count = 0;
    console.time('scan complete');
    for (let url of playerUrlList) {
        let row = await getPlayerDetailsCsvRow(url);
        fs.writeFileSync(fileToWrite, row + '\n', {flag: 'a'});
        console.log((++count) + '-' + url);
    }
    console.timeEnd('scan complete');
}

(async function start() {
    const isFullScan = scanType === 'full';
    
    if (isFullScan){
        console.log('running full scan.')
    } else {
        console.log('running test scan.')
    }

    let fileToRead = isFullScan ? playerUrlsFullFile : playerUrlsTestFile;
    let fileToWrite = isFullScan ? playerDataFullFile : playerDataTestFile;

    await download(fileToRead, fileToWrite);
}());
