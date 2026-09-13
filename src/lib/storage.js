import { DEFAULT_DATA } from "../data/defaultResume.js";
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
	if (Object.hasOwn(users, key)) {
		return {
			ok: false,
			error: "That username already exists. Sign in instead.",
		};
	}

	const user = {
		username: trimmedUsername,
		passwordHash: await hashPassword(password),
		resumeData: getLegacySeedData(users) ?? DEFAULT_DATA,
	};
	const supabase = getSupabaseClient();
	if (supabase) {
		try {
			const { data: existingUser, error: lookupError } = await supabase
				.from(RESUME_SYNC_TABLE)
				.select("username")
				.ilike("username", trimmedUsername.replace(/[\\%_]/g, "\\$&"))
				.limit(1)
				.maybeSingle();
			if (lookupError) {
				return {
					ok: false,
					error: "Unable to check your account with cloud storage. Please try again.",
				};
			}
			if (existingUser) {
				return {
					ok: false,
					error: "That username already exists. Sign in instead.",
				};
			}

			const { error } = await supabase.from(RESUME_SYNC_TABLE).insert({
				username: user.username,
				sync_key: user.passwordHash,
				resume_data: user.resumeData,
				updated_at: new Date().toISOString(),
			});
			if (error) {
				return {
					ok: false,
					error:
						error.code === "23505"
							? "That username already exists. Sign in instead."
							: "Unable to create your account in cloud storage. Please try again.",
				};
			}
		} catch {
			return {
				ok: false,
				error: "Unable to reach cloud storage. Check your connection and try again.",
			};
		}
	}

	try {
		writeUsers({ ...readUsers(), [key]: user });
	} catch {
		return {
			ok: false,
			error: supabase
				? "Your cloud account was created, but browser storage is unavailable. Allow site storage, then sign in."
				: "Browser storage is unavailable. Allow site storage and try again.",
		};
	}

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
	const passwordHash = await hashPassword(password);
	if (user?.passwordHash === passwordHash) {
		return { ok: true, user: sanitizeUser(user) };
	}

	if (!getSupabaseClient()) {
		return {
			ok: false,
			error: user
				? "Incorrect username or password."
				: "This account is not saved in this browser, and cloud sign-in is not configured.",
		};
	}

	const cloudResult = await downloadResumeFromSupabase({
		username: trimmedUsername,
		syncKey: passwordHash,
	});
	if (!cloudResult.ok) {
		return {
			ok: false,
			error: `Unable to verify your account with cloud storage. ${cloudResult.error}`,
		};
	}
	if (!cloudResult.data) {
		return {
			ok: false,
			error: "Username or password is incorrect, or this account has not been synced yet.",
		};
	}

	const restoredUser = {
		username: cloudResult.username ?? trimmedUsername,
		passwordHash,
		resumeData: cloudResult.data,
	};
	try {
		writeUsers({ ...readUsers(), [key]: restoredUser });
	} catch {
		return {
			ok: false,
			error: "Browser storage is unavailable. Allow site storage and try again.",
		};
	}

	return { ok: true, user: sanitizeUser(restoredUser) };
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
			.select("username, resume_data, updated_at")
			.ilike("username", normalizedUsername.replace(/[\\%_]/g, "\\$&"))
			.eq("sync_key", syncKey)
			.order("updated_at", { ascending: false })
			.limit(1)
			.maybeSingle();

		if (error) {
			return {
				ok: false,
				error: error.message || "Download failed.",
			};
		}

		return {
			ok: true,
			username: row?.username ?? null,
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
		throw new Error(
			"Sign-in requires a secure connection. Use HTTPS or localhost.",
		);
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
