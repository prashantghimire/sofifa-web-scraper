const {loadAllPlayerIds, getAllPlayerDetailById} = require('./services/sofifa');
const readline = require('readline');
const fs = require('fs');
const Papa = require('papaparse');
const log = require('loglevel');

(async function () {
    await loadAllPlayerIds({testScan: true}); // pass {testScan: true} for scanning few players
    const playerIdList = readline.createInterface({
        input: fs.createReadStream('./output/player_ids.csv', {encoding: 'utf8'}), crlfDelay: Infinity,
    });

    const playerList = [];

    for await (const playerId of playerIdList) {
        try {
            const playerDetails = await getAllPlayerDetailById(playerId);
            playerList.push(playerDetails);
        } catch (e) {
            log.error(`failed to get playerId=${playerId}`);
        }

    }

    const content = Papa.unparse(playerList);
    fs.writeFileSync('./output/player_data.csv', content);

}());