# PurpleResume

A free, ATS-first resume builder. Edit a plain JSON document on the left, get a live Jake-style letter-page preview on the right, export straight to PDF.

The JSON is still the main interface — on purpose, see below. The toolbar selectors are quick ways to update `settings.preset`, `settings.fontFamily`, and all four margin fields together.

## The workflow this is actually built for

1. Find a job description you want to apply to.
2. Click **↓ Starter JSON** (first time) or **↓ Export JSON** (if you already have a resume going) to grab your resume as JSON.
3. Click **Copy Prompt** — it copies a ready-made prompt with your JSON already dropped in. Paste it into ChatGPT (or any LLM), then paste the job description where the prompt asks for it.
4. Paste whatever comes back into the JSON editor here. The preview updates as you type.
5. Click **↓ Export PDF**. Your browser's print dialog opens — choose "Save as PDF."

That's the whole loop. Every field on the page — fonts, presets, margins, section content — is just JSON, so an LLM tailoring your resume to a specific job description can edit all of it directly, without you touching a form.

## Why this is built the way it is

**Single column, always.** There used to be a 2-column option. It's gone. Column layouts are the single most consistently flagged risk factor in ATS parsing guidance — some parsers reconstruct lines by on-page position and can merge sidebar and main-column text that happen to sit at the same height. Not worth the risk for something a resume builder controls entirely.

**PDF export is your browser's native print-to-PDF**, not a screenshot. `Export PDF` calls `window.print()` against a real print stylesheet. That means the text in the exported file is real, selectable, extractable text — the thing an ATS parser actually reads — not a picture of your resume with no text in it at all, which is what canvas-screenshot-based exporters produce.

**The JSON is deliberately loose.** There's no rigid per-field-type schema, no required keys beyond the basics, and no validation blocking you from saving something unconventional. Content can be added, removed, or restructured freely. The tradeoff is that the renderer has to be defensive instead — see "If something looks wrong," below.

**No photo field.** Not an oversight — photos aren't extractable by ATS parsers and several parsers handle them poorly. If you want a photo on something, that's what a LinkedIn profile is for, not the resume file that goes through automated screening.

## The JSON shape

```jsonc
{
	"header": {
		"name": "",
		"title": "",
		"email": "",
		"phone": "",
		"location": "",
		"linkedin": "",
		"github": "",
		"portfolio": "",
		// any of these can be left out
	},
	"sections": [
		{
			"title": "Summary",
			"type": "paragraph", // optional — inferred from content's shape if omitted
			"content": "Plain text. **bold**, *italic*, and [label](url) all work here.",
		},
		{
			"title": "Work Experience",
			"type": "bullets",
			"content": [
				{ "left": "**Role** · Company", "right": "Jan 2022 – Present" }, // an entry heading
				"A plain bullet line.", // a plain bullet
			],
		},
	],
	"settings": {
		"preset": "jake", // jake | classic | sharp | compact | elegant
		"fontFamily": "Times New Roman",
		"fontSize": 11,
		"marginTop": 12.7,
		"marginBottom": 12.7,
		"marginLeft": 12.7,
		"marginRight": 12.7,
	},
}
```

Add, remove, reorder, or rename sections however you want — nothing about the array length or order is fixed. Anything the renderer doesn't recognize (extra fields, unexpected values) is ignored rather than breaking the page.

## Presets

Jake-style by default: centered header, small-caps section headings with a rule, tight bullets, and letter-page margins. The other presets keep the same ATS-safe single-column structure but change alignment, heading treatment, and density.

| Preset      | Look                                                                  |
| ----------- | --------------------------------------------------------------------- |
| **Jake**    | Centered header, small-caps ruled headings, compact spacing.          |
| **Classic** | Centered header with traditional underlined headings.                 |
| **Sharp**   | Left-aligned header with uppercase accent-rule headings.              |
| **Compact** | Left-aligned, uppercase headings, tighter spacing for longer resumes. |
| **Elegant** | Centered header with softer centered small-caps headings.             |

Fonts (`settings.fontFamily`): Calibri, Arial, Helvetica, Georgia, Times New Roman, Garamond, Palatino, Cambria, Tahoma, Verdana, Book Antiqua — all standard, system-available business typefaces, nothing web-fetched.

The Margin toolbar selector applies the same value to top, bottom, left, and right margins. The visible options are all compact, with Jake's 12.7mm margin as the widest option. For uneven margins, edit the four margin fields directly in JSON.

## If something looks wrong

There's no form validation anymore, so the JSON editor's status strip is the only safety net:

- **✓ Valid** — parses and matches the expected shape.
- **⚠ N notes** — parsed fine, but something was missing or malformed (a bad preset name, a section with no title, and so on). The app fills in a sensible default and tells you exactly what it changed. The resume still renders.
- **✗ Invalid JSON** — doesn't parse at all. The preview keeps showing the last valid version until this is fixed.

## Getting started

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```

## Project structure

```
src/
  App.jsx                     — top-level shell: state, debounced parse loop, layout
  components/
    Toolbar.jsx                — export/import/starter/prompt actions
    JsonEditor.jsx              — CodeMirror pane + validation status
    ResumePreview.jsx           — the actual resume renderer
  data/
    defaultResume.js            — starter content (doubles as schema documentation)
    presets.js                  — Jake-style layout presets
    fonts.js                    — the font list + safe CSS stacks
    chatgptPrompt.js             — builds the copyable ChatGPT prompt
  lib/
    normalize.js                 — defensive shape-checking; the actual safety net
    markdown.jsx                  — **bold** / *italic* / [link](url) parsing
    storage.js, download.js, id.js
  index.css                     — app chrome + resume document styles + print rules
```

## A note on "ATS compliant"

This app controls what's technically within its power to control: single-column structure, real extractable text in the exported PDF, standard fonts, standard section headings, no photo, no tables or graphics. That combination removes the formatting reasons a resume gets filtered out before a human ever sees it.

It can't control whether your resume's _content_ matches the keywords in a specific job description, or how a recruiter judges it once it's through — that part depends on what you (or your LLM of choice) actually write in the JSON for each application.
