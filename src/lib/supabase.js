import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lwbhllwznsqniwtbrhqc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3YmhsbHd6bnNxbml3dGJyaHFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5MjI2MTUsImV4cCI6MjA5NDQ5ODYxNX0._DCPCFvwh4E-qSFCg4pLUmm17ORtFcyO80uM_tl5YaM";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);