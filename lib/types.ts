export type MediaType = "theatre" | "musical" | "opera" | "dance" | "circus" | "concert" | "other";

export type CreationMethod = "scripted" | "devised" | "other";

export type Creator = {
  name: string;
  role: string;
};

export type CastMember = {
  name: string;
  role: string;
};

export type Work = {
  id: string;
  title: string;
  original_title: string | null;
  creators: Creator[];
  year_written: number | null;
  creation_method: CreationMethod;
  media_type: MediaType;
  description: string | null;
  adapted_from: string | null;
  external_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type Production = {
  id: string;
  work_id: string | null;
  title_override: string | null;
  company: string | null;
  venue: string | null;
  director: string | null;
  cast_members: CastMember[];
  year: number | null;
  start_date: string | null;
  end_date: string | null;
  poster_url: string | null;
  is_touring: boolean;
  external_ids: Record<string, string>;
  created_at: string;
  updated_at: string;
};

export type LogEntry = {
  id: string;
  production_id: string;
  user_id: string;
  date_seen: string;
  rating: number | null;
  review: string | null;
  is_private: boolean;
  liked: boolean;
  tags: string[];
  is_rewatch: boolean;
  created_at: string;
  updated_at: string;
};

export type WishlistItem = {
  id: string;
  user_id: string;
  work_id: string | null;
  production_id: string | null;
  notes: string | null;
  created_at: string;
};

export type WorkInsert = {
  title: string;
  original_title?: string | null;
  creators?: Creator[];
  year_written?: number | null;
  creation_method?: CreationMethod;
  media_type?: MediaType;
  description?: string | null;
  adapted_from?: string | null;
  external_ids?: Record<string, string>;
};

export type ProductionInsert = {
  work_id?: string | null;
  title_override?: string | null;
  company?: string | null;
  venue?: string | null;
  director?: string | null;
  cast_members?: CastMember[];
  year?: number | null;
  start_date?: string | null;
  end_date?: string | null;
  poster_url?: string | null;
  is_touring?: boolean;
  external_ids?: Record<string, string>;
};

export type LogEntryInsert = {
  production_id: string;
  user_id: string;
  date_seen?: string;
  rating?: number | null;
  review?: string | null;
  is_private?: boolean;
  liked?: boolean;
  tags?: string[];
  is_rewatch?: boolean;
};

export type WishlistItemInsert = {
  user_id: string;
  work_id?: string | null;
  production_id?: string | null;
  notes?: string | null;
};

export type LogEntryWithProduction = LogEntry & {
  production: Production & {
    work: Work | null;
  };
};

export type WorkWithProductionCount = Work & {
  productions: { count: number }[];
};

export type WishlistItemWithDetails = WishlistItem & {
  work: Work | null;
  production: (Production & { work: Work | null }) | null;
};

export type Stats = {
  totalShows: number;
  showsThisYear: number;
  venuesVisited: number;
  ratingDistribution: { rating: number; count: number }[];
  byMediaType: { media_type: MediaType; count: number }[];
  byYear: { year: number; count: number }[];
};
