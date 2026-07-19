// Lightweight formatting for resume content: **bold**, *italic*,
// [label](url), and bare https:// URLs.
//
// Deliberately not full Markdown and never raw HTML — every export stays
// real, plain text with real <a> tags, nothing an ATS text-extractor could
// misread and nothing a pasted-in HTML snippet could inject.

const TOKEN_RE =
	/(\*\*.+?\*\*|\*[^*]+?\*|\[[^\]]+?\]\([^)]+?\)|https?:\/\/[^\s)]+)/g;

export function renderText(text, options = {}) {
	if (text === null || text === undefined || text === "") return null;
	const { links = true } = options;
	const str = String(text);
	const parts = str
		.split(TOKEN_RE)
		.filter((part) => part !== undefined && part !== "");

	return parts.map((part, i) => {
		if (/^\*\*.+\*\*$/.test(part)) {
			return <strong key={i}>{part.slice(2, -2)}</strong>;
		}
		if (/^\*[^*]+\*$/.test(part)) {
			return <em key={i}>{part.slice(1, -1)}</em>;
		}
		const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
		if (link) {
			if (!links) {
				return (
					<span key={i}>{renderText(link[1], { links: false })}</span>
				);
			}
			return (
				<a key={i} href={link[2]} target="_blank" rel="noreferrer">
					{link[1]}
				</a>
			);
		}
		if (!links && /^https?:\/\//.test(part)) {
			return part;
		}
		if (/^https?:\/\//.test(part)) {
			return (
				<a key={i} href={part} target="_blank" rel="noreferrer">
					{part}
				</a>
			);
		}
		return part;
	});
}

// Turns a header contact value into a sensible href — mailto for email,
// tel for phone, https:// for a bare domain like "linkedin.com/in/x".
export function contactHref(type, value) {
	if (!value) return null;
	const link = String(value).match(/^\[([^\]]+)\]\(([^)]+)\)$/);
	if (link) return urlHref(link[2]);

	const plainValue = stripInlineMarkdown(value).trim();
	if (!plainValue) return null;
	if (type === "email") return `mailto:${plainValue}`;
	if (type === "phone")
		return `tel:${String(plainValue).replace(/[^\d+]/g, "")}`;
	return urlHref(plainValue);
}

function urlHref(value) {
	if (/^https?:\/\//.test(value)) return value;
	return `https://${value}`;
}

function stripInlineMarkdown(value) {
	return String(value)
		.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
		.replace(/\*\*([^*]+)\*\*/g, "$1")
		.replace(/\*([^*]+)\*/g, "$1");
}
