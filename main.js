const {getAllPlayerIds, getAllPlayerDetailById} = require('./services/sofifa');

(async function () {
    await getAllPlayerIds({testScan: true});
    const d = await getAllPlayerDetailById(158023);
    console.log(d);
}());