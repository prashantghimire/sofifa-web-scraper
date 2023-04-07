const {loadAllPlayerIds, getAllPlayerDetailById} = require('./services/sofifa');
const readline = require('readline');
const fs = require('fs');
const Papa = require('papaparse');
const log = require('loglevel');

const cliProgress = require('cli-progress');
const bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);

let playersDataFilePath = './output/player_data.csv';
let playerIdsFilePath = './output/player_ids.csv';

(async function () {
    await loadAllPlayerIds({testScan: false}); // pass {testScan: true} for scanning few players

    let playerIdList = fs.readFileSync(playerIdsFilePath).toString().trim().split('\n');
    bar.start(playerIdList.length, 0);

    const playerList = [];

    let count = 0;
    for await (const playerId of playerIdList) {
        try {
            const playerDetails = await getAllPlayerDetailById(playerId);
            playerList.push(playerDetails);
            bar.update(++count);
        } catch (e) {
            log.error(`failed to get playerId=${playerId}`);
        }
    }

    const content = Papa.unparse(playerList);
    fs.writeFileSync(playersDataFilePath, content);
    bar.stop();

}());