import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = normalizeEnv(import.meta.env.VITE_PUBLIC_SUPABASE_URL);
const SUPABASE_ANON_KEY = normalizeEnv(
	import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
);

let cachedClient = null;

export function getSupabaseClient() {
	if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
		return null;
	}

	if (!cachedClient) {
		cachedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
			auth: {
				persistSession: false,
				autoRefreshToken: false,
			},
		});
	}

	return cachedClient;
}

function normalizeEnv(value) {
	const trimmed = String(value ?? "").trim();
	if (!trimmed) return "";

	const maybeQuoted = trimmed.match(/^(["'])([\s\S]*)\1$/);
	return maybeQuoted ? maybeQuoted[2].trim() : trimmed;
}
