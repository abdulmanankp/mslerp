import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://fgdeqzjvirmfqsjxortu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_unWLdAZGpqhtgbzCxDBBBg_ozfhjLl6";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
