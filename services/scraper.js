const Humanoid = require('humanoid-js');
const humanoid = new Humanoid();

/**
 * This method will read the content of any webpage.
 * @param url
 * @returns {Promise<String>}
 */
const getPageContent = async (url) => {
    console.log('scraping url=' + url)
    const response = await humanoid.get(url);
    if (response.statusCode !== 200) {
        throw new Error(`Error reading page=${url}, statusCode=${response.statusCode}`);
    }
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(response.body);
        }, 300);
    });
};

module.exports = {
    getPageContent
};