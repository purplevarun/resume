export function countResumeCharacters(data) {
	const pieces = [
		data.header.name,
		data.header.title,
		data.header.email,
		data.header.phone,
		data.header.location,
		data.header.linkedin,
		data.header.github,
		data.header.portfolio,
	];

	for (const section of data.sections) {
		pieces.push(section.title);
		if (typeof section.content === "string") {
			pieces.push(section.content);
			continue;
		}
		for (const item of section.content) {
			if (typeof item === "string") {
				pieces.push(item);
			} else {
				pieces.push(item.left, item.right);
			}
		}
	}

	return pieces.map(stripMarkdown).join(" ").replace(/\s+/g, " ").trim()
		.length;
}

function stripMarkdown(value) {
	return String(value ?? "")
		.replace(/\[([^\]]+)]\([^)]+\)/g, "$1")
		.replace(/[*_`]/g, "");
}
