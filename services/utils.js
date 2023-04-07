const format = require('date-format');

const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format('yyyy-MM-dd', date);
};

module.exports = {formatDate};