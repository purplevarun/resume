const LS_KEY = "purpleresume_data_v2";
const LEGACY_LS_KEY = "purpleresume_data";

export function saveToLocalStorage(data) {
	if (!isObject(data)) return;

	try {
		localStorage.setItem(LS_KEY, JSON.stringify(data));
	} catch {
		// Storage can fail (quota, private-browsing lockdown, etc).
		// Editing should keep working even if persistence doesn't.
	}
}

export function loadFromLocalStorage() {
	for (const key of [LS_KEY, LEGACY_LS_KEY]) {
		try {
			const raw = localStorage.getItem(key);
			if (!raw) continue;
			const parsed = JSON.parse(raw);
			if (isObject(parsed)) return parsed;
		} catch {
			// Ignore invalid stored content and unavailable storage.
		}
	}

	return null;
}

export function clearLocalStorage() {
	for (const key of [LS_KEY, LEGACY_LS_KEY]) {
		try {
			localStorage.removeItem(key);
		} catch {
			// Ignore unavailable storage.
		}
	}
}

function isObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}
