const {writePlayersData} = require('./services/sofifa');
(async function () {
    await writePlayersData();
}());