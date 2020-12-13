const fs = require('fs-extra');
const csv = require('csv-parse');
const path = require('path');

const COUNTRY_NAME = 'United States';
const STATE_NAMES_INCLUDE = ['Minnesota'];

(async () => {
    const parseCsv = async (raw) => await new Promise((resolve, reject) =>
        csv(raw, (err, content) => err ? reject(err) : resolve(content))) as Array<any>;

    const locationCodes = await (async () => {
        const mapping = {country_name: 5, state_name: 7, id: 0}
        const raw = await fs.readFile(path.join(__dirname, '../GeoLite2-City-Locations-en.csv'));

        return (await parseCsv(raw))
            .filter(row =>
                row[mapping.country_name] === COUNTRY_NAME &&
                STATE_NAMES_INCLUDE.includes(row[mapping.state_name]))
            .map(row => row[mapping.id]);
    })();

    const mapping = {network: 0, id: 1};
    const raw = await fs.readFile(path.join(__dirname, '../GeoLite2-City-Blocks-IPv4.csv'));
    const ipRanges = (await parseCsv(raw))
        .filter(row => locationCodes.includes(row[mapping.id]))
        .map(row => row[mapping.network]);

    await fs.writeJSON(path.join(__dirname, '../ranges.json'), ipRanges);
    console.log(`Done! Wrote ${ipRanges.length} ranges from ${ STATE_NAMES_INCLUDE.join(', ') }`);
})();
