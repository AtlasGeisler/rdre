import Database from "better-sqlite3";
import path from "path";
import { runSeed } from "./seed";

const DB_PATH = path.join(process.cwd(), "data", "rdre.db");

const db = new Database(DB_PATH);

// Enable WAL mode for performance
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Create schema
db.exec(`
CREATE TABLE IF NOT EXISTS gp_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  practice_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  specialty TEXT DEFAULT 'General Dentistry',
  tier TEXT DEFAULT 'prospect' CHECK(tier IN ('champion','consistent','occasional','new','dormant','prospect')),
  referral_count INTEGER DEFAULT 0,
  last_referral_date TEXT,
  first_referral_date TEXT,
  notes TEXT,
  relationship_score REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS referral_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gp_id INTEGER NOT NULL REFERENCES gp_profiles(id),
  patient_hash TEXT NOT NULL,
  procedure_type TEXT NOT NULL,
  tooth_number TEXT,
  date_of_service TEXT NOT NULL,
  outcome TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pulse_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gp_id INTEGER NOT NULL REFERENCES gp_profiles(id),
  referral_event_id INTEGER REFERENCES referral_events(id),
  script_text TEXT,
  video_url TEXT,
  email_sent_at TEXT,
  email_opened_at TEXT,
  status TEXT DEFAULT 'draft' CHECK(status IN ('draft','ready','sent','opened')),
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS relationship_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  gp_id INTEGER NOT NULL REFERENCES gp_profiles(id),
  note_type TEXT DEFAULT 'personal' CHECK(note_type IN ('personal','clinical','administrative')),
  content TEXT NOT NULL,
  author TEXT DEFAULT 'Dr. Geisler',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS waitlist (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS video_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,
  pulse_id INTEGER NOT NULL REFERENCES pulse_events(id),
  gp_email TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  viewed_at TEXT,
  view_count INTEGER DEFAULT 0,
  revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

// Seed on startup
runSeed(db);

export default db;
