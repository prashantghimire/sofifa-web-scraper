const axios = require('axios');
const readPage = async (url) => {
    try {
        const config = {
            headers: {
                'User-Agent':
                    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36',
            },
        };

        const response = await axios.get(url, config);

        if (response.status !== 200) {
            console.log('Error occurred while fetching data');
            return;
        }
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve(response.data);
            }, 300);
        });
    } catch (err) {
        console.log('error = ', err);
        throw new Error('Cannot read page: ' + url);
    }
};

module.exports = {readPage};