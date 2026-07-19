import { DEFAULT_FONT } from "./fonts.js";
import { DEFAULT_PRESET } from "./presets.js";

// This is the starting point every new resume loads with, and it's also
// what "Download starter JSON" hands out. The content is plausible but
// deliberately generic: filled-in examples teach the shape to a person or
// an LLM, while placeholder PII keeps the starter safe to share.
//
// Shape, in plain terms:
//   header    — plain contact fields, any of them can be left out.
//   sections  — an array, any length, any order. Each one is:
//                 title    — whatever you want, shown as-is.
//                 type     — "paragraph" or "bullets" (optional — if you
//                            leave it out, a string content is treated as
//                            a paragraph and an array is treated as bullets).
//                 content  — a string (paragraph), OR an array where each
//                            item is either a plain string (a bullet line)
//                            or { left, right } (an entry heading, e.g. a
//                            job title on the left and dates on the right).
//   settings  — preset, fontFamily, fontSize, and four margins. Any value
//               not recognized just falls back to a sensible default
//               instead of breaking anything.
//
// **bold**, *italic*, and [label](url) all work in visible resume text,
// including section titles.
// Add, remove, rename, or reorder sections freely — nothing here is fixed.
export const DEFAULT_DATA = {
	header: {
		name: "Example Sharma",
		title: "Software Development Engineer II",
		email: "example.sharma@example.com",
		phone: "+91 00000 00000",
		location: "Example City, India",
		linkedin: "linkedin.com/in/example-sharma",
		github: "github.com/example-sharma",
		portfolio: "example-sharma.dev",
	},
	sections: [
		{
			id: "sec-summary",
			title: "Summary",
			type: "paragraph",
			content:
				"Backend-focused SDE with 4+ years building high-throughput distributed systems in **Java** and **Go**. Shipped services handling 50M+ daily requests; led a monolith-to-microservices migration that cut deployment time by **60%**.",
		},
		{
			id: "sec-experience",
			title: "Work Experience",
			type: "bullets",
			content: [
				{
					left: "**Senior SDE** · Example Systems",
					right: "Jan 2023 – Present",
				},
				"Designed a real-time notification service handling **12M events/day**, cutting latency from 800ms to 90ms",
				"Led a team of **3 engineers** migrating the billing module from a monolith to microservices",
				"Introduced automated load testing, catching **2 production-grade regressions** before release",
				{
					left: "**SDE II** · Example Systems",
					right: "Jun 2021 – Dec 2022",
				},
				"Built an internal feature-flagging platform, adopted by **6 teams** across the org",
				"Reduced average API response time by **35%** through query optimization and caching",
				{
					left: "**Software Engineer** · Sample Labs",
					right: "Jul 2019 – May 2021",
				},
				"Built and maintained REST APIs in *Node.js* serving the company's mobile app",
				"Owned the CI/CD migration to GitHub Actions, cutting build time by **45%**",
			],
		},
		{
			id: "sec-education",
			title: "Education",
			type: "bullets",
			content: [
				{
					left: "**B.Tech, Computer Science** · Example Institute of Technology",
					right: "2015 – 2019",
				},
				"CGPA: 8.7 / 10",
			],
		},
		{
			id: "sec-skills",
			title: "Technical Skills",
			type: "paragraph",
			content:
				"**Languages:** Java, Go, Python, JavaScript · **Backend:** Spring Boot, Node.js, gRPC, Kafka · **Infra:** AWS, Docker, Kubernetes, Terraform · **Databases:** PostgreSQL, Redis, DynamoDB",
		},
		{
			id: "sec-projects",
			title: "Projects",
			type: "bullets",
			content: [
				{
					left: "**queue-lite** — [github.com/example-sharma/queue-lite](https://github.com/example-sharma/queue-lite)",
					right: "2024",
				},
				"Lightweight message queue written in Go, built for learning; **400+ GitHub stars**",
			],
		},
		{
			id: "sec-certifications",
			title: "Certifications",
			type: "bullets",
			content: ["AWS Certified Solutions Architect – Associate (2023)"],
		},
	],
	settings: {
		preset: DEFAULT_PRESET,
		fontFamily: DEFAULT_FONT,
		fontSize: 11,
		marginTop: 12.7,
		marginBottom: 12.7,
		marginLeft: 12.7,
		marginRight: 12.7,
	},
};
