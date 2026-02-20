const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');

async function getDb() {
    const db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    // Cria a tabela se não existir
    await db.exec(`
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            gtin TEXT UNIQUE,
            name TEXT,
            brand TEXT,
            ncm TEXT,
            price REAL,
            stock INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);

    return db;
}

module.exports = getDb;