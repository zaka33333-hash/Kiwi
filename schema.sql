-- Kiwi Live Link — Cloudflare D1 schema.
-- Apply once after creating the D1 database (see LIVE_LINK.md):
--   wrangler d1 execute kiwi-sales --file=schema.sql --remote
-- or paste it into the D1 console in the Cloudflare dashboard.

CREATE TABLE IF NOT EXISTS sales (
  id       TEXT PRIMARY KEY,   -- client-supplied unique id
  merchant TEXT NOT NULL,      -- tenant key (one value for the pilot)
  amount   INTEGER NOT NULL,   -- MAD, whole dirhams
  method   TEXT NOT NULL,      -- cash | card | tap | qr | wallet
  label    TEXT,               -- "À emporter #12", "Table 4", …
  ref      TEXT,               -- caisse receipt ref
  ts       INTEGER NOT NULL    -- epoch ms of the sale
);

-- The dashboard polls "WHERE merchant = ? AND rowid > ?"; index it.
CREATE INDEX IF NOT EXISTS idx_sales_merchant_rowid ON sales (merchant, rowid);
