-- ============================================================
-- BalloonBase — Additional Schema Additions
-- Run these in your Supabase SQL editor
-- PREREQUISITE: profiles table must exist with an is_admin BOOLEAN column.
--   If not already present: ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;
-- ============================================================

-- Reusable trigger function for auto-updating updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- INSPIRATION HUB
-- ============================================================

CREATE TABLE IF NOT EXISTS inspiration_posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform  TEXT NOT NULL DEFAULT 'instagram', -- instagram | tiktok | pinterest | facebook
  source_url       TEXT,
  external_post_id TEXT,
  creator_handle   TEXT NOT NULL,
  creator_display_name TEXT NOT NULL,
  thumbnail_url    TEXT,
  media_type       TEXT NOT NULL DEFAULT 'image', -- image | video | carousel
  caption_snippet  TEXT NOT NULL DEFAULT '',
  tags             TEXT[] NOT NULL DEFAULT '{}',
  colour_palette   TEXT[] NOT NULL DEFAULT '{}',  -- hex values e.g. '#F9C4D4'
  occasion         TEXT NOT NULL DEFAULT 'Birthday',
  style_tags       TEXT[] NOT NULL DEFAULT '{}',
  attribution_required BOOLEAN NOT NULL DEFAULT true,
  status           TEXT NOT NULL DEFAULT 'published', -- published | draft | hidden
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS inspiration_saves (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id          UUID NOT NULL REFERENCES inspiration_posts(id) ON DELETE CASCADE,
  collection_name  TEXT NOT NULL DEFAULT 'Saved',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, post_id)
);

-- RLS for inspiration_posts (public read)
ALTER TABLE inspiration_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspiration_posts_public_read" ON inspiration_posts
  FOR SELECT USING (status = 'published');
CREATE POLICY "inspiration_posts_admin_all" ON inspiration_posts
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- RLS for inspiration_saves (user owns their saves)
ALTER TABLE inspiration_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "inspiration_saves_user" ON inspiration_saves
  FOR ALL USING (user_id = auth.uid());

-- ============================================================
-- STOREFRONT
-- ============================================================

CREATE TABLE IF NOT EXISTS storefronts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  slug             TEXT NOT NULL UNIQUE,
  business_name    TEXT NOT NULL DEFAULT '',
  tagline          TEXT NOT NULL DEFAULT '',
  logo_url         TEXT,
  hero_url         TEXT,
  brand_primary    TEXT NOT NULL DEFAULT '#F05000',
  brand_accent     TEXT NOT NULL DEFAULT '#1A1A1A',
  enquiry_mode     TEXT NOT NULL DEFAULT 'enquire', -- enquire | book
  show_prices      BOOLEAN NOT NULL DEFAULT true,
  collect_deposit  BOOLEAN NOT NULL DEFAULT false,
  published        BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_packages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id    UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  title            TEXT NOT NULL,
  description      TEXT NOT NULL DEFAULT '',
  starting_price   NUMERIC(10,2),
  fixed_price      NUMERIC(10,2),
  tags             TEXT[] NOT NULL DEFAULT '{}',
  occasion         TEXT NOT NULL DEFAULT 'Other',
  image_url        TEXT,
  visible          BOOLEAN NOT NULL DEFAULT true,
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_testimonials (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id    UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  author_name      TEXT NOT NULL,
  body             TEXT NOT NULL,
  occasion         TEXT,
  rating           INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  sort_order       INTEGER NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS storefront_leads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  storefront_id    UUID NOT NULL REFERENCES storefronts(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  email            TEXT NOT NULL,
  phone            TEXT,
  event_date       DATE,
  package_id       UUID REFERENCES storefront_packages(id),
  message          TEXT,
  colours          TEXT[] NOT NULL DEFAULT '{}',
  occasion         TEXT,
  status           TEXT NOT NULL DEFAULT 'new', -- new | contacted | booked | closed
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for storefronts (public read for published, owner can write)
ALTER TABLE storefronts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storefronts_public_read" ON storefronts
  FOR SELECT USING (published = true);
CREATE POLICY "storefronts_owner_all" ON storefronts
  FOR ALL USING (user_id = auth.uid());

-- RLS for storefront_packages (public read visible, owner can write)
ALTER TABLE storefront_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storefront_packages_public_read" ON storefront_packages
  FOR SELECT USING (
    visible = true AND
    EXISTS (SELECT 1 FROM storefronts WHERE id = storefront_id AND published = true)
  );
CREATE POLICY "storefront_packages_owner_all" ON storefront_packages
  FOR ALL USING (
    EXISTS (SELECT 1 FROM storefronts WHERE id = storefront_id AND user_id = auth.uid())
  );

-- RLS for storefront_testimonials (public read)
ALTER TABLE storefront_testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storefront_testimonials_public_read" ON storefront_testimonials
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM storefronts WHERE id = storefront_id AND published = true)
  );
CREATE POLICY "storefront_testimonials_owner_all" ON storefront_testimonials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM storefronts WHERE id = storefront_id AND user_id = auth.uid())
  );

-- RLS for storefront_leads (only owner can read, anyone can insert)
ALTER TABLE storefront_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "storefront_leads_insert" ON storefront_leads
  FOR INSERT WITH CHECK (true);
CREATE POLICY "storefront_leads_owner_read" ON storefront_leads
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM storefronts WHERE id = storefront_id AND user_id = auth.uid())
  );

-- ============================================================
-- STOREFRONT — additional columns (run if table already exists)
-- ============================================================

ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS template TEXT NOT NULL DEFAULT 'studio';
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] NOT NULL DEFAULT '{}';
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS contact_email TEXT;
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS contact_phone TEXT;
ALTER TABLE storefronts ADD COLUMN IF NOT EXISTS instagram_handle TEXT;

-- ============================================================
-- updated_at TRIGGERS
-- ============================================================

CREATE TRIGGER trg_inspiration_posts_updated_at
  BEFORE UPDATE ON inspiration_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_storefronts_updated_at
  BEFORE UPDATE ON storefronts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_storefront_packages_updated_at
  BEFORE UPDATE ON storefront_packages
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_inspiration_posts_status ON inspiration_posts(status);
CREATE INDEX IF NOT EXISTS idx_inspiration_posts_occasion ON inspiration_posts(occasion);
CREATE INDEX IF NOT EXISTS idx_inspiration_saves_user ON inspiration_saves(user_id);
CREATE INDEX IF NOT EXISTS idx_storefronts_slug ON storefronts(slug);
CREATE INDEX IF NOT EXISTS idx_storefront_packages_storefront ON storefront_packages(storefront_id);
CREATE INDEX IF NOT EXISTS idx_storefront_leads_storefront ON storefront_leads(storefront_id);
