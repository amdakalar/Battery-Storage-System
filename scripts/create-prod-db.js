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

    // Pre-populate with initial 54 batteries if available
    const initialJsonPath = path.join(__dirname, '..', 'src', 'constants', 'initialBatteries.json');
    if (fs.existsSync(initialJsonPath)) {
      try {
        const payload = JSON.parse(fs.readFileSync(initialJsonPath, 'utf8'));
        const batteries = payload.batteries || [];
        console.log(`📦 Pre-seeding ${batteries.length} batteries into production SQLite db...`);

        for (const b of batteries) {
          const cellsJson = b.cells ? JSON.stringify(b.cells) : null;
          db.run(
            `INSERT OR REPLACE INTO batteries (id, name, category, lastChargeDate, reminderIntervalDays, voltage, notes, cells_json, createdAt)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              b.id,
              b.name,
              b.category,
              b.lastChargeDate,
              b.reminderIntervalDays || 40,
              b.voltage || null,
              b.notes || null,
              cellsJson,
              b.createdAt || new Date().toISOString(),
            ]
          );

          if (b.history && Array.isArray(b.history)) {
            for (const h of b.history) {
              db.run(
                `INSERT OR REPLACE INTO charge_history (id, batteryId, chargeDate, chargeTime, daysSincePrevious, notes, percentage)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                  h.id,
                  b.id,
                  h.chargeDate,
                  h.chargeTime || null,
                  h.daysSincePrevious || null,
                  h.notes || null,
                  h.percentage || null,
                ]
              );
            }
          }
        }
      } catch (e) {
        console.warn('Warning pre-seeding initial batteries:', e.message);
      }
    }

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
