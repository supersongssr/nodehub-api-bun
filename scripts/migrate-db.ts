#!/usr/bin/env bun
/**
 * Database Migration Script
 * Executes generated migration files on SQLite database
 */

import Database from 'bun:sqlite';
import { readdirSync, readFileSync, existsSync } from 'fs';
import { resolve, join } from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/nodehub.db';
const MIGRATIONS_DIR = resolve(process.cwd(), 'drizzle');

console.log('🔄 Running database migrations...');
console.log(`📂 Database: ${DATABASE_PATH}`);
console.log(`📁 Migrations: ${MIGRATIONS_DIR}`);

// Create database connection
const sqlite = new Database(DATABASE_PATH);

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON');

// Create migrations tracking table if not exists
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS __drizzle_migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    hash TEXT NOT NULL UNIQUE,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  )
`);

// Get executed migrations
const executedMigrations = sqlite.prepare('SELECT hash FROM __drizzle_migrations').all() as { hash: string }[];
const executedHashes = new Set(executedMigrations.map(m => m.hash));

// Read migration files
if (!existsSync(MIGRATIONS_DIR)) {
  console.log('ℹ️  No migrations directory found');
  sqlite.close();
  process.exit(0);
}

const migrationFiles = readdirSync(MIGRATIONS_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`📋 Found ${migrationFiles.length} migration files`);

let executedCount = 0;

for (const file of migrationFiles) {
  const filePath = join(MIGRATIONS_DIR, file);
  const content = readFileSync(filePath, 'utf-8');

  // Create hash from filename (simplified)
  const hash = file.replace('.sql', '');

  if (executedHashes.has(hash)) {
    console.log(`⊘ ${file} - already executed`);
    continue;
  }

  console.log(`▶️  Running ${file}...`);

  try {
    // Split by semicolon and execute each statement
    const statements = content
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    for (const statement of statements) {
      sqlite.exec(statement);
    }

    // Mark as executed
    sqlite.prepare('INSERT INTO __drizzle_migrations (hash) VALUES (?)').run(hash);
    executedCount++;
    console.log(`✅ ${file} - completed`);
  } catch (error: any) {
    console.error(`❌ ${file} - failed: ${error.message}`);
    sqlite.close();
    process.exit(1);
  }
}

sqlite.close();

console.log('');
console.log(`✅ Migrations completed: ${executedCount} new`);
console.log('');
