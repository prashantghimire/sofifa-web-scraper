const Humanoid = require('humanoid-js');
const humanoid = new Humanoid();

const asyncWait = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 * This method will read the content of any webpage.
 * @param url
 * @returns {Promise<String>}
 */
const getPageContent = async (url) => {
    let attempts = 5;
    while (attempts > 0) {
        const response = await humanoid.get(url);
        if (response.statusCode !== 200) {
            console.log(`retrying ... attempt=${attempts}`)
            await asyncWait(1000);
            attempts -= 1;
        } else {
            if (attempts < 5) {
                console.log(`retry successful ... attempt=${attempts}`)
            }
            attempts = 5;
            await asyncWait(300);
            return response.body;
        }
    }
    throw new Error(`Error reading page=${url}, statusCode=${response.statusCode}`);
};

module.exports = {
    getPageContent
};