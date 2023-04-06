const {getAllPlayerIds} = require('./services/sofifa');

(async function () {
    await getAllPlayerIds({testScan: true});
}());