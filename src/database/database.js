
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

//Create the data directory if it doesn't exist
const dataDirectory = path.join(__dirname, '../../data');
fs.mkdirSync(dataDirectory, { recursive: true });

//Define the database's location
const databasePath = path.join(dataDirectory, 'secureblog.db');

//Connect to SQLite
const db = new sqlite3.Database(databasePath, (error) => {
    if (error) {
        console.error('Database connection failed:', error.message);
    } else {
        console.log('Connected to SecureBlog SQLite database.');
    }
});

//Create the database tables
function initializeDatabase() {
    return new Promise((resolve, reject) => {
        const schema = `
            PRAGMA foreign_keys = ON;

            CREATE TABLE IF NOT EXISTS users (
                user_id INTEGER PRIMARY KEY AUTOINCREMENT,
                display_name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user'
                    CHECK(role IN ('user', 'admin')),
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS posts (
                post_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                content TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(user_id)
                    ON DELETE CASCADE
            );
            CREATE TABLE IF NOT EXISTS security_logs (
                log_id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                event_type TEXT NOT NULL,
                outcome TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,

                FOREIGN KEY (user_id)
                    REFERENCES users(user_id)
                    ON DELETE SET NULL
            );
        `;
        db.exec(schema, (error) => {
            if (error) {
                reject(error);
            } else {
                resolve();
            }
        });
    });
}

module.exports = {
    db,
    initializeDatabase
};
