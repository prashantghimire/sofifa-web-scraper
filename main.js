const {writePlayersData} = require('./services/sofifa');
(async function () {
    const args = process.argv.slice(2);
    const runArg = args[0];
    if (runArg === '--test') {
        console.log('downloading test players data.');
        await writePlayersData({testScan: true});
    } else if (runArg === '--full') {
        console.log('downloading all players data.');
        await writePlayersData({testScan: false});
    }
}());