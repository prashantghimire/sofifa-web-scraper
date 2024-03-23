const Humanoid = require('humanoid-js');
const humanoid = new Humanoid();

const readPage = async (url) => {
    try {
        const response = await humanoid.get(url);
        if (response.statusCode !== 200) {
            console.log('Error occurred while fetching data');
            return;
        }
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(response.body);
            }, 300);
        });
    } catch (err) {
        console.log('error = ', err);
        throw new Error('Cannot read page: ' + url);
    }
};

module.exports = {readPage};