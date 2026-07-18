import { DEFAULT_FONT } from "../data/fonts.js";
import { DEFAULT_PRESET, PRESETS } from "../data/presets.js";
import { genId } from "./id.js";

// Parses raw editor/import text into a safe, renderable resume object.
// Never throws — a parse failure or a shape mismatch always comes back as
// data you can still show something for, plus plain-English warnings
// explaining what was off, rather than a blank screen or a crash.
export function parseAndNormalize(text) {
	const stripped = stripCodeFence(text);
	let parsed;
	try {
		parsed = JSON.parse(stripped);
	} catch (e) {
		return { data: null, warnings: [], parseError: e.message };
	}
	const { data, warnings } = normalize(parsed);
	return { data, warnings, parseError: null };
}

export function normalize(raw) {
	const warnings = [];

	if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
		return {
			data: emptyResume(),
			warnings: [
				"The JSON isn't an object at the top level — showing a blank resume.",
			],
		};
	}

	if (!raw.header)
		warnings.push('No "header" found — contact fields left blank.');
	const rh = isObj(raw.header) ? raw.header : {};
	const header = {
		name: str(rh.name),
		title: str(rh.title),
		email: str(rh.email),
		phone: str(rh.phone),
		location: str(rh.location),
		linkedin: str(rh.linkedin),
		github: str(rh.github),
		portfolio: str(rh.portfolio),
	};

	let rawSections = raw.sections;
	if (!Array.isArray(rawSections)) {
		if (raw.sections !== undefined)
			warnings.push(
				'"sections" isn\'t a list — showing an empty resume body.',
			);
		rawSections = [];
	}
	const sections = rawSections
		.map((s, i) => normalizeSection(s, i, warnings))
		.filter(Boolean);

	const rs = isObj(raw.settings) ? raw.settings : {};
	const preset = PRESETS.some((p) => p.id === rs.preset)
		? rs.preset
		: DEFAULT_PRESET;
	if (rs.preset && preset !== rs.preset) {
		warnings.push(
			`Unknown preset "${rs.preset}" — using "${DEFAULT_PRESET}".`,
		);
	}
	const settings = {
		preset,
		fontFamily: str(rs.fontFamily) || DEFAULT_FONT,
		fontSize: num(rs.fontSize, 11),
		marginTop: num(rs.marginTop, 12.7),
		marginBottom: num(rs.marginBottom, 12.7),
		marginLeft: num(rs.marginLeft, 12.7),
		marginRight: num(rs.marginRight, 12.7),
	};

	return { data: { header, sections, settings }, warnings };
}

function normalizeSection(section, index, warnings) {
	if (!isObj(section)) {
		warnings.push(`Section ${index + 1} wasn't an object — skipped.`);
		return null;
	}

	const title = str(section.title) || `Section ${index + 1}`;
	if (!section.title)
		warnings.push(
			`Section ${index + 1} has no title — labeled "${title}".`,
		);

	let type =
		section.type === "paragraph" || section.type === "bullets"
			? section.type
			: null;
	if (!type) type = Array.isArray(section.content) ? "bullets" : "paragraph";

	let content;
	if (type === "paragraph") {
		content = str(section.content);
	} else {
		const rawContent = Array.isArray(section.content)
			? section.content
			: [];
		if (!Array.isArray(section.content) && section.content !== undefined) {
			warnings.push(
				`"${title}" is marked as bullets but its content isn't a list — treated as empty.`,
			);
		}
		content = rawContent
			.map(normalizeBulletItem)
			.filter((item) => item !== null);
	}

	return { id: str(section.id) || genId(), title, type, content };
}

function normalizeBulletItem(item) {
	if (typeof item === "string") return item;
	if (isObj(item)) {
		if (typeof item.line === "string") return item.line; // old convention, still accepted
		if (typeof item.left === "string" || typeof item.right === "string") {
			return { left: str(item.left), right: str(item.right) };
		}
	}
	return null;
}

function stripCodeFence(text) {
	const trimmed = String(text ?? "").trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1] : trimmed;
}

function isObj(v) {
	return v !== null && typeof v === "object" && !Array.isArray(v);
}

function str(v) {
	if (typeof v === "string") return v;
	return v === null || v === undefined ? "" : String(v);
}

function num(v, fallback) {
	const n = Number(v);
	return Number.isFinite(n) ? n : fallback;
}

export function emptyResume() {
	return normalize({}).data;
}
