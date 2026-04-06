# Transient v1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Transient v1 — a personal theatre logging app (Letterboxd for live performance) with Expo Router, NativeWind, and Supabase.

**Architecture:** Expo Router provides file-based routing for a cross-platform app (web + mobile). NativeWind enables Tailwind CSS styling. Supabase provides Postgres database with auth, RLS policies, and full-text search. The app has 5 tabs (Diary, Search, Wishlist, Stats, Settings) plus modal screens for logging and production detail.

**Tech Stack:** Expo SDK 52+, Expo Router v4, NativeWind v4, Supabase JS v2, TypeScript, Jest + Testing Library

**Spec:** `docs/superpowers/specs/2026-04-05-transient-app-spec.md`

---

## Prerequisites

Before starting, the developer must:

1. **Create a Supabase project** at [supabase.com](https://supabase.com). Free tier is sufficient.
2. **Note the project URL and anon key** from Settings > API in the Supabase dashboard.
3. **Have Node.js 18+** installed.

---

## File Structure

```
app/
├── _layout.tsx                    # Root layout: providers, global CSS import, auth gate
├── (auth)/
│   ├── _layout.tsx                # Auth group layout (stack, no tabs)
│   ├── login.tsx                  # Login screen
│   └── signup.tsx                 # Signup screen
├── (tabs)/
│   ├── _layout.tsx                # Tab bar with 5 tabs
│   ├── index.tsx                  # Diary (home)
│   ├── search.tsx                 # Search
│   ├── wishlist.tsx               # Wishlist
│   ├── stats.tsx                  # Stats
│   └── settings.tsx               # Settings
├── log/
│   ├── new.tsx                    # New log entry (search + form + inline creation)
│   └── [id].tsx                   # Edit log entry
└── production/
    └── [id].tsx                   # Production detail
components/
├── StarRating.tsx                 # Interactive half-star rating widget
├── StarRatingDisplay.tsx          # Read-only star display (for lists)
├── DiaryEntryRow.tsx              # Single diary entry row
├── WorkSearchResult.tsx           # Work result in search list
├── ProductionRow.tsx              # Production row under a work
├── TagInput.tsx                   # Tag input with removable pills
├── HeartButton.tsx                # Like/heart toggle
├── MediaTypeBadge.tsx             # Media type label badge
└── EmptyState.tsx                 # Reusable empty state placeholder
lib/
├── supabase.ts                    # Supabase client init
├── types.ts                       # TypeScript types for all entities
├── auth-context.tsx               # Auth context provider + hook
└── api/
    ├── works.ts                   # Work CRUD + search
    ├── productions.ts             # Production CRUD
    ├── log-entries.ts             # LogEntry CRUD
    ├── wishlist.ts                # Wishlist CRUD
    └── stats.ts                   # Stats aggregate queries
__tests__/
├── helpers/
│   └── supabase-mock.ts          # Reusable Supabase mock builder
└── lib/api/
    ├── works.test.ts
    ├── productions.test.ts
    ├── log-entries.test.ts
    ├── wishlist.test.ts
    └── stats.test.ts
supabase/
└── migrations/
    └── 001_initial_schema.sql     # Full Postgres schema
global.css                         # Tailwind directives
tailwind.config.js                 # Tailwind + NativeWind config
.env.example                       # Environment variable template
```

---

### Task 1: Project Scaffold with Expo and NativeWind

**Files:**
- Create (via template): `package.json`, `app.json`, `tsconfig.json`, `app/_layout.tsx`, `app/(tabs)/_layout.tsx`
- Create: `tailwind.config.js`
- Create: `global.css`
- Modify: `metro.config.js`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create Expo project from tabs template**

```bash
npx create-expo-app@latest /tmp/transient-init --template tabs
```

- [ ] **Step 2: Copy template files into project directory**

```bash
rsync -av --exclude='node_modules' --exclude='.git' /tmp/transient-init/ /home/noah-art3mis/projects/transient/
rm -rf /tmp/transient-init
```

- [ ] **Step 3: Install dependencies**

```bash
cd /home/noah-art3mis/projects/transient && npm install
```

- [ ] **Step 4: Install NativeWind and testing libraries**

```bash
npm install nativewind@^4 tailwindcss
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

- [ ] **Step 5: Create `tailwind.config.js`**

```js
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

- [ ] **Step 6: Create `global.css`**

```css
/* global.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 7: Update `metro.config.js` for NativeWind**

Replace the contents of `metro.config.js` with:

```js
// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

module.exports = withNativeWind(config, { input: "./global.css" });
```

- [ ] **Step 8: Import global CSS in root layout**

Add this import as the first line of `app/_layout.tsx`:

```tsx
import "../global.css";
```

- [ ] **Step 9: Clean up default template files**

Remove template files we don't need:

```bash
rm -f app/(tabs)/explore.tsx
rm -f app/+html.tsx
rm -rf components/
rm -rf constants/
rm -rf hooks/
mkdir -p components lib lib/api __tests__/helpers __tests__/lib/api __tests__/components supabase/migrations
```

- [ ] **Step 10: Verify the app runs**

Run: `npx expo start --web`

Expected: The app should launch in the browser without errors. The default tab screen should render.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "scaffold: initialize Expo project with NativeWind"
```

---

### Task 2: Supabase Client, Database Schema, and TypeScript Types

**Files:**
- Create: `.env.example`
- Create: `.env.local`
- Create: `lib/supabase.ts`
- Create: `lib/types.ts`
- Create: `supabase/migrations/001_initial_schema.sql`

- [ ] **Step 1: Install Supabase dependencies**

```bash
npm install @supabase/supabase-js @react-native-async-storage/async-storage react-native-url-polyfill
```

- [ ] **Step 2: Create `.env.example`**

```bash
# .env.example
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

- [ ] **Step 3: Create `.env.local` with real credentials**

```bash
# .env.local (DO NOT COMMIT — add to .gitignore)
EXPO_PUBLIC_SUPABASE_URL=<paste your Supabase project URL>
EXPO_PUBLIC_SUPABASE_ANON_KEY=<paste your Supabase anon key>
```

Add `.env.local` to `.gitignore`:

```bash
echo ".env.local" >> .gitignore
```

- [ ] **Step 4: Create `lib/supabase.ts`**

```ts
// lib/supabase.ts
import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
```

- [ ] **Step 5: Create `lib/types.ts`**

```ts
// lib/types.ts

export type MediaType =
  | "theatre"
  | "musical"
  | "opera"
  | "dance"
  | "circus"
  | "concert"
  | "other";

export type CreationMethod = "scripted" | "devised" | "other";

export type Creator = {
  name: string;
  role: string;
};

export type CastMember = {
  name: string;
  role: string;
};

// ---- Entities ----

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

// ---- Insert types (omit auto-generated fields) ----

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

// ---- Joined query types ----

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
```

- [ ] **Step 6: Create `supabase/migrations/001_initial_schema.sql`**

Copy the full SQL schema from the spec (Section 2.5):

```sql
-- ============================================================
-- Transient v1: Complete Postgres Schema
-- Target: Supabase (Postgres 15+)
-- ============================================================

-- ---- Works ----

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

-- ---- Productions ----

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

-- ---- Log Entries ----

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

-- ---- Wishlist ----

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

-- ---- Row-Level Security ----

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

-- ---- Updated-at trigger ----

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
```

- [ ] **Step 7: Run the SQL in Supabase**

Open the Supabase dashboard > SQL Editor. Paste the contents of `supabase/migrations/001_initial_schema.sql` and run it.

Expected: All tables, indexes, policies, and triggers are created without errors.

- [ ] **Step 8: Verify types compile**

Run: `npx tsc --noEmit lib/types.ts`

Expected: No TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: add Supabase client, database schema, and TypeScript types"
```

---

### Task 3: Authentication Context and Screens

**Files:**
- Create: `lib/auth-context.tsx`
- Create: `app/(auth)/_layout.tsx`
- Create: `app/(auth)/login.tsx`
- Create: `app/(auth)/signup.tsx`
- Modify: `app/_layout.tsx`

- [ ] **Step 1: Create `lib/auth-context.tsx`**

```tsx
// lib/auth-context.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

type AuthContextType = {
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

- [ ] **Step 2: Create `app/(auth)/_layout.tsx`**

```tsx
// app/(auth)/_layout.tsx
import { Stack } from "expo-router";

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
```

- [ ] **Step 3: Create `app/(auth)/login.tsx`**

```tsx
// app/(auth)/login.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold mb-8 text-center">Transient</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3 text-base"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <Pressable
        onPress={handleSignIn}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign In</Text>
        )}
      </Pressable>

      <Link href="/(auth)/signup" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-gray-600">
            Don't have an account?{" "}
            <Text className="text-black font-semibold">Sign Up</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

- [ ] **Step 4: Create `app/(auth)/signup.tsx`**

```tsx
// app/(auth)/signup.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "../../lib/auth-context";

export default function SignupScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signUp(email, password);
      Alert.alert("Success", "Check your email to confirm your account.");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-white justify-center px-6">
      <Text className="text-3xl font-bold mb-8 text-center">Create Account</Text>

      <TextInput
        value={email}
        onChangeText={setEmail}
        placeholder="Email"
        autoCapitalize="none"
        keyboardType="email-address"
        className="border border-gray-300 rounded-lg px-4 py-3 mb-3 text-base"
      />

      <TextInput
        value={password}
        onChangeText={setPassword}
        placeholder="Password"
        secureTextEntry
        className="border border-gray-300 rounded-lg px-4 py-3 mb-6 text-base"
      />

      <Pressable
        onPress={handleSignUp}
        disabled={loading}
        className="bg-black rounded-lg py-3 items-center mb-4"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white font-semibold text-base">Sign Up</Text>
        )}
      </Pressable>

      <Link href="/(auth)/login" asChild>
        <Pressable className="py-2 items-center">
          <Text className="text-gray-600">
            Already have an account?{" "}
            <Text className="text-black font-semibold">Sign In</Text>
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

- [ ] **Step 5: Modify `app/_layout.tsx` with auth gate**

Replace the entire contents of `app/_layout.tsx` with:

```tsx
// app/_layout.tsx
import "../global.css";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { AuthProvider, useAuth } from "../lib/auth-context";

function AuthGate() {
  const { session, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!session && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (session && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [session, loading, segments]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="log" options={{ presentation: "modal" }} />
      <Stack.Screen name="production" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGate />
    </AuthProvider>
  );
}
```

- [ ] **Step 6: Verify auth flow**

Run: `npx expo start --web`

Expected: App redirects to the login screen. Signing up with a valid email creates a user in Supabase Auth. After email confirmation and sign-in, the app redirects to the tabs.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: add authentication with Supabase Auth"
```

---

### Task 4: API Layer — Works, Productions, and Search (TDD)

**Files:**
- Create: `__tests__/helpers/supabase-mock.ts`
- Test: `__tests__/lib/api/works.test.ts`
- Create: `lib/api/works.ts`
- Test: `__tests__/lib/api/productions.test.ts`
- Create: `lib/api/productions.ts`

- [ ] **Step 1: Create the Supabase mock helper**

```ts
// __tests__/helpers/supabase-mock.ts

/**
 * Creates a chainable mock that mimics the Supabase query builder.
 * Every method returns the chain (for chaining), and the chain is
 * awaitable (thenable), resolving to the configured result.
 */
export function createMockQueryBuilder(result: { data: any; error: any }) {
  const builder: Record<string, any> = {};

  const methods = [
    "select",
    "insert",
    "update",
    "delete",
    "upsert",
    "eq",
    "neq",
    "gt",
    "gte",
    "lt",
    "lte",
    "is",
    "in",
    "not",
    "or",
    "textSearch",
    "order",
    "limit",
    "range",
    "single",
    "maybeSingle",
    "returns",
  ];

  for (const method of methods) {
    builder[method] = jest.fn(() => builder);
  }

  // Make the builder awaitable (thenable)
  builder.then = (onfulfilled: (value: any) => any) =>
    Promise.resolve(result).then(onfulfilled);
  builder.catch = (onrejected: (reason: any) => any) =>
    Promise.resolve(result).catch(onrejected);

  return builder;
}
```

- [ ] **Step 2: Write the failing test for Works API**

```ts
// __tests__/lib/api/works.test.ts
import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

// Import after mock setup
const worksApi = require("../../../lib/api/works");

describe("searchWorks", () => {
  it("searches works by query and returns results", async () => {
    const mockWorks = [
      { id: "1", title: "Hamlet", productions: [{ count: 3 }] },
    ];
    const builder = createMockQueryBuilder({ data: mockWorks, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.searchWorks("hamlet");

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.select).toHaveBeenCalledWith("*, productions(count)");
    expect(builder.textSearch).toHaveBeenCalledWith(
      "search_vector",
      "hamlet",
      { type: "plain" }
    );
    expect(builder.limit).toHaveBeenCalledWith(20);
    expect(result).toEqual(mockWorks);
  });

  it("throws on supabase error", async () => {
    const builder = createMockQueryBuilder({
      data: null,
      error: { message: "search failed" },
    });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await expect(worksApi.searchWorks("test")).rejects.toThrow("search failed");
  });
});

describe("getWork", () => {
  it("returns a single work by id", async () => {
    const mockWork = { id: "1", title: "Hamlet" };
    const builder = createMockQueryBuilder({ data: mockWork, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.getWork("1");

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.eq).toHaveBeenCalledWith("id", "1");
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(mockWork);
  });
});

describe("createWork", () => {
  it("inserts a new work and returns it", async () => {
    const newWork = { id: "2", title: "Macbeth" };
    const builder = createMockQueryBuilder({ data: newWork, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await worksApi.createWork({ title: "Macbeth" });

    expect(supabase.from).toHaveBeenCalledWith("works");
    expect(builder.insert).toHaveBeenCalledWith({ title: "Macbeth" });
    expect(builder.select).toHaveBeenCalled();
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(newWork);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx jest __tests__/lib/api/works.test.ts`

Expected: FAIL — `Cannot find module '../../../lib/api/works'`

- [ ] **Step 4: Implement `lib/api/works.ts`**

```ts
// lib/api/works.ts
import { supabase } from "../supabase";
import { Work, WorkInsert, WorkWithProductionCount } from "../types";

export async function searchWorks(
  query: string
): Promise<WorkWithProductionCount[]> {
  const { data, error } = await supabase
    .from("works")
    .select("*, productions(count)")
    .textSearch("search_vector", query, { type: "plain" })
    .limit(20);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWork(id: string): Promise<Work | null> {
  const { data, error } = await supabase
    .from("works")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createWork(work: WorkInsert): Promise<Work> {
  const { data, error } = await supabase
    .from("works")
    .insert(work)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx jest __tests__/lib/api/works.test.ts`

Expected: PASS — all 3 tests pass.

- [ ] **Step 6: Write the failing test for Productions API**

```ts
// __tests__/lib/api/productions.test.ts
import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const productionsApi = require("../../../lib/api/productions");

describe("getProductionsByWork", () => {
  it("returns productions for a given work", async () => {
    const mockProds = [
      { id: "p1", work_id: "w1", venue: "Almeida Theatre", year: 2025 },
    ];
    const builder = createMockQueryBuilder({ data: mockProds, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.getProductionsByWork("w1");

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.eq).toHaveBeenCalledWith("work_id", "w1");
    expect(result).toEqual(mockProds);
  });
});

describe("getProduction", () => {
  it("returns a single production with work data", async () => {
    const mockProd = {
      id: "p1",
      venue: "Almeida Theatre",
      work: { id: "w1", title: "Hamlet" },
    };
    const builder = createMockQueryBuilder({ data: mockProd, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.getProduction("p1");

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.select).toHaveBeenCalledWith("*, work:works(*)");
    expect(builder.eq).toHaveBeenCalledWith("id", "p1");
    expect(builder.single).toHaveBeenCalled();
    expect(result).toEqual(mockProd);
  });
});

describe("createProduction", () => {
  it("inserts a new production and returns it", async () => {
    const newProd = { id: "p2", work_id: "w1", venue: "Globe", year: 2026 };
    const builder = createMockQueryBuilder({ data: newProd, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await productionsApi.createProduction({
      work_id: "w1",
      venue: "Globe",
      year: 2026,
    });

    expect(supabase.from).toHaveBeenCalledWith("productions");
    expect(builder.insert).toHaveBeenCalledWith({
      work_id: "w1",
      venue: "Globe",
      year: 2026,
    });
    expect(result).toEqual(newProd);
  });
});
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx jest __tests__/lib/api/productions.test.ts`

Expected: FAIL — `Cannot find module '../../../lib/api/productions'`

- [ ] **Step 8: Implement `lib/api/productions.ts`**

```ts
// lib/api/productions.ts
import { supabase } from "../supabase";
import { Production, ProductionInsert, Work } from "../types";

export async function getProductionsByWork(
  workId: string
): Promise<Production[]> {
  const { data, error } = await supabase
    .from("productions")
    .select("*")
    .eq("work_id", workId)
    .order("year", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getProduction(
  id: string
): Promise<(Production & { work: Work | null }) | null> {
  const { data, error } = await supabase
    .from("productions")
    .select("*, work:works(*)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createProduction(
  production: ProductionInsert
): Promise<Production> {
  const { data, error } = await supabase
    .from("productions")
    .insert(production)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

- [ ] **Step 9: Run test to verify it passes**

Run: `npx jest __tests__/lib/api/productions.test.ts`

Expected: PASS — all 3 tests pass.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat: add Works and Productions API layer with tests"
```

---

### Task 5: API Layer — LogEntries, Wishlist, and Stats (TDD)

**Files:**
- Test: `__tests__/lib/api/log-entries.test.ts`
- Create: `lib/api/log-entries.ts`
- Test: `__tests__/lib/api/wishlist.test.ts`
- Create: `lib/api/wishlist.ts`
- Test: `__tests__/lib/api/stats.test.ts`
- Create: `lib/api/stats.ts`

- [ ] **Step 1: Write the failing test for LogEntries API**

```ts
// __tests__/lib/api/log-entries.test.ts
import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const logEntriesApi = require("../../../lib/api/log-entries");

describe("getLogEntries", () => {
  it("returns user log entries ordered by date", async () => {
    const mockEntries = [
      { id: "le1", date_seen: "2026-04-05", production: { venue: "Globe" } },
    ];
    const builder = createMockQueryBuilder({ data: mockEntries, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.getLogEntries("user-1");

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(builder.order).toHaveBeenCalledWith("date_seen", {
      ascending: false,
    });
    expect(result).toEqual(mockEntries);
  });

  it("filters by year when provided", async () => {
    const builder = createMockQueryBuilder({ data: [], error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await logEntriesApi.getLogEntries("user-1", 2026);

    expect(builder.gte).toHaveBeenCalledWith("date_seen", "2026-01-01");
    expect(builder.lte).toHaveBeenCalledWith("date_seen", "2026-12-31");
  });
});

describe("createLogEntry", () => {
  it("inserts a new log entry and returns it", async () => {
    const newEntry = { id: "le2", production_id: "p1", user_id: "user-1" };
    const builder = createMockQueryBuilder({ data: newEntry, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.createLogEntry({
      production_id: "p1",
      user_id: "user-1",
    });

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.insert).toHaveBeenCalledWith({
      production_id: "p1",
      user_id: "user-1",
    });
    expect(result).toEqual(newEntry);
  });
});

describe("updateLogEntry", () => {
  it("updates and returns the entry", async () => {
    const updated = { id: "le1", rating: 4.5 };
    const builder = createMockQueryBuilder({ data: updated, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await logEntriesApi.updateLogEntry("le1", { rating: 4.5 });

    expect(builder.update).toHaveBeenCalledWith({ rating: 4.5 });
    expect(builder.eq).toHaveBeenCalledWith("id", "le1");
    expect(result).toEqual(updated);
  });
});

describe("deleteLogEntry", () => {
  it("deletes a log entry by id", async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await logEntriesApi.deleteLogEntry("le1");

    expect(supabase.from).toHaveBeenCalledWith("log_entries");
    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "le1");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/lib/api/log-entries.test.ts`

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implement `lib/api/log-entries.ts`**

```ts
// lib/api/log-entries.ts
import { supabase } from "../supabase";
import { LogEntry, LogEntryInsert, LogEntryWithProduction } from "../types";

export async function getLogEntries(
  userId: string,
  year?: number
): Promise<LogEntryWithProduction[]> {
  let query = supabase
    .from("log_entries")
    .select(
      "*, production:productions(*, work:works(*))"
    )
    .eq("user_id", userId)
    .order("date_seen", { ascending: false });

  if (year) {
    query = query
      .gte("date_seen", `${year}-01-01`)
      .lte("date_seen", `${year}-12-31`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getLogEntriesForProduction(
  productionId: string,
  userId: string
): Promise<LogEntry[]> {
  const { data, error } = await supabase
    .from("log_entries")
    .select("*")
    .eq("production_id", productionId)
    .eq("user_id", userId)
    .order("date_seen", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createLogEntry(
  entry: LogEntryInsert
): Promise<LogEntry> {
  const { data, error } = await supabase
    .from("log_entries")
    .insert(entry)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateLogEntry(
  id: string,
  updates: Partial<LogEntryInsert>
): Promise<LogEntry> {
  const { data, error } = await supabase
    .from("log_entries")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteLogEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from("log_entries")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest __tests__/lib/api/log-entries.test.ts`

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Write the failing test for Wishlist API**

```ts
// __tests__/lib/api/wishlist.test.ts
import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const wishlistApi = require("../../../lib/api/wishlist");

describe("getWishlist", () => {
  it("returns user wishlist items", async () => {
    const mockItems = [{ id: "wi1", work_id: "w1", notes: "Want to see" }];
    const builder = createMockQueryBuilder({ data: mockItems, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await wishlistApi.getWishlist("user-1");

    expect(supabase.from).toHaveBeenCalledWith("wishlist_items");
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1");
    expect(result).toEqual(mockItems);
  });
});

describe("addToWishlist", () => {
  it("inserts a wishlist item", async () => {
    const newItem = { id: "wi2", user_id: "user-1", work_id: "w1" };
    const builder = createMockQueryBuilder({ data: newItem, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await wishlistApi.addToWishlist({
      user_id: "user-1",
      work_id: "w1",
    });

    expect(builder.insert).toHaveBeenCalledWith({
      user_id: "user-1",
      work_id: "w1",
    });
    expect(result).toEqual(newItem);
  });
});

describe("removeFromWishlist", () => {
  it("deletes a wishlist item", async () => {
    const builder = createMockQueryBuilder({ data: null, error: null });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    await wishlistApi.removeFromWishlist("wi1");

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.eq).toHaveBeenCalledWith("id", "wi1");
  });
});
```

- [ ] **Step 6: Implement `lib/api/wishlist.ts`**

```ts
// lib/api/wishlist.ts
import { supabase } from "../supabase";
import { WishlistItem, WishlistItemInsert, WishlistItemWithDetails } from "../types";

export async function getWishlist(
  userId: string
): Promise<WishlistItemWithDetails[]> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .select("*, work:works(*), production:productions(*, work:works(*))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function addToWishlist(
  item: WishlistItemInsert
): Promise<WishlistItem> {
  const { data, error } = await supabase
    .from("wishlist_items")
    .insert(item)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function removeFromWishlist(id: string): Promise<void> {
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id);

  if (error) throw new Error(error.message);
}
```

- [ ] **Step 7: Run wishlist tests**

Run: `npx jest __tests__/lib/api/wishlist.test.ts`

Expected: PASS — all 3 tests pass.

- [ ] **Step 8: Write the failing test for Stats API**

```ts
// __tests__/lib/api/stats.test.ts
import { createMockQueryBuilder } from "../../helpers/supabase-mock";
import { supabase } from "../../../lib/supabase";

jest.mock("../../../lib/supabase", () => ({
  supabase: { from: jest.fn() },
}));

const statsApi = require("../../../lib/api/stats");

describe("getStats", () => {
  it("computes stats from log entries", async () => {
    const mockEntries = [
      {
        date_seen: "2026-03-15",
        rating: 4.0,
        production: { venue: "Globe", work: { media_type: "theatre" } },
      },
      {
        date_seen: "2026-01-10",
        rating: 3.5,
        production: { venue: "Almeida", work: { media_type: "theatre" } },
      },
      {
        date_seen: "2025-11-20",
        rating: 5.0,
        production: { venue: "Globe", work: { media_type: "musical" } },
      },
    ];
    const builder = createMockQueryBuilder({
      data: mockEntries,
      count: 3,
      error: null,
    });
    (supabase.from as jest.Mock).mockReturnValue(builder);

    const result = await statsApi.getStats("user-1");

    expect(result.totalShows).toBe(3);
    expect(result.venuesVisited).toBe(2); // Globe, Almeida
    expect(result.ratingDistribution).toEqual(
      expect.arrayContaining([
        { rating: 3.5, count: 1 },
        { rating: 4.0, count: 1 },
        { rating: 5.0, count: 1 },
      ])
    );
    expect(result.byMediaType).toEqual(
      expect.arrayContaining([
        { media_type: "theatre", count: 2 },
        { media_type: "musical", count: 1 },
      ])
    );
  });
});
```

- [ ] **Step 9: Implement `lib/api/stats.ts`**

```ts
// lib/api/stats.ts
import { supabase } from "../supabase";
import { MediaType, Stats } from "../types";

export async function getStats(userId: string): Promise<Stats> {
  const { data: entries, count, error } = await supabase
    .from("log_entries")
    .select(
      "date_seen, rating, production:productions(venue, work:works(media_type))",
      { count: "exact" }
    )
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const all = entries ?? [];
  const currentYear = new Date().getFullYear();

  const totalShows = count ?? all.length;
  const showsThisYear = all.filter(
    (e) => new Date(e.date_seen).getFullYear() === currentYear
  ).length;

  // Count distinct non-null venues
  const venues = new Set(
    all.map((e: any) => e.production?.venue).filter(Boolean)
  );
  const venuesVisited = venues.size;

  // Rating distribution
  const ratingMap = new Map<number, number>();
  for (const e of all) {
    if (e.rating != null) {
      ratingMap.set(e.rating, (ratingMap.get(e.rating) ?? 0) + 1);
    }
  }
  const ratingDistribution = Array.from(ratingMap.entries())
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  // By media type
  const typeMap = new Map<string, number>();
  for (const e of all) {
    const mt = (e as any).production?.work?.media_type ?? "other";
    typeMap.set(mt, (typeMap.get(mt) ?? 0) + 1);
  }
  const byMediaType = Array.from(typeMap.entries())
    .map(([media_type, count]) => ({ media_type: media_type as MediaType, count }))
    .sort((a, b) => b.count - a.count);

  // By year
  const yearMap = new Map<number, number>();
  for (const e of all) {
    const y = new Date(e.date_seen).getFullYear();
    yearMap.set(y, (yearMap.get(y) ?? 0) + 1);
  }
  const byYear = Array.from(yearMap.entries())
    .map(([year, count]) => ({ year, count }))
    .sort((a, b) => b.year - a.year);

  return {
    totalShows,
    showsThisYear,
    venuesVisited,
    ratingDistribution,
    byMediaType,
    byYear,
  };
}
```

- [ ] **Step 10: Run all API tests**

Run: `npx jest __tests__/lib/api/`

Expected: PASS — all tests pass across works, productions, log-entries, wishlist, and stats.

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "feat: add LogEntries, Wishlist, and Stats API layer with tests"
```

---

### Task 6: Shared UI Components

**Files:**
- Create: `components/StarRating.tsx`
- Create: `components/StarRatingDisplay.tsx`
- Create: `components/HeartButton.tsx`
- Create: `components/TagInput.tsx`
- Create: `components/MediaTypeBadge.tsx`
- Create: `components/EmptyState.tsx`
- Test: `__tests__/components/StarRating.test.tsx`
- Test: `__tests__/components/TagInput.test.tsx`

- [ ] **Step 1: Write the failing test for StarRating**

```tsx
// __tests__/components/StarRating.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import StarRating from "../../components/StarRating";

describe("StarRating", () => {
  it("renders 5 star positions", () => {
    const { getAllByTestId } = render(
      <StarRating value={null} onChange={() => {}} />
    );
    // Each star has a left and right touch target
    expect(getAllByTestId(/^star-\d+-left$/)).toHaveLength(5);
    expect(getAllByTestId(/^star-\d+-right$/)).toHaveLength(5);
  });

  it("calls onChange with half-star value on left tap", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={null} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-left"));
    expect(onChange).toHaveBeenCalledWith(2.5);
  });

  it("calls onChange with full-star value on right tap", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={null} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-right"));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("clears rating when tapping the same value", () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <StarRating value={3} onChange={onChange} />
    );
    fireEvent.press(getByTestId("star-3-right"));
    expect(onChange).toHaveBeenCalledWith(null);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest __tests__/components/StarRating.test.tsx`

Expected: FAIL — `Cannot find module`

- [ ] **Step 3: Implement `components/StarRating.tsx`**

```tsx
// components/StarRating.tsx
import { View, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: number | null;
  onChange: (value: number | null) => void;
  size?: number;
};

export default function StarRating({ value, onChange, size = 32 }: Props) {
  function handlePress(starValue: number) {
    onChange(value === starValue ? null : starValue);
  }

  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => {
        const halfValue = star - 0.5;
        const fullValue = star;

        // Determine icon
        let icon: "star" | "star-half" | "star-outline" = "star-outline";
        if (value !== null) {
          if (value >= fullValue) icon = "star";
          else if (value >= halfValue) icon = "star-half";
        }

        const color = icon === "star-outline" ? "#d1d5db" : "#f59e0b";

        return (
          <View
            key={star}
            style={{ width: size, height: size, position: "relative" }}
          >
            <Ionicons
              name={icon}
              size={size}
              color={color}
              style={{ position: "absolute" }}
            />
            <Pressable
              testID={`star-${star}-left`}
              onPress={() => handlePress(halfValue)}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: size / 2,
                height: size,
              }}
            />
            <Pressable
              testID={`star-${star}-right`}
              onPress={() => handlePress(fullValue)}
              style={{
                position: "absolute",
                right: 0,
                top: 0,
                width: size / 2,
                height: size,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
```

- [ ] **Step 4: Run StarRating test**

Run: `npx jest __tests__/components/StarRating.test.tsx`

Expected: PASS — all 4 tests pass.

- [ ] **Step 5: Create `components/StarRatingDisplay.tsx`**

```tsx
// components/StarRatingDisplay.tsx
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: number;
  size?: number;
};

export default function StarRatingDisplay({ value, size = 14 }: Props) {
  return (
    <View className="flex-row">
      {[1, 2, 3, 4, 5].map((star) => {
        let icon: "star" | "star-half" | "star-outline" = "star-outline";
        if (value >= star) icon = "star";
        else if (value >= star - 0.5) icon = "star-half";

        return (
          <Ionicons
            key={star}
            name={icon}
            size={size}
            color={icon === "star-outline" ? "#d1d5db" : "#f59e0b"}
          />
        );
      })}
    </View>
  );
}
```

- [ ] **Step 6: Create `components/HeartButton.tsx`**

```tsx
// components/HeartButton.tsx
import { Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
  size?: number;
};

export default function HeartButton({ value, onChange, size = 28 }: Props) {
  return (
    <Pressable onPress={() => onChange(!value)} testID="heart-button">
      <Ionicons
        name={value ? "heart" : "heart-outline"}
        size={size}
        color={value ? "#ef4444" : "#9ca3af"}
      />
    </Pressable>
  );
}
```

- [ ] **Step 7: Write the failing test for TagInput**

```tsx
// __tests__/components/TagInput.test.tsx
import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import TagInput from "../../components/TagInput";

describe("TagInput", () => {
  it("displays existing tags as pills", () => {
    const { getByText } = render(
      <TagInput value={["world premiere", "with Mum"]} onChange={() => {}} />
    );
    expect(getByText("world premiere")).toBeTruthy();
    expect(getByText("with Mum")).toBeTruthy();
  });

  it("adds a tag when comma is typed", () => {
    const onChange = jest.fn();
    const { getByPlaceholderText } = render(
      <TagInput value={[]} onChange={onChange} />
    );
    const input = getByPlaceholderText("Add tags...");
    fireEvent.changeText(input, "new tag,");
    expect(onChange).toHaveBeenCalledWith(["new tag"]);
  });

  it("removes a tag when X is pressed", () => {
    const onChange = jest.fn();
    const { getAllByTestId } = render(
      <TagInput value={["tag1", "tag2"]} onChange={onChange} />
    );
    fireEvent.press(getAllByTestId("remove-tag")[0]);
    expect(onChange).toHaveBeenCalledWith(["tag2"]);
  });
});
```

- [ ] **Step 8: Implement `components/TagInput.tsx`**

```tsx
// components/TagInput.tsx
import { useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";

type Props = {
  value: string[];
  onChange: (tags: string[]) => void;
};

export default function TagInput({ value, onChange }: Props) {
  const [text, setText] = useState("");

  function handleChangeText(input: string) {
    if (input.includes(",")) {
      const tag = input.replace(",", "").trim();
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setText("");
    } else {
      setText(input);
    }
  }

  function handleSubmitEditing() {
    const tag = text.trim();
    if (tag && !value.includes(tag)) {
      onChange([...value, tag]);
    }
    setText("");
  }

  function removeTag(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <View>
      <View className="flex-row flex-wrap gap-2 mb-2">
        {value.map((tag, index) => (
          <View
            key={tag}
            className="flex-row items-center bg-gray-200 rounded-full px-3 py-1"
          >
            <Text className="text-sm mr-1">{tag}</Text>
            <Pressable onPress={() => removeTag(index)} testID="remove-tag">
              <Ionicons name="close-circle" size={16} color="#6b7280" />
            </Pressable>
          </View>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={handleChangeText}
        onSubmitEditing={handleSubmitEditing}
        placeholder="Add tags..."
        className="border border-gray-300 rounded-lg px-4 py-2"
      />
    </View>
  );
}
```

- [ ] **Step 9: Run TagInput test**

Run: `npx jest __tests__/components/TagInput.test.tsx`

Expected: PASS — all 3 tests pass.

- [ ] **Step 10: Create `components/MediaTypeBadge.tsx`**

```tsx
// components/MediaTypeBadge.tsx
import { View, Text } from "react-native";
import { MediaType } from "../lib/types";

const LABELS: Record<MediaType, string> = {
  theatre: "Play",
  musical: "Musical",
  opera: "Opera",
  dance: "Dance",
  circus: "Circus",
  concert: "Concert",
  other: "Other",
};

type Props = {
  type: MediaType;
};

export default function MediaTypeBadge({ type }: Props) {
  return (
    <View className="bg-gray-100 rounded px-2 py-0.5 self-start">
      <Text className="text-xs text-gray-600">{LABELS[type] ?? type}</Text>
    </View>
  );
}
```

- [ ] **Step 11: Create `components/EmptyState.tsx`**

```tsx
// components/EmptyState.tsx
import { View, Text } from "react-native";

type Props = {
  message: string;
};

export default function EmptyState({ message }: Props) {
  return (
    <View className="flex-1 items-center justify-center px-8">
      <Text className="text-gray-400 text-center text-base">{message}</Text>
    </View>
  );
}
```

- [ ] **Step 12: Run all component tests**

Run: `npx jest __tests__/components/`

Expected: PASS — all StarRating and TagInput tests pass.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "feat: add shared UI components (StarRating, TagInput, etc.)"
```

---

### Task 7: Tab Navigation Layout

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Create: `app/(tabs)/index.tsx` (placeholder)
- Create: `app/(tabs)/search.tsx` (placeholder)
- Create: `app/(tabs)/wishlist.tsx` (placeholder)
- Create: `app/(tabs)/stats.tsx` (placeholder)
- Create: `app/(tabs)/settings.tsx` (placeholder)

- [ ] **Step 1: Replace `app/(tabs)/_layout.tsx` with 5-tab layout**

```tsx
// app/(tabs)/_layout.tsx
import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#000",
        tabBarInactiveTintColor: "#9ca3af",
        headerShown: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Diary",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="book-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: "Wishlist",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bookmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="stats"
        options={{
          title: "Stats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
```

- [ ] **Step 2: Create placeholder tab screens**

Create each placeholder file with a simple centered text label:

`app/(tabs)/index.tsx`:
```tsx
import { View, Text } from "react-native";
export default function DiaryScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Diary — coming next</Text>
    </View>
  );
}
```

`app/(tabs)/search.tsx`:
```tsx
import { View, Text } from "react-native";
export default function SearchScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Search — coming soon</Text>
    </View>
  );
}
```

`app/(tabs)/wishlist.tsx`:
```tsx
import { View, Text } from "react-native";
export default function WishlistScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Wishlist — coming soon</Text>
    </View>
  );
}
```

`app/(tabs)/stats.tsx`:
```tsx
import { View, Text } from "react-native";
export default function StatsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Stats — coming soon</Text>
    </View>
  );
}
```

`app/(tabs)/settings.tsx`:
```tsx
import { View, Text } from "react-native";
export default function SettingsScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-gray-400">Settings — coming soon</Text>
    </View>
  );
}
```

- [ ] **Step 3: Verify tabs render**

Run: `npx expo start --web`

Expected: 5-tab navigation bar at the bottom. Tapping each tab shows its placeholder.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: add 5-tab navigation layout"
```

---

### Task 8: Diary Screen (Home)

**Files:**
- Create: `components/DiaryEntryRow.tsx`
- Modify: `app/(tabs)/index.tsx`

- [ ] **Step 1: Create `components/DiaryEntryRow.tsx`**

```tsx
// components/DiaryEntryRow.tsx
import { View, Text, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LogEntryWithProduction } from "../lib/types";
import StarRatingDisplay from "./StarRatingDisplay";

type Props = {
  entry: LogEntryWithProduction;
  onPress: () => void;
};

export default function DiaryEntryRow({ entry, onPress }: Props) {
  const title =
    entry.production.title_override ??
    entry.production.work?.title ??
    "Unknown";
  const venue = entry.production.venue;

  const date = new Date(entry.date_seen + "T00:00:00");
  const formatted = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      <Text className="w-16 text-sm text-gray-500">{formatted}</Text>
      <View className="flex-1 mx-2">
        <Text className="font-semibold" numberOfLines={1}>
          {title}
        </Text>
        {venue && (
          <Text className="text-sm text-gray-500" numberOfLines={1}>
            {venue}
          </Text>
        )}
      </View>
      <View className="flex-row items-center gap-1">
        {entry.rating != null && (
          <StarRatingDisplay value={entry.rating} size={12} />
        )}
        {entry.liked && <Ionicons name="heart" size={14} color="#ef4444" />}
        {entry.review && (
          <Ionicons name="document-text-outline" size={14} color="#9ca3af" />
        )}
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Implement the Diary screen**

Replace `app/(tabs)/index.tsx` with:

```tsx
// app/(tabs)/index.tsx
import { useState, useEffect, useCallback } from "react";
import { View, Text, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth-context";
import { getLogEntries } from "../../lib/api/log-entries";
import { LogEntryWithProduction } from "../../lib/types";
import DiaryEntryRow from "../../components/DiaryEntryRow";
import EmptyState from "../../components/EmptyState";

export default function DiaryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [entries, setEntries] = useState<LogEntryWithProduction[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const currentYear = new Date().getFullYear();
  const years: (number | null)[] = [null, currentYear, currentYear - 1];

  const loadEntries = useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getLogEntries(
        session.user.id,
        selectedYear ?? undefined
      );
      setEntries(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [session, selectedYear]);

  // Reload when screen regains focus (after logging a show)
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  return (
    <View className="flex-1 bg-white">
      {/* Year filter pills */}
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row gap-2">
          {years.map((year) => (
            <Pressable
              key={year ?? "all"}
              onPress={() => setSelectedYear(year)}
              className={`px-3 py-1 rounded-full ${
                selectedYear === year ? "bg-black" : "bg-gray-200"
              }`}
            >
              <Text
                className={
                  selectedYear === year ? "text-white" : "text-gray-700"
                }
              >
                {year ?? "All"}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Entries list */}
      {entries.length === 0 && !loading ? (
        <EmptyState message="No shows logged yet. Tap + to log your first show." />
      ) : (
        <FlatList
          data={entries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DiaryEntryRow
              entry={item}
              onPress={() => router.push(`/log/${item.id}`)}
            />
          )}
        />
      )}

      {/* FAB */}
      <Pressable
        onPress={() => router.push("/log/new")}
        className="absolute bottom-6 right-6 w-14 h-14 bg-black rounded-full items-center justify-center shadow-lg"
      >
        <Text className="text-white text-3xl leading-none">+</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 3: Verify diary screen renders**

Run: `npx expo start --web`

Expected: The Diary tab shows the year filter pills and the empty state message. The + FAB is visible at bottom-right.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: implement Diary screen with entry list and FAB"
```

---

### Task 9: Log Entry Screen (New and Edit)

**Files:**
- Create: `components/WorkSearchResult.tsx`
- Create: `components/ProductionRow.tsx`
- Create: `app/log/new.tsx`
- Create: `app/log/[id].tsx`

This is the most complex screen. It has four sub-views controlled by state:
1. `search` — search for a work, expand to see productions, select one
2. `create-work` — inline form to create a new Work
3. `create-production` — inline form to create a Production under a Work
4. `log` — the log entry form (date, rating, review, tags, etc.)

- [ ] **Step 1: Create `components/WorkSearchResult.tsx`**

```tsx
// components/WorkSearchResult.tsx
import { View, Text, Pressable } from "react-native";
import { WorkWithProductionCount } from "../lib/types";
import MediaTypeBadge from "./MediaTypeBadge";

type Props = {
  work: WorkWithProductionCount;
  onPress: () => void;
  expanded: boolean;
};

export default function WorkSearchResult({ work, onPress, expanded }: Props) {
  const firstCreator = work.creators?.[0];
  const prodCount = work.productions?.[0]?.count ?? 0;

  return (
    <Pressable
      onPress={onPress}
      className={`py-3 border-b border-gray-100 ${
        expanded ? "bg-gray-50" : ""
      }`}
    >
      <Text className="font-semibold">{work.title}</Text>
      {firstCreator && (
        <Text className="text-sm text-gray-500">
          {firstCreator.role}: {firstCreator.name}
        </Text>
      )}
      <View className="flex-row items-center gap-2 mt-1">
        <MediaTypeBadge type={work.media_type} />
        <Text className="text-xs text-gray-400">
          {prodCount} production{prodCount !== 1 ? "s" : ""}
        </Text>
      </View>
    </Pressable>
  );
}
```

- [ ] **Step 2: Create `components/ProductionRow.tsx`**

```tsx
// components/ProductionRow.tsx
import { Text, Pressable } from "react-native";
import { Production } from "../lib/types";

type Props = {
  production: Production;
  onPress: () => void;
};

export default function ProductionRow({ production, onPress }: Props) {
  return (
    <Pressable onPress={onPress} className="py-2 pl-6 border-b border-gray-50">
      <Text className="text-sm">
        {production.venue ?? "Unknown venue"}
        {production.year ? `, ${production.year}` : ""}
      </Text>
      {production.director && (
        <Text className="text-xs text-gray-400">
          dir. {production.director}
        </Text>
      )}
    </Pressable>
  );
}
```

- [ ] **Step 3: Create `app/log/new.tsx`**

```tsx
// app/log/new.tsx
import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import { searchWorks, createWork } from "../../lib/api/works";
import {
  getProductionsByWork,
  createProduction,
} from "../../lib/api/productions";
import { createLogEntry } from "../../lib/api/log-entries";
import { WorkWithProductionCount, Production, MediaType } from "../../lib/types";
import WorkSearchResult from "../../components/WorkSearchResult";
import ProductionRow from "../../components/ProductionRow";
import StarRating from "../../components/StarRating";
import HeartButton from "../../components/HeartButton";
import TagInput from "../../components/TagInput";

type Step = "search" | "create-work" | "create-production" | "log";

export default function NewLogEntryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{
    productionId?: string;
    productionTitle?: string;
    productionVenue?: string;
  }>();

  // Navigation state
  const [step, setStep] = useState<Step>(params.productionId ? "log" : "search");
  const [selectedProduction, setSelectedProduction] = useState<Production | null>(
    params.productionId
      ? ({
          id: params.productionId,
          title_override: params.productionTitle ?? null,
          venue: params.productionVenue ?? null,
        } as Production)
      : null
  );

  // Search state
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WorkWithProductionCount[]>([]);
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [workProductions, setWorkProductions] = useState<Production[]>([]);
  const [searching, setSearching] = useState(false);

  // Create work state
  const [newWorkTitle, setNewWorkTitle] = useState("");
  const [newWorkMediaType, setNewWorkMediaType] = useState<MediaType>("theatre");
  const [newWorkCreatorName, setNewWorkCreatorName] = useState("");
  const [newWorkCreatorRole, setNewWorkCreatorRole] = useState("playwright");
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);

  // Create production state
  const [newProdVenue, setNewProdVenue] = useState("");
  const [newProdYear, setNewProdYear] = useState(
    String(new Date().getFullYear())
  );
  const [newProdDirector, setNewProdDirector] = useState("");

  // Log form state
  const today = new Date().toISOString().split("T")[0];
  const [dateSeen, setDateSeen] = useState(today);
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // ---- Search handlers ----

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const results = await searchWorks(text);
      setSearchResults(results);
    } catch (e) {
      console.error(e);
    } finally {
      setSearching(false);
    }
  }

  async function handleWorkPress(workId: string) {
    if (expandedWorkId === workId) {
      setExpandedWorkId(null);
      return;
    }
    setExpandedWorkId(workId);
    try {
      const prods = await getProductionsByWork(workId);
      setWorkProductions(prods);
    } catch (e) {
      console.error(e);
    }
  }

  function handleProductionSelect(production: Production) {
    setSelectedProduction(production);
    setStep("log");
  }

  // ---- Create work handler ----

  async function handleCreateWork() {
    const creators =
      newWorkCreatorName.trim()
        ? [{ name: newWorkCreatorName.trim(), role: newWorkCreatorRole }]
        : [];
    try {
      const work = await createWork({
        title: newWorkTitle,
        media_type: newWorkMediaType,
        creators,
      });
      setSelectedWorkId(work.id);
      setStep("create-production");
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Create production handler ----

  async function handleCreateProduction() {
    try {
      const prod = await createProduction({
        work_id: selectedWorkId,
        venue: newProdVenue || null,
        year: newProdYear ? parseInt(newProdYear, 10) : null,
        director: newProdDirector || null,
      });
      setSelectedProduction(prod);
      setStep("log");
    } catch (e) {
      console.error(e);
    }
  }

  // ---- Save log entry ----

  async function handleSave() {
    if (!session || !selectedProduction) return;
    setSaving(true);
    try {
      await createLogEntry({
        production_id: selectedProduction.id,
        user_id: session.user.id,
        date_seen: dateSeen,
        rating,
        review: review || null,
        is_private: true,
        liked,
        tags,
        is_rewatch: isRewatch,
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  // ---- Step 1: Search ----

  if (step === "search") {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 bg-white"
      >
        <View className="px-4 pt-4">
          <TextInput
            autoFocus
            value={query}
            onChangeText={handleSearch}
            placeholder="Search for a show..."
            className="border border-gray-300 rounded-lg px-4 py-3 text-base"
          />
        </View>

        <FlatList
          data={searchResults}
          keyExtractor={(item) => item.id}
          className="px-4"
          renderItem={({ item: work }) => (
            <View>
              <WorkSearchResult
                work={work}
                onPress={() => handleWorkPress(work.id)}
                expanded={expandedWorkId === work.id}
              />
              {expandedWorkId === work.id && (
                <>
                  {workProductions.map((prod) => (
                    <ProductionRow
                      key={prod.id}
                      production={prod}
                      onPress={() => handleProductionSelect(prod)}
                    />
                  ))}
                  <Pressable
                    onPress={() => {
                      setSelectedWorkId(work.id);
                      setStep("create-production");
                    }}
                    className="py-2 pl-6"
                  >
                    <Text className="text-blue-600 text-sm">
                      + Add new production
                    </Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
          ListFooterComponent={
            query.length >= 2 && !searching ? (
              <Pressable
                onPress={() => {
                  setNewWorkTitle(query);
                  setStep("create-work");
                }}
                className="py-4 items-center"
              >
                <Text className="text-blue-600">
                  Can't find it? Add new work
                </Text>
              </Pressable>
            ) : null
          }
        />
      </KeyboardAvoidingView>
    );
  }

  // ---- Step: Create Work ----

  if (step === "create-work") {
    return (
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <Text className="text-lg font-bold mb-4">Add New Work</Text>

        <Text className="text-sm font-medium text-gray-700 mb-1">Title</Text>
        <TextInput
          value={newWorkTitle}
          onChangeText={setNewWorkTitle}
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">
          Media Type
        </Text>
        <View className="flex-row flex-wrap gap-2 mb-3">
          {(
            [
              "theatre",
              "musical",
              "opera",
              "dance",
              "circus",
              "concert",
              "other",
            ] as MediaType[]
          ).map((mt) => (
            <Pressable
              key={mt}
              onPress={() => setNewWorkMediaType(mt)}
              className={`px-3 py-1 rounded-full ${
                newWorkMediaType === mt ? "bg-black" : "bg-gray-200"
              }`}
            >
              <Text
                className={
                  newWorkMediaType === mt ? "text-white" : "text-gray-700"
                }
              >
                {mt}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text className="text-sm font-medium text-gray-700 mb-1">
          Creator (optional)
        </Text>
        <TextInput
          value={newWorkCreatorName}
          onChangeText={setNewWorkCreatorName}
          placeholder="Name"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-2"
        />
        <TextInput
          value={newWorkCreatorRole}
          onChangeText={setNewWorkCreatorRole}
          placeholder="Role (e.g., playwright)"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />

        <View className="flex-row gap-3 mb-8">
          <Pressable
            onPress={() => setStep("search")}
            className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
          >
            <Text className="font-medium">Back</Text>
          </Pressable>
          <Pressable
            onPress={handleCreateWork}
            disabled={!newWorkTitle.trim()}
            className="flex-1 py-3 rounded-lg bg-black items-center"
          >
            <Text className="text-white font-medium">Save Work</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  }

  // ---- Step: Create Production ----

  if (step === "create-production") {
    return (
      <ScrollView className="flex-1 bg-white px-4 pt-4">
        <Text className="text-lg font-bold mb-4">Add New Production</Text>

        <Text className="text-sm font-medium text-gray-700 mb-1">Venue</Text>
        <TextInput
          value={newProdVenue}
          onChangeText={setNewProdVenue}
          placeholder="e.g., Almeida Theatre"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">Year</Text>
        <TextInput
          value={newProdYear}
          onChangeText={setNewProdYear}
          keyboardType="numeric"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-3"
        />

        <Text className="text-sm font-medium text-gray-700 mb-1">
          Director (optional)
        </Text>
        <TextInput
          value={newProdDirector}
          onChangeText={setNewProdDirector}
          placeholder="Director name"
          className="border border-gray-300 rounded-lg px-4 py-2 mb-4"
        />

        <Pressable
          onPress={handleCreateProduction}
          className="py-3 rounded-lg bg-black items-center mb-8"
        >
          <Text className="text-white font-medium">Save Production</Text>
        </Pressable>
      </ScrollView>
    );
  }

  // ---- Step: Log Form ----

  const displayTitle =
    selectedProduction?.title_override ??
    selectedProduction?.venue ??
    "Selected production";

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      {/* Production info (read-only) */}
      <View className="mb-4 pb-4 border-b border-gray-200">
        <Text className="text-lg font-bold">{displayTitle}</Text>
        {selectedProduction?.venue && (
          <Text className="text-gray-500">{selectedProduction.venue}</Text>
        )}
      </View>

      {/* Date seen */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Date seen
        </Text>
        <TextInput
          value={dateSeen}
          onChangeText={setDateSeen}
          placeholder="YYYY-MM-DD"
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>

      {/* Rating */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>

      {/* Liked */}
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">Liked</Text>
        <HeartButton value={liked} onChange={setLiked} />
      </View>

      {/* Rewatch */}
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">
          Seen this production before?
        </Text>
        <Pressable
          onPress={() => setIsRewatch(!isRewatch)}
          className={`px-3 py-1 rounded-full ${
            isRewatch ? "bg-black" : "bg-gray-200"
          }`}
        >
          <Text className={isRewatch ? "text-white" : "text-gray-700"}>
            {isRewatch ? "Yes" : "No"}
          </Text>
        </Pressable>
      </View>

      {/* Review */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Review</Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Write your thoughts..."
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] text-base"
          textAlignVertical="top"
        />
      </View>

      {/* Tags */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Tags</Text>
        <TagInput value={tags} onChange={setTags} />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3 mb-8">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
        >
          <Text className="font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-lg bg-black items-center"
        >
          <Text className="text-white font-medium">
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 4: Create `app/log/[id].tsx` (edit mode)**

```tsx
// app/log/[id].tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../lib/auth-context";
import {
  updateLogEntry,
  deleteLogEntry,
} from "../../lib/api/log-entries";
import { supabase } from "../../lib/supabase";
import { LogEntryWithProduction } from "../../lib/types";
import StarRating from "../../components/StarRating";
import HeartButton from "../../components/HeartButton";
import TagInput from "../../components/TagInput";

export default function EditLogEntryScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [entry, setEntry] = useState<LogEntryWithProduction | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [dateSeen, setDateSeen] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [liked, setLiked] = useState(false);
  const [isRewatch, setIsRewatch] = useState(false);
  const [review, setReview] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    loadEntry();
  }, [id]);

  async function loadEntry() {
    const { data, error } = await supabase
      .from("log_entries")
      .select("*, production:productions(*, work:works(*))")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error(error);
      router.back();
      return;
    }

    setEntry(data as LogEntryWithProduction);
    setDateSeen(data.date_seen);
    setRating(data.rating);
    setLiked(data.liked);
    setIsRewatch(data.is_rewatch);
    setReview(data.review ?? "");
    setTags(data.tags ?? []);
    setLoading(false);
  }

  async function handleSave() {
    if (!id) return;
    setSaving(true);
    try {
      await updateLogEntry(id, {
        date_seen: dateSeen,
        rating,
        review: review || null,
        liked,
        tags,
        is_rewatch: isRewatch,
      });
      router.back();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    Alert.alert("Delete Entry", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteLogEntry(id!);
            router.back();
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  }

  if (loading || !entry) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const title =
    entry.production.title_override ??
    entry.production.work?.title ??
    "Unknown";

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      {/* Production info (read-only) */}
      <View className="mb-4 pb-4 border-b border-gray-200">
        <Text className="text-lg font-bold">{title}</Text>
        {entry.production.venue && (
          <Text className="text-gray-500">{entry.production.venue}</Text>
        )}
      </View>

      {/* Date */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">
          Date seen
        </Text>
        <TextInput
          value={dateSeen}
          onChangeText={setDateSeen}
          className="border border-gray-300 rounded-lg px-4 py-2"
        />
      </View>

      {/* Rating */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Rating</Text>
        <StarRating value={rating} onChange={setRating} />
      </View>

      {/* Liked */}
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">Liked</Text>
        <HeartButton value={liked} onChange={setLiked} />
      </View>

      {/* Rewatch */}
      <View className="mb-4 flex-row items-center gap-2">
        <Text className="text-sm font-medium text-gray-700">
          Seen this production before?
        </Text>
        <Pressable
          onPress={() => setIsRewatch(!isRewatch)}
          className={`px-3 py-1 rounded-full ${
            isRewatch ? "bg-black" : "bg-gray-200"
          }`}
        >
          <Text className={isRewatch ? "text-white" : "text-gray-700"}>
            {isRewatch ? "Yes" : "No"}
          </Text>
        </Pressable>
      </View>

      {/* Review */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Review</Text>
        <TextInput
          value={review}
          onChangeText={setReview}
          placeholder="Write your thoughts..."
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg px-4 py-2 min-h-[100px] text-base"
          textAlignVertical="top"
        />
      </View>

      {/* Tags */}
      <View className="mb-4">
        <Text className="text-sm font-medium text-gray-700 mb-1">Tags</Text>
        <TagInput value={tags} onChange={setTags} />
      </View>

      {/* Actions */}
      <View className="flex-row gap-3 mb-4">
        <Pressable
          onPress={() => router.back()}
          className="flex-1 py-3 rounded-lg bg-gray-200 items-center"
        >
          <Text className="font-medium">Cancel</Text>
        </Pressable>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          className="flex-1 py-3 rounded-lg bg-black items-center"
        >
          <Text className="text-white font-medium">
            {saving ? "Saving..." : "Save"}
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={handleDelete} className="py-3 items-center mb-8">
        <Text className="text-red-500 font-medium">Delete Entry</Text>
      </Pressable>
    </ScrollView>
  );
}
```

- [ ] **Step 5: Verify the log flow works**

Run: `npx expo start --web`

Expected: Tapping + on the Diary opens the search step. Typing shows search results. Selecting a production shows the log form. Saving creates a log entry visible in the diary. Tapping a diary entry opens edit mode with pre-filled data.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: implement Log Entry screen with search, inline creation, and edit mode"
```

---

### Task 10: Search Screen

**Files:**
- Modify: `app/(tabs)/search.tsx`

- [ ] **Step 1: Implement the Search screen**

Replace `app/(tabs)/search.tsx` with:

```tsx
// app/(tabs)/search.tsx
import { useState } from "react";
import { View, TextInput, FlatList, Pressable, Text } from "react-native";
import { useRouter } from "expo-router";
import { searchWorks } from "../../lib/api/works";
import { getProductionsByWork } from "../../lib/api/productions";
import { WorkWithProductionCount, Production } from "../../lib/types";
import WorkSearchResult from "../../components/WorkSearchResult";
import ProductionRow from "../../components/ProductionRow";

export default function SearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<WorkWithProductionCount[]>([]);
  const [expandedWorkId, setExpandedWorkId] = useState<string | null>(null);
  const [workProductions, setWorkProductions] = useState<Production[]>([]);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }
    try {
      const data = await searchWorks(text);
      setResults(data);
    } catch (e) {
      console.error(e);
    }
  }

  async function handleWorkPress(workId: string) {
    if (expandedWorkId === workId) {
      setExpandedWorkId(null);
      return;
    }
    setExpandedWorkId(workId);
    try {
      const prods = await getProductionsByWork(workId);
      setWorkProductions(prods);
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <View className="flex-1 bg-white">
      <View className="px-4 pt-2 pb-2">
        <TextInput
          value={query}
          onChangeText={handleSearch}
          placeholder="Search works and productions..."
          className="border border-gray-300 rounded-lg px-4 py-3 text-base"
        />
      </View>

      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        className="px-4"
        renderItem={({ item: work }) => (
          <View>
            <WorkSearchResult
              work={work}
              onPress={() => handleWorkPress(work.id)}
              expanded={expandedWorkId === work.id}
            />
            {expandedWorkId === work.id &&
              workProductions.map((prod) => (
                <View key={prod.id} className="flex-row items-center">
                  <Pressable
                    onPress={() => router.push(`/production/${prod.id}`)}
                    className="flex-1 py-2 pl-6 border-b border-gray-50"
                  >
                    <Text className="text-sm">
                      {prod.venue ?? "Unknown venue"}
                      {prod.year ? `, ${prod.year}` : ""}
                    </Text>
                    {prod.director && (
                      <Text className="text-xs text-gray-400">
                        dir. {prod.director}
                      </Text>
                    )}
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      router.push({
                        pathname: "/log/new",
                        params: {
                          productionId: prod.id,
                          productionTitle:
                            prod.title_override ?? work.title,
                          productionVenue: prod.venue ?? "",
                        },
                      })
                    }
                    className="px-3 py-1 bg-black rounded-full mr-4"
                  >
                    <Text className="text-white text-xs">Log</Text>
                  </Pressable>
                </View>
              ))}
          </View>
        )}
      />
    </View>
  );
}
```

- [ ] **Step 2: Verify Search screen**

Run: `npx expo start --web`

Expected: The Search tab shows a search bar. Typing returns matching works. Expanding a work shows productions with a "Log" button. Tapping a production navigates to Production Detail. Tapping "Log" navigates to the log form with the production pre-selected.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Search screen with work and production browsing"
```

---

### Task 11: Production Detail Screen

**Files:**
- Create: `app/production/[id].tsx`

- [ ] **Step 1: Implement the Production Detail screen**

```tsx
// app/production/[id].tsx
import { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../lib/auth-context";
import { getProduction } from "../../lib/api/productions";
import { getLogEntriesForProduction } from "../../lib/api/log-entries";
import { addToWishlist } from "../../lib/api/wishlist";
import { Production, Work, LogEntry } from "../../lib/types";
import StarRatingDisplay from "../../components/StarRatingDisplay";
import MediaTypeBadge from "../../components/MediaTypeBadge";

export default function ProductionDetailScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [production, setProduction] = useState<
    (Production & { work: Work | null }) | null
  >(null);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    if (!id || !session) return;
    try {
      const [prod, entries] = await Promise.all([
        getProduction(id),
        getLogEntriesForProduction(id, session.user.id),
      ]);
      setProduction(prod);
      setLogEntries(entries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddToWishlist() {
    if (!session || !id) return;
    try {
      await addToWishlist({ user_id: session.user.id, production_id: id });
    } catch (e) {
      console.error(e);
    }
  }

  if (loading || !production) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const title =
    production.title_override ?? production.work?.title ?? "Unknown";
  const work = production.work;

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 pt-4 pb-4 border-b border-gray-200">
        {production.poster_url && (
          <Image
            source={{ uri: production.poster_url }}
            className="w-full h-48 rounded-lg mb-3"
            resizeMode="cover"
          />
        )}
        <Text className="text-2xl font-bold">{title}</Text>
        <Text className="text-gray-500 mt-1">
          {production.venue ?? "Unknown venue"}
          {production.year ? `, ${production.year}` : ""}
        </Text>
        {production.director && (
          <Text className="text-gray-500">dir. {production.director}</Text>
        )}
        {production.start_date && production.end_date && (
          <Text className="text-sm text-gray-400 mt-1">
            {production.start_date} — {production.end_date}
          </Text>
        )}
        {work && <MediaTypeBadge type={work.media_type} />}
      </View>

      {/* Creators from Work */}
      {work && work.creators.length > 0 && (
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="font-semibold mb-2">Creators</Text>
          {work.creators.map((c, i) => (
            <Text key={i} className="text-sm text-gray-600">
              {c.name} ({c.role})
            </Text>
          ))}
        </View>
      )}

      {/* Cast from Production */}
      {production.cast_members.length > 0 && (
        <View className="px-4 py-3 border-b border-gray-100">
          <Text className="font-semibold mb-2">Cast</Text>
          {production.cast_members.map((c, i) => (
            <Text key={i} className="text-sm text-gray-600">
              {c.name}
              {c.role ? ` as ${c.role}` : ""}
            </Text>
          ))}
        </View>
      )}

      {/* User's log entries for this production */}
      <View className="px-4 py-3 border-b border-gray-100">
        <Text className="font-semibold mb-2">Your Log Entries</Text>
        {logEntries.length === 0 ? (
          <Text className="text-gray-400 text-sm">
            You haven't logged this production yet.
          </Text>
        ) : (
          logEntries.map((entry) => (
            <Pressable
              key={entry.id}
              onPress={() => router.push(`/log/${entry.id}`)}
              className="py-2 border-b border-gray-50"
            >
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-gray-500">
                  {new Date(entry.date_seen + "T00:00:00").toLocaleDateString(
                    "en-GB",
                    { day: "numeric", month: "short", year: "numeric" }
                  )}
                </Text>
                {entry.rating != null && (
                  <StarRatingDisplay value={entry.rating} size={12} />
                )}
                {entry.liked && (
                  <Ionicons name="heart" size={12} color="#ef4444" />
                )}
              </View>
              {entry.review && (
                <Text
                  className="text-sm text-gray-600 mt-1"
                  numberOfLines={2}
                >
                  {entry.review}
                </Text>
              )}
            </Pressable>
          ))
        )}
      </View>

      {/* Actions */}
      <View className="px-4 py-4 gap-3">
        <Pressable
          onPress={() =>
            router.push({
              pathname: "/log/new",
              params: {
                productionId: production.id,
                productionTitle: title,
                productionVenue: production.venue ?? "",
              },
            })
          }
          className="py-3 rounded-lg bg-black items-center"
        >
          <Text className="text-white font-medium">Log this production</Text>
        </Pressable>

        <Pressable
          onPress={handleAddToWishlist}
          className="py-3 rounded-lg bg-gray-200 items-center"
        >
          <Text className="font-medium">Add to wishlist</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify Production Detail**

Run: `npx expo start --web`

Expected: Navigating to a production (from Search results) shows production info, creators, cast, user's log entries, and action buttons.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Production Detail screen"
```

---

### Task 12: Wishlist Screen

**Files:**
- Modify: `app/(tabs)/wishlist.tsx`

- [ ] **Step 1: Implement the Wishlist screen**

Replace `app/(tabs)/wishlist.tsx` with:

```tsx
// app/(tabs)/wishlist.tsx
import { useState, useCallback } from "react";
import { View, Text, FlatList, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth-context";
import { getWishlist, removeFromWishlist } from "../../lib/api/wishlist";
import { WishlistItemWithDetails } from "../../lib/types";
import EmptyState from "../../components/EmptyState";

export default function WishlistScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<WishlistItemWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadWishlist();
    }, [session])
  );

  async function loadWishlist() {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getWishlist(session.user.id);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id: string) {
    Alert.alert("Remove", "Remove from wishlist?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeFromWishlist(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
          } catch (e) {
            console.error(e);
          }
        },
      },
    ]);
  }

  function handlePress(item: WishlistItemWithDetails) {
    if (item.production_id) {
      router.push(`/production/${item.production_id}`);
    }
    // If targeting a work, we'd navigate to a work page — but that's post-MVP.
    // For now, do nothing for work-targeted items.
  }

  if (items.length === 0 && !loading) {
    return (
      <EmptyState message="Nothing on your list yet. Browse shows and tap the bookmark icon to add." />
    );
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      className="flex-1 bg-white"
      renderItem={({ item }) => {
        const title = item.production
          ? item.production.title_override ??
            item.production.work?.title ??
            "Unknown"
          : item.work?.title ?? "Unknown";
        const subtitle = item.production?.venue
          ? `${item.production.venue}${
              item.production.year ? `, ${item.production.year}` : ""
            }`
          : null;

        const dateAdded = new Date(item.created_at).toLocaleDateString(
          "en-GB",
          { day: "numeric", month: "short", year: "numeric" }
        );

        return (
          <Pressable
            onPress={() => handlePress(item)}
            className="px-4 py-3 border-b border-gray-100 flex-row items-center"
          >
            <View className="flex-1">
              <Text className="font-semibold">{title}</Text>
              {subtitle && (
                <Text className="text-sm text-gray-500">{subtitle}</Text>
              )}
              {item.notes && (
                <Text className="text-sm text-gray-400 mt-1" numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
              <Text className="text-xs text-gray-300 mt-1">
                Added {dateAdded}
              </Text>
            </View>
            <Pressable onPress={() => handleRemove(item.id)} className="p-2">
              <Text className="text-red-400 text-sm">Remove</Text>
            </Pressable>
          </Pressable>
        );
      }}
    />
  );
}
```

- [ ] **Step 2: Verify Wishlist**

Run: `npx expo start --web`

Expected: Wishlist tab shows empty state when no items. Adding to wishlist from Production Detail populates the list. Remove button works.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Wishlist screen"
```

---

### Task 13: Stats Screen

**Files:**
- Modify: `app/(tabs)/stats.tsx`

- [ ] **Step 1: Implement the Stats screen**

Replace `app/(tabs)/stats.tsx` with:

```tsx
// app/(tabs)/stats.tsx
import { useState, useCallback } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../../lib/auth-context";
import { getStats } from "../../lib/api/stats";
import { Stats } from "../../lib/types";

export default function StatsScreen() {
  const { session } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [session])
  );

  async function loadStats() {
    if (!session) return;
    setLoading(true);
    try {
      const data = await getStats(session.user.id);
      setStats(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !stats) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const maxRatingCount = Math.max(
    ...stats.ratingDistribution.map((r) => r.count),
    1
  );

  return (
    <ScrollView className="flex-1 bg-white px-4 pt-4">
      {/* Summary cards */}
      <View className="flex-row gap-3 mb-6">
        <View className="flex-1 bg-gray-50 rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.totalShows}</Text>
          <Text className="text-xs text-gray-500 mt-1">Total shows</Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.showsThisYear}</Text>
          <Text className="text-xs text-gray-500 mt-1">This year</Text>
        </View>
        <View className="flex-1 bg-gray-50 rounded-lg p-4 items-center">
          <Text className="text-2xl font-bold">{stats.venuesVisited}</Text>
          <Text className="text-xs text-gray-500 mt-1">Venues</Text>
        </View>
      </View>

      {/* Rating distribution */}
      {stats.ratingDistribution.length > 0 && (
        <View className="mb-6">
          <Text className="font-semibold mb-3">Rating Distribution</Text>
          {stats.ratingDistribution.map(({ rating, count }) => (
            <View key={rating} className="flex-row items-center mb-1">
              <Text className="w-10 text-xs text-gray-500 text-right mr-2">
                {rating}
              </Text>
              <View className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <View
                  className="h-full bg-amber-400 rounded"
                  style={{ width: `${(count / maxRatingCount) * 100}%` }}
                />
              </View>
              <Text className="w-8 text-xs text-gray-500 text-right ml-2">
                {count}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* By media type */}
      {stats.byMediaType.length > 0 && (
        <View className="mb-6">
          <Text className="font-semibold mb-3">By Media Type</Text>
          {stats.byMediaType.map(({ media_type, count }) => (
            <View
              key={media_type}
              className="flex-row justify-between py-2 border-b border-gray-50"
            >
              <Text className="text-gray-700 capitalize">{media_type}</Text>
              <Text className="text-gray-500">{count}</Text>
            </View>
          ))}
        </View>
      )}

      {/* By year */}
      {stats.byYear.length > 0 && (
        <View className="mb-8">
          <Text className="font-semibold mb-3">By Year</Text>
          {stats.byYear.map(({ year, count }) => (
            <View
              key={year}
              className="flex-row justify-between py-2 border-b border-gray-50"
            >
              <Text className="text-gray-700">{year}</Text>
              <Text className="text-gray-500">{count}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
```

- [ ] **Step 2: Verify Stats screen**

Run: `npx expo start --web`

Expected: Stats tab shows summary cards (total, this year, venues), rating distribution bar chart, and breakdowns by media type and year. Values update as log entries are added.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Stats screen with rating distribution and breakdowns"
```

---

### Task 14: Settings Screen

**Files:**
- Modify: `app/(tabs)/settings.tsx`

- [ ] **Step 1: Implement the Settings screen**

Replace `app/(tabs)/settings.tsx` with:

```tsx
// app/(tabs)/settings.tsx
import { View, Text, Pressable, Alert, Share } from "react-native";
import { useAuth } from "../../lib/auth-context";
import { supabase } from "../../lib/supabase";

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  async function handleExportData() {
    if (!session) return;
    try {
      const { data: entries, error } = await supabase
        .from("log_entries")
        .select(
          "date_seen, rating, review, liked, tags, is_rewatch, production:productions(venue, year, title_override, work:works(title, media_type))"
        )
        .eq("user_id", session.user.id)
        .order("date_seen", { ascending: false });

      if (error) throw error;

      const csv = [
        "date_seen,title,venue,year,rating,liked,rewatch,tags,review",
        ...(entries ?? []).map((e: any) => {
          const title =
            e.production?.title_override ??
            e.production?.work?.title ??
            "";
          const venue = e.production?.venue ?? "";
          const year = e.production?.year ?? "";
          const review = (e.review ?? "").replace(/"/g, '""');
          const tags = (e.tags ?? []).join("; ");
          return `${e.date_seen},"${title}","${venue}",${year},${e.rating ?? ""},${e.liked},${e.is_rewatch},"${tags}","${review}"`;
        }),
      ].join("\n");

      await Share.share({
        message: csv,
        title: "Transient Export",
      });
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to export data.");
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  }

  return (
    <View className="flex-1 bg-white px-4 pt-4">
      {/* User info */}
      <View className="mb-6 pb-4 border-b border-gray-200">
        <Text className="text-sm text-gray-500">Signed in as</Text>
        <Text className="text-base font-medium">
          {session?.user.email ?? "Unknown"}
        </Text>
      </View>

      {/* Data export */}
      <Pressable
        onPress={handleExportData}
        className="py-3 border-b border-gray-100"
      >
        <Text className="text-base">Export my data (CSV)</Text>
        <Text className="text-sm text-gray-400">
          Download all your log entries
        </Text>
      </Pressable>

      {/* About */}
      <View className="py-3 border-b border-gray-100">
        <Text className="text-base">About</Text>
        <Text className="text-sm text-gray-400">Transient v1.0.0</Text>
      </View>

      {/* Sign out */}
      <Pressable onPress={handleSignOut} className="py-4 mt-6 items-center">
        <Text className="text-red-500 font-medium text-base">Sign Out</Text>
      </Pressable>
    </View>
  );
}
```

- [ ] **Step 2: Verify Settings screen**

Run: `npx expo start --web`

Expected: Settings tab shows user email, export button, about section, and sign out button. Sign out redirects to login. Export triggers the share dialog with CSV data.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: implement Settings screen with data export and sign out"
```

- [ ] **Step 4: Run all tests**

Run: `npx jest`

Expected: All API and component tests pass.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "chore: complete Transient v1 implementation"
```
