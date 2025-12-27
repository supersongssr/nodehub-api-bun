import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// Initialize SQLite database
const DATABASE_PATH = process.env.DATABASE_PATH || './data/nodehub.db';

// Create database connection
const sqlite = new Database(DATABASE_PATH);

// Enable foreign keys
sqlite.pragma('foreign_keys = ON');

// Create Drizzle instance
export const db = drizzle(sqlite, { schema });

// Export schema for use in other modules
export * from './schema';
