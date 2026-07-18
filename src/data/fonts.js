// Every entry here is a font that ships with Windows/macOS/common Linux
// distros, or has a very close metric-compatible fallback baked into the
// stack. Nothing web-fetched, so nothing to fail-to-load right before
// someone hits print. Keep additions in this same category — standard,
// widely-available serif/sans-serif business faces, not display fonts.
export const FONTS = [
	{ label: "Calibri", stack: '"Calibri", "Carlito", sans-serif' },
	{ label: "Arial", stack: '"Arial", "Helvetica", sans-serif' },
	{ label: "Helvetica", stack: '"Helvetica", "Arial", sans-serif' },
	{ label: "Georgia", stack: '"Georgia", serif' },
	{ label: "Times New Roman", stack: '"Times New Roman", Times, serif' },
	{ label: "Garamond", stack: '"Garamond", "EB Garamond", serif' },
	{
		label: "Palatino",
		stack: '"Palatino Linotype", Palatino, "Book Antiqua", serif',
	},
	{ label: "Cambria", stack: '"Cambria", Georgia, serif' },
	{ label: "Tahoma", stack: '"Tahoma", Verdana, sans-serif' },
	{ label: "Verdana", stack: '"Verdana", Tahoma, sans-serif' },
	{
		label: "Book Antiqua",
		stack: '"Book Antiqua", "Palatino Linotype", serif',
	},
];

export const DEFAULT_FONT = "Times New Roman";

// Looks up a stored font label and returns a safe CSS stack. Falls back to
// treating the raw value as the font name itself, so a name that isn't in
// the list (e.g. something a hand-edited or ChatGPT-produced JSON used)
// still renders with something, rather than breaking.
export function fontStack(label) {
	const match = FONTS.find(
		(f) => f.label.toLowerCase() === String(label ?? "").toLowerCase(),
	);
	if (match) return match.stack;
	if (label) return `"${label}", sans-serif`;
	return fontStack(DEFAULT_FONT);
}
