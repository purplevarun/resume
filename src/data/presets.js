// Presets only ever change structural/typographic *treatment* — heading
// style, alignment, density. They never touch font family, size, or
// margins; those stay independent knobs in `settings` so any preset can be
// combined with any font. And critically: every preset is single-column.
// There is no layout axis left to choose badly here.
export const PRESETS = [
	{
		id: "jake",
		label: "Jake",
		description:
			"Centered header, small-caps section headings, tight ATS-friendly spacing.",
		headerAlign: "center",
		headingStyle: "jake",
		tight: true,
	},
	{
		id: "classic",
		label: "Classic",
		description:
			"Centered header, underlined section headings. Traditional and safe.",
		headerAlign: "center",
		headingStyle: "underline",
		tight: false,
	},
	{
		id: "sharp",
		label: "Sharp",
		description:
			"Left-aligned header, uppercase headings with a short accent rule.",
		headerAlign: "left",
		headingStyle: "accent-rule",
		tight: false,
	},
	{
		id: "compact",
		label: "Compact",
		description:
			"Left-aligned, minimal heading treatment, tighter spacing throughout.",
		headerAlign: "left",
		headingStyle: "plain-caps",
		tight: true,
	},
	{
		id: "elegant",
		label: "Elegant",
		description:
			"Centered header, small-caps headings, generous whitespace.",
		headerAlign: "center",
		headingStyle: "small-caps",
		tight: false,
	},
];

export const DEFAULT_PRESET = "jake";

export function getPreset(id) {
	return (
		PRESETS.find((p) => p.id === id) ??
		PRESETS.find((p) => p.id === DEFAULT_PRESET)
	);
}
