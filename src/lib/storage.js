import { getSupabaseClient } from "./supabase.js";

const USERS_KEY = "purpleresume_users_v1";
const LS_KEY = "purpleresume_data_v2";
const LEGACY_LS_KEY = "purpleresume_data";
const RESUME_SYNC_TABLE = "resume_sync";

export function findUser(username) {
	const users = readUsers();
	const key = getUserKey(username);
	const user = key ? users[key] : null;
	return user ? sanitizeUser(user) : null;
}

export async function registerUser(username, password) {
	const trimmedUsername = normalizeUsername(username);
	if (!trimmedUsername) {
		return { ok: false, error: "Enter a username." };
	}

	if (!password) {
		return { ok: false, error: "Enter a password." };
	}

	const users = readUsers();
	const key = getUserKey(trimmedUsername);
	if (users[key]) {
		return { ok: false, error: "That username already exists." };
	}

	const user = {
		username: trimmedUsername,
		passwordHash: await hashPassword(password),
		resumeData: getLegacySeedData(users),
	};
	users[key] = user;
	writeUsers(users);

	return { ok: true, user: sanitizeUser(user) };
}

export async function authenticateUser(username, password) {
	const trimmedUsername = normalizeUsername(username);
	if (!trimmedUsername) {
		return { ok: false, error: "Enter a username." };
	}

	if (!password) {
		return { ok: false, error: "Enter a password." };
	}

	const users = readUsers();
	const key = getUserKey(trimmedUsername);
	const user = users[key];
	if (!user) {
		return { ok: false, error: "User not found." };
	}

	const passwordHash = await hashPassword(password);
	if (user.passwordHash !== passwordHash) {
		return { ok: false, error: "Incorrect password." };
	}

	return { ok: true, user: sanitizeUser(user) };
}

export function saveToLocalStorage(username, data) {
	const trimmedUsername = normalizeUsername(username);
	if (!trimmedUsername) return;

	try {
		const users = readUsers();
		const key = getUserKey(trimmedUsername);
		const existingUser = users[key];
		if (!existingUser) return;

		users[key] = {
			...existingUser,
			resumeData: data,
		};
		writeUsers(users);
	} catch {
		// Storage can fail (quota, private-browsing lockdown, etc).
		// Editing should keep working even if persistence doesn't.
	}
}

export function loadFromLocalStorage(username) {
	const trimmedUsername = normalizeUsername(username);
	if (!trimmedUsername) return null;

	try {
		const users = readUsers();
		const key = getUserKey(trimmedUsername);
		return users[key]?.resumeData ?? null;
	} catch {
		return null;
	}
}

export function clearLocalStorage(username) {
	const trimmedUsername = normalizeUsername(username);
	if (!trimmedUsername) return;

	try {
		const users = readUsers();
		const key = getUserKey(trimmedUsername);
		const existingUser = users[key];
		if (!existingUser) return;

		users[key] = {
			...existingUser,
			resumeData: null,
		};
		writeUsers(users);
	} catch {
		// ignore
	}
}

export async function uploadResumeToSupabase({ username, syncKey, data }) {
	if (!username || !syncKey || !isObject(data)) {
		return { ok: false, error: "Missing sync credentials or resume data." };
	}

	const supabase = getSupabaseClient();
	if (!supabase) {
		return {
			ok: false,
			error: "Missing Supabase env vars (VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY).",
		};
	}

	const normalizedUsername = normalizeUsername(username);

	try {
		const { data: savedRow, error } = await supabase
			.from(RESUME_SYNC_TABLE)
			.upsert(
				{
					username: normalizedUsername,
					sync_key: syncKey,
					resume_data: data,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "username,sync_key" },
			)
			.select("updated_at")
			.single();

		if (error) {
			return {
				ok: false,
				error: error.message || "Upload failed.",
			};
		}

		return {
			ok: true,
			updatedAt: savedRow?.updated_at ?? null,
		};
	} catch {
		return { ok: false, error: "Upload failed due to a network error." };
	}
}

export async function downloadResumeFromSupabase({ username, syncKey }) {
	if (!username || !syncKey) {
		return { ok: false, error: "Missing sync credentials." };
	}

	const supabase = getSupabaseClient();
	if (!supabase) {
		return {
			ok: false,
			error: "Missing Supabase env vars (VITE_PUBLIC_SUPABASE_URL and VITE_PUBLIC_SUPABASE_ANON_KEY).",
		};
	}

	const normalizedUsername = normalizeUsername(username);

	try {
		const { data: row, error } = await supabase
			.from(RESUME_SYNC_TABLE)
			.select("resume_data, updated_at")
			.eq("username", normalizedUsername)
			.eq("sync_key", syncKey)
			.maybeSingle();

		if (error) {
			return {
				ok: false,
				error: error.message || "Download failed.",
			};
		}

		return {
			ok: true,
			data: row?.resume_data ?? null,
			updatedAt: row?.updated_at ?? null,
		};
	} catch {
		return { ok: false, error: "Download failed due to a network error." };
	}
}

function readUsers() {
	try {
		const raw = localStorage.getItem(USERS_KEY);
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return isObject(parsed) ? parsed : {};
	} catch {
		return {};
	}
}

function writeUsers(users) {
	localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function normalizeUsername(username) {
	return String(username ?? "").trim();
}

function getUserKey(username) {
	const trimmedUsername = normalizeUsername(username);
	return trimmedUsername ? trimmedUsername.toLowerCase() : "";
}

function sanitizeUser(user) {
	return {
		username: user.username,
		syncKey: user.passwordHash,
		resumeData: user.resumeData ?? null,
	};
}

function getLegacySeedData(users) {
	if (Object.keys(users).length > 0) return null;
	return readLegacyResume();
}

function readLegacyResume() {
	for (const key of [LS_KEY, LEGACY_LS_KEY]) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			return JSON.parse(raw);
		} catch {
			// ignore invalid legacy content
		}
	}

	return null;
}

async function hashPassword(password) {
	if (!globalThis.crypto?.subtle) {
		return `plain:${password}`;
	}

	const bytes = new TextEncoder().encode(password);
	const buffer = await globalThis.crypto.subtle.digest("SHA-256", bytes);
	return Array.from(new Uint8Array(buffer), (value) =>
		value.toString(16).padStart(2, "0"),
	).join("");
}

function isObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
