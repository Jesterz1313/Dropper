import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export type ReleaseData = {
  id: string;
  slug: string;
  title: string;
  artist: string;
  cover_url: string | null;
  spotify_url: string | null;
  apple_music_url: string | null;
  telegram_url: string | null;
  soundcloud_url: string | null;
  download_url: string | null;
};

export type ContactData = {
  id: string;
  email: string;
  release_id: string;
  created_at: string;
};
