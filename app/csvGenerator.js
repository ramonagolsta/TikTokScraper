const { createObjectCsvWriter } = require('csv-writer');

async function generateCSV(records, outputPath) {
    const csvWriter = createObjectCsvWriter({
        path: outputPath,
        header: [
            { id: 'userLink', title: 'User Link' },
            { id: 'followersCount', title: 'Followers Count' },
            { id: 'likesCount', title: 'Likes Count' },
            { id: 'viewsCount', title: 'Views Count for Last 5 Videos' },
            { id: 'videoDetails', title: 'Like Count for Last 5 Videos' },
        ],
    });

    await csvWriter.writeRecords(records);
    console.log('Data has been written to the CSV file');
}

module.exports = {
    generateCSV,
};
