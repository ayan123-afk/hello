// supabase.js
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

export const SUPABASE_URL = 'https://lkwtqyqjccurtpvhutsj.supabase.co';
export const SUPABASE_KEY = 'sb_publishable_rcK2wyn_PsxA8QDzu8YzVA_iJoVrawj';
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
