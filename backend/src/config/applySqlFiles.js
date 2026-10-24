const fs = require('node:fs/promises');
const path = require('node:path');

async function applySqlFiles(directory, label, database, log = console.log) {
    const sqlFiles = (await fs.readdir(directory))
        .filter(file => file.endsWith('.sql'))
        .sort();

    for (const fileName of sqlFiles) {
        const filePath = path.join(directory, fileName);
        const sql = (await fs.readFile(filePath, 'utf8'))
            .replace(/^\s*--.*$/gm, '')
            .trim();

        if (!sql) {
            continue;
        }

        await database.query(sql);
        log(`Applied database ${label}: ${fileName}`);
    }
}

module.exports = applySqlFiles;
