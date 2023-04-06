const {loadAllPlayerIds, getAllPlayerDetailById} = require('./services/sofifa');
const readline = require('readline');
const fs = require('fs');
const Papa = require('papaparse');

(async function () {
    // await loadAllPlayerIds({testScan: true});

    const rl = readline.createInterface({
        input: fs.createReadStream('./output/player_list.csv', {encoding: 'utf8'}), crlfDelay: Infinity,
    });

    const playerList = [];

    for await (const line of rl) {
        const d = await getAllPlayerDetailById(line);
        playerList.push(d);
    }

    const columNames = Object.keys(playerList[0]).keys();

    for (let player of playerList) {

    }


}());