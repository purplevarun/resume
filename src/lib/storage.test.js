import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import {
	clearLocalStorage,
	loadFromLocalStorage,
	saveToLocalStorage,
} from "./storage.js";

const LS_KEY = "purpleresume_data_v2";
const LEGACY_LS_KEY = "purpleresume_data";
const browserStorage = new Map();

beforeEach(() => {
	browserStorage.clear();
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: (key) => browserStorage.get(key) ?? null,
			setItem: (key, value) => browserStorage.set(key, String(value)),
			removeItem: (key) => browserStorage.delete(key),
		},
	});
});

test("saves and loads the resume draft", () => {
	const resumeData = { header: { name: "Casey Example" }, sections: [] };

	saveToLocalStorage(resumeData);

	assert.deepEqual(loadFromLocalStorage(), resumeData);
	assert.equal(browserStorage.has(LS_KEY), true);
});

test("falls back to a legacy draft when no current draft exists", () => {
	const legacyData = { header: { name: "Legacy" }, sections: [] };
	browserStorage.set(LEGACY_LS_KEY, JSON.stringify(legacyData));

	assert.deepEqual(loadFromLocalStorage(), legacyData);
});

test("prefers the current draft over a legacy draft", () => {
	const legacyData = { header: { name: "Legacy" } };
	const currentData = { header: { name: "Current" } };
	browserStorage.set(LEGACY_LS_KEY, JSON.stringify(legacyData));
	browserStorage.set(LS_KEY, JSON.stringify(currentData));

	assert.deepEqual(loadFromLocalStorage(), currentData);
});

test("returns null for empty, invalid, or non-object stored content", () => {
	assert.equal(loadFromLocalStorage(), null);

	browserStorage.set(LS_KEY, "{not json");
	assert.equal(loadFromLocalStorage(), null);

	browserStorage.set(LS_KEY, JSON.stringify(["not", "an", "object"]));
	assert.equal(loadFromLocalStorage(), null);
});

test("ignores non-object data on save", () => {
	saveToLocalStorage("not an object");
	saveToLocalStorage(null);

	assert.equal(browserStorage.size, 0);
});

test("clear removes both current and legacy drafts", () => {
	browserStorage.set(LS_KEY, JSON.stringify({ sections: [] }));
	browserStorage.set(LEGACY_LS_KEY, JSON.stringify({ sections: [] }));

	clearLocalStorage();

	assert.equal(browserStorage.size, 0);
	assert.equal(loadFromLocalStorage(), null);
});

test("keeps working when browser storage is unavailable", () => {
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: () => {
				throw new Error("Storage blocked");
			},
			setItem: () => {
				throw new Error("Storage blocked");
			},
			removeItem: () => {
				throw new Error("Storage blocked");
			},
		},
	});

	assert.doesNotThrow(() => saveToLocalStorage({ sections: [] }));
	assert.doesNotThrow(() => clearLocalStorage());
	assert.equal(loadFromLocalStorage(), null);
});
