-- Extend restaurants table with detail-page fields
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS cuisine        TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS address        TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS phone          TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS hours          TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS rating         NUMERIC(2,1) DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS review_count   INTEGER DEFAULT 0;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS price_per_two  INTEGER;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS features       TEXT[];
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS photos         TEXT[];

-- Extend stores table with detail-page fields
ALTER TABLE stores ADD COLUMN IF NOT EXISTS address       TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS phone         TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS hours         TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS tagline       TEXT;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS rating        NUMERIC(2,1) DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS review_count  INTEGER DEFAULT 0;
ALTER TABLE stores ADD COLUMN IF NOT EXISTS photos        TEXT[];

-- Restaurant offers
CREATE TABLE IF NOT EXISTS restaurant_offers (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  code          TEXT,
  logo_url      TEXT,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Restaurant menu items
CREATE TABLE IF NOT EXISTS restaurant_menu_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category      TEXT NOT NULL DEFAULT 'Food',
  name          TEXT NOT NULL,
  description   TEXT,
  price         INTEGER,
  image_url     TEXT,
  is_veg        BOOLEAN NOT NULL DEFAULT FALSE,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order    INTEGER NOT NULL DEFAULT 0
);

-- Store offers
CREATE TABLE IF NOT EXISTS store_offers (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id   UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  description TEXT,
  code       TEXT,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Store products
CREATE TABLE IF NOT EXISTS store_products (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id         UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  description      TEXT,
  original_price   INTEGER,
  discounted_price INTEGER,
  image_url        TEXT,
  is_active        BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order       INTEGER NOT NULL DEFAULT 0
);

-- Row Level Security
ALTER TABLE restaurant_offers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_offers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_products        ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY IF NOT EXISTS "public_read_restaurant_offers"
  ON restaurant_offers FOR SELECT USING (is_active = TRUE);

CREATE POLICY IF NOT EXISTS "public_read_restaurant_menu_items"
  ON restaurant_menu_items FOR SELECT USING (is_active = TRUE);

CREATE POLICY IF NOT EXISTS "public_read_store_offers"
  ON store_offers FOR SELECT USING (is_active = TRUE);

CREATE POLICY IF NOT EXISTS "public_read_store_products"
  ON store_products FOR SELECT USING (is_active = TRUE);
