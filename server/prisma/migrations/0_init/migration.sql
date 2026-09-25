-- =============================================================================
-- Baseline migration: 0_init
-- =============================================================================
-- This migration file represents the existing PostgreSQL schema created by
-- server/src/db-pg.js at application startup.
--
-- The database already contains these tables. This file exists ONLY as a
-- baseline record for Prisma's migration history. It should NOT be re-run.
--
-- To mark this baseline as applied without touching the database, run:
--   npx prisma migrate resolve --applied "0_init"
--
-- Then run: npx prisma generate
-- =============================================================================

-- users
CREATE TABLE IF NOT EXISTS users (
  id                    VARCHAR(255) PRIMARY KEY,
  email                 VARCHAR(255) UNIQUE NOT NULL,
  password_hash         TEXT NOT NULL,
  full_name             VARCHAR(255),
  role                  VARCHAR(50)  DEFAULT 'user',
  account_type          VARCHAR(50)  DEFAULT 'event_planner',
  company_name          VARCHAR(255),
  email_verified        BOOLEAN      DEFAULT false,
  otp                   VARCHAR(255),
  otp_expires           BIGINT,
  otp_attempts          INT          DEFAULT 0,
  failed_login_attempts INT          DEFAULT 0,
  lockout_until         BIGINT       DEFAULT 0,
  reset_token           VARCHAR(255),
  reset_token_expires   BIGINT,
  token_version         INT          DEFAULT 0,
  created_at            TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- vendors
CREATE TABLE IF NOT EXISTS vendors (
  id                VARCHAR(255) PRIMARY KEY,
  user_id           VARCHAR(255) REFERENCES users(id) ON DELETE SET NULL,
  name              VARCHAR(255) NOT NULL,
  category          VARCHAR(100),
  city              VARCHAR(100),
  rating            NUMERIC(3,2)  DEFAULT 5.0,
  reviews           INT           DEFAULT 0,
  price             VARCHAR(100),
  price_value       NUMERIC(12,2) DEFAULT 0,
  description       TEXT,
  services          JSONB         DEFAULT '[]',
  service_offerings JSONB         DEFAULT '[]',
  gallery           JSONB         DEFAULT '[]',
  contact           JSONB         DEFAULT '{}',
  response_time     VARCHAR(100),
  availability      VARCHAR(100),
  verified          BOOLEAN       DEFAULT false,
  is_available      BOOLEAN       DEFAULT true,
  match             INT           DEFAULT 90,
  image             TEXT,
  accent            VARCHAR(255),
  review            TEXT,
  blocked_dates     JSONB         DEFAULT '[]',
  commission_rate   NUMERIC(5,2)  DEFAULT 8.0,
  created_at        TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

-- bookings
CREATE TABLE IF NOT EXISTS bookings (
  id                VARCHAR(255) PRIMARY KEY,
  vendor_id         VARCHAR(255) NOT NULL,
  vendor_name       VARCHAR(255),
  category          VARCHAR(100),
  city              VARCHAR(100),
  user_id           VARCHAR(255),
  client_name       VARCHAR(255),
  client_email      VARCHAR(255),
  client_phone      VARCHAR(255),
  planner_name      VARCHAR(255),
  planner_email     VARCHAR(255),
  planner_phone     VARCHAR(255),
  event_type        VARCHAR(255),
  event_date        TIMESTAMPTZ,
  guest_count       INT           DEFAULT 0,
  budget            VARCHAR(100),
  status            VARCHAR(50)   DEFAULT 'Pending',
  paid_amount       NUMERIC(12,2) DEFAULT 0,
  commission_amount NUMERIC(12,2) DEFAULT 0,
  commission_status VARCHAR(50)   DEFAULT 'none',
  notes             TEXT,
  created_at        TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

-- inquiries
CREATE TABLE IF NOT EXISTS inquiries (
  id         VARCHAR(255) PRIMARY KEY,
  vendor_id  VARCHAR(255),
  user_id    VARCHAR(255),
  name       VARCHAR(255),
  email      VARCHAR(255),
  phone      VARCHAR(255),
  message    TEXT,
  event_type VARCHAR(100),
  status     VARCHAR(50)  DEFAULT 'New',
  created_at TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- transactions
CREATE TABLE IF NOT EXISTS transactions (
  id                  VARCHAR(255) PRIMARY KEY,
  user_id             VARCHAR(255) NOT NULL,
  vendor_id           VARCHAR(255),
  vendor              VARCHAR(255),
  amount              NUMERIC(12,2) NOT NULL,
  type                VARCHAR(50)   DEFAULT 'expense',
  category            VARCHAR(100),
  description         TEXT,
  notes               TEXT,
  date                TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP,
  due_date            TIMESTAMPTZ,
  status              VARCHAR(50)   DEFAULT 'Pending',
  invoice             VARCHAR(100),
  method              VARCHAR(50),
  razorpay_order_id   VARCHAR(255),
  razorpay_payment_id VARCHAR(255),
  created_at          TIMESTAMPTZ   DEFAULT CURRENT_TIMESTAMP
);

-- messages
CREATE TABLE IF NOT EXISTS messages (
  id          VARCHAR(255) PRIMARY KEY,
  vendor_id   VARCHAR(255) NOT NULL,
  vendor_name VARCHAR(255),
  user_id     VARCHAR(255) NOT NULL,
  user_name   VARCHAR(255),
  sender      VARCHAR(50)  NOT NULL,
  body        TEXT         NOT NULL,
  created_at  TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- reviews
CREATE TABLE IF NOT EXISTS reviews (
  id           VARCHAR(255) PRIMARY KEY,
  booking_id   VARCHAR(255) UNIQUE NOT NULL,
  vendor_id    VARCHAR(255) NOT NULL,
  user_id      VARCHAR(255) NOT NULL,
  planner_name VARCHAR(255),
  rating       NUMERIC(3,2) NOT NULL,
  comment      TEXT,
  created_at   TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- Application-level indexes (added by Prisma schema)
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_vendors_category     ON vendors(category);
CREATE INDEX IF NOT EXISTS idx_vendors_city         ON vendors(city);
CREATE INDEX IF NOT EXISTS idx_vendors_is_available ON vendors(is_available);
CREATE INDEX IF NOT EXISTS idx_vendors_rating       ON vendors(rating);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_id   ON bookings(vendor_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id     ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status      ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_vendor_status ON bookings(vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_messages_vendor_user ON messages(vendor_id, user_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id     ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_vendor_id   ON messages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id    ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status     ON inquiries(status);
