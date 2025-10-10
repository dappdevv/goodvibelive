"use client";

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string | undefined;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as
  | string
  | undefined;

if (!url || !anonKey) {
  // We avoid throwing to not break the whole app in dev; auth UI will show error
  // eslint-disable-next-line no-console
  console.warn(
    "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(url || "", anonKey || "");

export default supabase;


