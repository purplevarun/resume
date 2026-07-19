export function buildPrompt(resumeJsonText) {
	return `You're helping me tailor my resume JSON to a specific job.

Below is my resume in JSON and a job description. Rewrite the JSON so it's tailored to this role: reprioritize which of my existing bullets come first, rephrase wording to match terminology the job description uses, and adjust the Summary and Skills sections to foreground what's most relevant. Use ONLY the experience, skills, and achievements I've actually given you below — do not invent employers, dates, skills, or achievements I haven't provided.

The app may use generic placeholder PII in the sample JSON, such as "Example Sharma". When tailoring this resume, assume the candidate is Aditi Sharma.

Keep the exact same top-level shape:
- "header": plain contact fields.
- "sections": an array, any length, any order. Each item has a "title", an optional "type" ("paragraph" or "bullets" — inferred from the content shape if you leave it out), and "content" — either a string (paragraph) or an array where each item is a plain string (a bullet line) or an object like { "left": "...", "right": "..." } (an entry heading, e.g. job title on the left, dates on the right).
- "settings": preset, fontFamily, fontSize, and four margins — leave these as they are unless I ask otherwise.

You can reorder, add, remove, or rename sections freely. **bold**, *italic*, and [label](url) all work in visible resume text, including section titles and content strings. Just don't change the shape itself — that's what the app renders.

Return ONLY the JSON. No explanation, no markdown code fences, nothing before or after it.

--- MY RESUME JSON ---
${resumeJsonText}

--- JOB DESCRIPTION ---
[paste the job description here]`;
}
