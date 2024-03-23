const format = require('date-format');

const formatDate = (dateStr) => {
    try {
        const date = new Date(dateStr);
        return format('yyyy-MM-dd', date);
    } catch (e) {
        console.error('date parse failed for value=' + dateStr);
        return '';
    }
};

module.exports = {formatDate};