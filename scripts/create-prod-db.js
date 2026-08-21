const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');

async function createDatabase() {
  console.log('📦 Creating clean production SQLite database schema...');
  try {
    const SQL = await initSqlJs();
    const db = new SQL.Database();

    // Create schema
    db.run(`
      CREATE TABLE IF NOT EXISTS batteries (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        lastChargeDate TEXT NOT NULL,
        reminderIntervalDays INTEGER NOT NULL DEFAULT 40,
        voltage REAL,
        notes TEXT,
        cells_json TEXT,
        createdAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS charge_history (
        id TEXT PRIMARY KEY,
        batteryId TEXT NOT NULL,
        chargeDate TEXT NOT NULL,
        chargeTime TEXT,
        daysSincePrevious INTEGER,
        notes TEXT,
        percentage REAL,
        FOREIGN KEY (batteryId) REFERENCES batteries (id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_charge_history_batteryId ON charge_history (batteryId);
      CREATE INDEX IF NOT EXISTS idx_batteries_createdAt ON batteries (createdAt DESC);
    `);

    const data = db.export();
    const buffer = Buffer.from(data);
    
    const outputPath = path.join(__dirname, '..', 'public', 'app.db');
    fs.writeFileSync(outputPath, buffer);
    console.log(`✅ Production database created successfully at: ${outputPath}`);
  } catch (error) {
    console.error('❌ Failed to create production database:', error);
    process.exit(1);
  }
}

createDatabase();
