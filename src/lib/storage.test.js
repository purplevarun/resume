import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { beforeEach, mock, test } from "node:test";

const browserStorage = new Map();
let supabaseClient = null;

mock.module(new URL("./supabase.js", import.meta.url), {
	namedExports: { getSupabaseClient: () => supabaseClient },
});

const { authenticateUser, loadFromLocalStorage, registerUser } =
	await import("./storage.js");

beforeEach(() => {
	browserStorage.clear();
	supabaseClient = null;
	Object.defineProperty(globalThis, "localStorage", {
		configurable: true,
		value: {
			getItem: (key) => browserStorage.get(key) ?? null,
			setItem: (key, value) => browserStorage.set(key, value),
		},
	});
});

test("signs in to a synced account from an empty browser cache", async () => {
	const resumeData = { header: { name: "Casey Example" }, sections: [] };
	const passwordHash = createHash("sha256")
		.update("correct-password")
		.digest("hex");
	const query = mockCloud({
		data: {
			username: "Casey",
			resume_data: resumeData,
			updated_at: "2026-09-14T00:00:00.000Z",
		},
	});

	const result = await authenticateUser(" casey ", "correct-password");

	assert.equal(result.ok, true, result.error);
	assert.equal(result.user.username, "Casey");
	assert.equal(result.user.syncKey, passwordHash);
	assert.deepEqual(result.user.resumeData, resumeData);
	assert.deepEqual(loadFromLocalStorage("CASEY"), resumeData);
	assert.deepEqual(query.ilike.mock.calls[0].arguments, [
		"username",
		"casey",
	]);
	assert.ok(
		query.eq.mock.calls.some(
			({ arguments: args }) =>
				args[0] === "sync_key" && args[1] === passwordHash,
		),
	);
});

test("keeps local sign-in case-insensitive and available offline", async () => {
	const registered = await registerUser("Casey", "correct-password");
	const result = await authenticateUser(" CASEY ", "correct-password");

	assert.equal(registered.ok, true);
	assert.equal(result.ok, true);
	assert.deepEqual(result.user, registered.user);
});

test("rejects incorrect cloud credentials without creating a local account", async () => {
	const query = mockCloud();
	const result = await authenticateUser("Casey", "wrong-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /username or password is incorrect/i);
	assert.equal(browserStorage.size, 0);
	assert.deepEqual(query.eq.mock.calls[0].arguments, [
		"sync_key",
		createHash("sha256").update("wrong-password").digest("hex"),
	]);
});

test("reports cloud failures instead of claiming an account does not exist", async () => {
	mockCloud({ error: { message: "Service unavailable" } });
	const result = await authenticateUser("Casey", "correct-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /unable to verify.*service unavailable/i);
	assert.equal(browserStorage.size, 0);
});

test("escapes wildcard characters in cloud username lookups", async () => {
	const query = mockCloud();
	await authenticateUser(" casey_100%\\name ", "correct-password");

	assert.deepEqual(query.ilike.mock.calls[0].arguments, [
		"username",
		"casey\\_100\\%\\\\name",
	]);
});

test("saves new accounts to the cloud before signup succeeds", async () => {
	const query = mockCloud();
	const result = await registerUser(" Casey ", "correct-password");

	assert.equal(result.ok, true, result.error);
	assert.deepEqual(query.ilike.mock.calls[0].arguments, [
		"username",
		"Casey",
	]);
	assert.equal(query.insert.mock.callCount(), 1);
	const [savedRow] = query.insert.mock.calls[0].arguments;
	assert.equal(savedRow.username, "Casey");
	assert.equal(savedRow.sync_key, result.user.syncKey);
	assert.deepEqual(savedRow.resume_data, result.user.resumeData);
	assert.deepEqual(loadFromLocalStorage("casey"), savedRow.resume_data);

	browserStorage.clear();
	mockCloud({ data: savedRow });
	const restored = await authenticateUser("CASEY", "correct-password");
	assert.equal(restored.ok, true, restored.error);
	assert.deepEqual(restored.user, result.user);
});

test("rejects signup for an existing cloud username without overwriting it", async () => {
	const query = mockCloud({ data: { username: "Casey" } });
	const result = await registerUser("casey", "different-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /already exists.*sign in/i);
	assert.equal(query.insert.mock.callCount(), 0);
	assert.equal(browserStorage.size, 0);
});

test("does not create a local-only account when cloud lookup fails", async () => {
	const query = mockCloud({ error: { message: "Permission denied" } });
	const result = await registerUser("Casey", "correct-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /unable to check.*cloud/i);
	assert.equal(query.insert.mock.callCount(), 0);
	assert.equal(browserStorage.size, 0);
});

test("does not report signup success when the cloud insert fails", async () => {
	mockCloud({ insertError: { message: "Permission denied" } });
	const result = await registerUser("Casey", "correct-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /unable to create.*cloud/i);
	assert.equal(browserStorage.size, 0);
});

test("reports blocked browser storage during account recovery", async () => {
	mockCloud({ data: { username: "Casey", resume_data: { sections: [] } } });
	globalThis.localStorage.setItem = () => {
		throw new Error("Storage blocked");
	};
	const result = await authenticateUser("Casey", "correct-password");

	assert.equal(result.ok, false);
	assert.match(result.error, /browser storage is unavailable/i);
});

function mockCloud({ data = null, error = null, insertError = null } = {}) {
	const query = {
		select: mock.fn(() => query),
		eq: mock.fn(() => query),
		ilike: mock.fn(() => query),
		order: mock.fn(() => query),
		limit: mock.fn(() => query),
		maybeSingle: mock.fn(async () => ({ data, error })),
		insert: mock.fn(async () => ({ error: insertError })),
	};
	supabaseClient = {
		from: mock.fn((table) => {
			assert.equal(table, "resume_sync");
			return query;
		}),
	};
	return query;
}
