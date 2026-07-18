const LS_KEY = "purpleresume_data_v2";
const LEGACY_LS_KEY = "purpleresume_data";

export function saveToLocalStorage(data) {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(data));
	} catch {
		// Storage can fail (quota, private-browsing lockdown, etc).
		// Editing should keep working even if persistence doesn't.
	}
}

export function loadFromLocalStorage() {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return null;
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

export function clearLocalStorage() {
	try {
		localStorage.removeItem(LS_KEY);
		localStorage.removeItem(LEGACY_LS_KEY);
	} catch {
		// ignore
	}
}
