#!/usr/bin/env bun
/**
 * Database Initialization Script
 * Creates SQLite database and runs migrations
 */

import { drizzle } from 'drizzle-orm/bun-sqlite';
import Database from 'bun:sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { existsSync, mkdirSync } from 'fs';
import { resolve } from 'path';

const DATABASE_PATH = process.env.DATABASE_PATH || './data/nodehub.db';

console.log('🔧 Initializing database...');
console.log(`📂 Database path: ${DATABASE_PATH}`);

// Ensure data directory exists
const dbDir = resolve(DATABASE_PATH, '..');
if (!existsSync(dbDir)) {
  console.log(`📁 Creating directory: ${dbDir}`);
  mkdirSync(dbDir, { recursive: true });
}

// Create database connection
const sqlite = new Database(DATABASE_PATH);
console.log('✅ Database connection established');

// Enable foreign keys
sqlite.exec('PRAGMA foreign_keys = ON');
console.log('✅ Foreign keys enabled');

// Create Drizzle instance
const db = drizzle(sqlite);

// Check if migrations folder exists
const migrationsPath = resolve(process.cwd(), 'drizzle');

try {
  // Run migrations
  console.log(`📦 Running migrations from: ${migrationsPath}`);

  await migrate(db, { migrationsFolder: migrationsPath });

  console.log('✅ Migrations completed successfully');
} catch (error: any) {
  if (error.message?.includes('no migrations')) {
    console.log('ℹ️  No migrations found, database will be created on first run');
    console.log('ℹ️  Run "bun run db:generate" to create migration files');
  } else {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

// Close database
sqlite.close();
console.log('✅ Database initialized successfully!');
console.log('');
console.log('Next steps:');
console.log('  1. Start the server: bun run dev');
console.log('  2. Or run in production: bun run start');
