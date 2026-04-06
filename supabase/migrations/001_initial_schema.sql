-- Transient v1: Complete Postgres Schema
-- Target: Supabase (Postgres 15+)

CREATE TABLE works (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title           text NOT NULL,
  original_title  text,
  creators        jsonb NOT NULL DEFAULT '[]',
  year_written    int,
  creation_method text NOT NULL DEFAULT 'scripted'
                    CHECK (creation_method IN ('scripted', 'devised', 'other')),
  media_type      text NOT NULL DEFAULT 'theatre'
                    CHECK (media_type IN ('theatre', 'musical', 'opera', 'dance', 'circus', 'concert', 'other')),
  description     text,
  adapted_from    uuid REFERENCES works(id),
  external_ids    jsonb NOT NULL DEFAULT '{}',
  search_vector   tsvector GENERATED ALWAYS AS (
                    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(original_title, '') || ' ' || coalesce(description, ''))
                  ) STORED,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_works_search ON works USING GIN (search_vector);
CREATE INDEX idx_works_adapted_from ON works(adapted_from);
CREATE INDEX idx_works_media_type ON works(media_type);

CREATE TABLE productions (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  work_id         uuid REFERENCES works(id),
  title_override  text,
  company         text,
  venue           text,
  director        text,
  cast_members    jsonb NOT NULL DEFAULT '[]',
  year            int,
  start_date      date,
  end_date        date,
  poster_url      text,
  is_touring      boolean NOT NULL DEFAULT false,
  external_ids    jsonb NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_productions_work_id ON productions(work_id);
CREATE INDEX idx_productions_year ON productions(year);
CREATE INDEX idx_productions_venue ON productions(venue);

CREATE TABLE log_entries (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  production_id   uuid NOT NULL REFERENCES productions(id),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  date_seen       date NOT NULL DEFAULT CURRENT_DATE,
  rating          numeric(2,1) CHECK (
                    rating IS NULL OR
                    (rating >= 0.5 AND rating <= 5.0 AND (rating * 2) = FLOOR(rating * 2))
                  ),
  review          text,
  is_private      boolean NOT NULL DEFAULT true,
  liked           boolean NOT NULL DEFAULT false,
  tags            text[] NOT NULL DEFAULT '{}',
  is_rewatch      boolean NOT NULL DEFAULT false,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_log_entries_user_date ON log_entries(user_id, date_seen DESC);
CREATE INDEX idx_log_entries_production ON log_entries(production_id);
CREATE INDEX idx_log_entries_user_id ON log_entries(user_id);
CREATE INDEX idx_log_entries_tags ON log_entries USING GIN (tags);

CREATE TABLE wishlist_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id),
  work_id         uuid REFERENCES works(id),
  production_id   uuid REFERENCES productions(id),
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT wishlist_target CHECK (
    (work_id IS NOT NULL AND production_id IS NULL) OR
    (work_id IS NULL AND production_id IS NOT NULL)
  )
);

CREATE INDEX idx_wishlist_user ON wishlist_items(user_id);

ALTER TABLE works ENABLE ROW LEVEL SECURITY;
ALTER TABLE productions ENABLE ROW LEVEL SECURITY;
ALTER TABLE log_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Works are publicly readable"
  ON works FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create works"
  ON works FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update works"
  ON works FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Productions are publicly readable"
  ON productions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create productions"
  ON productions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update productions"
  ON productions FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can read own or public log entries"
  ON log_entries FOR SELECT
  USING (user_id = auth.uid() OR is_private = false);
CREATE POLICY "Users can insert own log entries"
  ON log_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own log entries"
  ON log_entries FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own log entries"
  ON log_entries FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own wishlist"
  ON wishlist_items FOR ALL
  USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER works_updated_at
  BEFORE UPDATE ON works
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER productions_updated_at
  BEFORE UPDATE ON productions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER log_entries_updated_at
  BEFORE UPDATE ON log_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
