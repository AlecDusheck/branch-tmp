const {execFile} = require('child_process');
const fs = require('fs-extra');
const path = require('path');


const RATE = 1000;

const GET_PORT = /port (.*?)\//;
const GET_IP = /on (.*?) /;

(async () => {
    const ranges = await fs.readJSON(path.join(__dirname, '../ranges.json'));
    let results: Array<{ip: string, port: string}> = [];

    console.log(`Loaded ${ranges.length} ranges.`);

    for (let i = 0; i < ranges.length; i++) {
        const range = ranges[i];
        console.log('Scanning ' + range);
        const args = [range, '--rate', RATE, '-p', '80,8080'];

        try {
            const stdout = await new Promise((resolve, reject) =>
                execFile('masscan', args, (err, output) => err ? reject(err) : resolve(output))) as string;

            const ports = stdout.split('\n').filter(x => x.includes('/tcp')).map(x => {
                return {
                    ip: GET_IP.exec(x)?.[1] || '',
                    port: GET_PORT.exec(x)?.[1] || '',
                }
            })

            results = [...results, ...ports];
            await fs.writeJson(path.join(__dirname, '../ips.json'), results);
            console.log(`Write total of ${results.length} ips.`);
        } catch (e) {
            // Oops... whatever
            console.log('Failed scanning ' + range);
            console.log(e);
        }
        console.log('Finished complete scan.');
    }
})();
