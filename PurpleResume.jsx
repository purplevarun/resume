import { useEffect, useRef, useState } from "react";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const FONTS = [
	{ label: "Calibri", value: "Calibri, Arial, sans-serif" },
	{ label: "Arial", value: "Arial, sans-serif" },
	{ label: "Georgia", value: "Georgia, serif" },
	{ label: "Times New Roman", value: "'Times New Roman', Times, serif" },
	{ label: "Garamond", value: "Garamond, serif" },
	{ label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
	{ label: "Palatino", value: "Palatino, 'Book Antiqua', serif" },
];

const C = {
	bg: "#09090f",
	panel: "#0d0f1a",
	surface: "#13151f",
	surfaceHover: "#181b28",
	border: "#1e2133",
	borderHover: "#2e3250",
	accent: "#7c3aed",
	accentHover: "#6d28d9",
	accentLight: "#a78bfa",
	accentFaint: "rgba(124,58,237,0.13)",
	accentFaint2: "rgba(124,58,237,0.07)",
	textPrimary: "#eef0f8",
	textSecondary: "#8b8fa8",
	textMuted: "#4b5070",
	danger: "#f87171",
	dangerFaint: "rgba(248,113,113,0.12)",
	sideBlue: "#38bdf8",
	sideBlueFaint: "rgba(56,189,248,0.10)",
};

const iStyle = {
	background: C.surface,
	border: `1px solid ${C.border}`,
	borderRadius: 6,
	color: C.textPrimary,
	fontSize: 11,
	padding: "5px 9px",
	outline: "none",
	fontFamily: "inherit",
	width: "100%",
	transition: "border-color 0.15s",
};

function genId() {
	return "_" + Math.random().toString(36).slice(2, 9);
}

const DEFAULT_DATA = {
	header: {
		name: "Lorem Ipsum",
		title: "Software Engineer",
		email: "lorem@example.com",
		phone: "+91 98765 43210",
		location: "Bengaluru, India",
		linkedin: "linkedin.com/in/loremipsum",
		github: "github.com/loremipsum",
		portfolio: "loremipsum.dev",
	},
	sections: [
		{
			id: "s1",
			title: "Summary",
			type: "paragraph",
			column: "main",
			content:
				"Results-driven engineer with **5+ years** of experience in *distributed systems* and cloud infrastructure. Proven track record of delivering high-impact features and reducing infrastructure costs by **30%**.",
		},
		{
			id: "s2",
			title: "Work Experience",
			type: "bullets",
			column: "main",
			content: [
				{
					left: "**Senior Software Engineer** · Acme Corp",
					right: "Jan 2022 – Present",
				},
				{
					line: "Redesigned the data pipeline, reducing processing latency by **40%**",
				},
				{
					line: "Led a team of **5 engineers** across *3 time zones* to ship a new product",
				},
				{
					line: "Built a caching layer that saved **$120K/year** in infrastructure costs",
				},
				{
					left: "**Software Engineer** · Beta Technologies",
					right: "Jun 2019 – Dec 2021",
				},
				{
					line: "Migrated monolith to *microservices*, improving deploy frequency by **3×**",
				},
				{
					line: "Implemented [OAuth 2.0](https://oauth.net) authentication for **50K+ daily users**",
				},
			],
		},
		{
			id: "s3",
			title: "Education",
			type: "bullets",
			column: "main",
			content: [
				{
					left: "**B.Tech, Computer Science** · Lorem University",
					right: "2015 – 2019",
				},
				{ line: "CGPA: **9.0 / 10** · Graduated with *Distinction*" },
			],
		},
		{
			id: "s4",
			title: "Technical Skills",
			type: "bullets",
			column: "sidebar",
			content: [
				{ left: "**Languages**", right: "Python, TypeScript, Go" },
				{ left: "**Frontend**", right: "React, Next.js, Tailwind" },
				{ left: "**Backend**", right: "Node.js, FastAPI, gRPC" },
				{ left: "**Cloud**", right: "AWS, GCP, Docker, K8s" },
				{ left: "**Databases**", right: "PostgreSQL, Redis, MongoDB" },
			],
		},
		{
			id: "s5",
			title: "Projects",
			type: "bullets",
			column: "sidebar",
			content: [
				{
					line: "**Lorem App** — Real-time collaboration using *WebSockets*",
				},
				{
					line: "Served **10K+ users**, reduced deploy time by **60%**",
				},
				{ line: "**Ipsum CLI** — Developer productivity tool in *Go*" },
				{ line: "Cut local dev setup time by **80%** across the team" },
			],
		},
		{
			id: "s6",
			title: "Certifications",
			type: "bullets",
			column: "sidebar",
			content: [
				{ line: "AWS Certified Solutions Architect (*2023*)" },
				{ line: "GCP Professional Cloud Architect (*2022*)" },
			],
		},
	],
	settings: {
		fontFamily: "Calibri, Arial, sans-serif",
		fontSize: 10,
		marginTop: 14,
		marginBottom: 14,
		marginLeft: 14,
		marginRight: 14,
		layout: "1col",
	},
};

// ═══════════════════════════════════════════════════════════════
// LOCAL STORAGE PERSISTENCE
// ═══════════════════════════════════════════════════════════════

const LS_KEY = "purpleresume_data";

function loadFromLocalStorage() {
	try {
		const raw = localStorage.getItem(LS_KEY);
		if (!raw) return DEFAULT_DATA;
		const parsed = JSON.parse(raw);
		// Basic shape check so a corrupted/old value doesn't crash the app
		if (!parsed || !parsed.header || !parsed.sections || !parsed.settings) {
			return DEFAULT_DATA;
		}
		return parsed;
	} catch {
		return DEFAULT_DATA;
	}
}

function saveToLocalStorage(data) {
	try {
		localStorage.setItem(LS_KEY, JSON.stringify(data));
	} catch {
		// storage full / unavailable — fail silently
	}
}

// ═══════════════════════════════════════════════════════════════
// INLINE MARKDOWN RENDERER
// ═══════════════════════════════════════════════════════════════

function renderText(text) {
	if (!text) return null;
	// Order matters: bold (**) before italic (*) to avoid partial matches
	const TOKEN =
		/\*\*(.+?)\*\*|\*([^*\n]+?)\*|\[(.+?)\]\((https?:\/\/[^\s)]+)\)|(https?:\/\/[^\s<]+)/g;
	const parts = [];
	let lastIndex = 0;
	let k = 0;
	let match;
	while ((match = TOKEN.exec(text)) !== null) {
		if (match.index > lastIndex)
			parts.push(text.slice(lastIndex, match.index));
		if (match[1] !== undefined)
			parts.push(<strong key={k++}>{match[1]}</strong>);
		else if (match[2] !== undefined)
			parts.push(<em key={k++}>{match[2]}</em>);
		else if (match[3] !== undefined)
			parts.push(
				<a
					key={k++}
					href={match[4]}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "inherit", textDecoration: "underline" }}
				>
					{match[3]}
				</a>,
			);
		else if (match[5] !== undefined)
			parts.push(
				<a
					key={k++}
					href={match[5]}
					target="_blank"
					rel="noopener noreferrer"
					style={{ color: "inherit", textDecoration: "underline" }}
				>
					{match[5]}
				</a>,
			);
		lastIndex = TOKEN.lastIndex;
	}
	if (lastIndex < text.length) parts.push(text.slice(lastIndex));
	return parts.length === 0
		? null
		: parts.length === 1 && typeof parts[0] === "string"
			? parts[0]
			: parts;
}

// Auto-link contact values (email, linkedin, github, portfolio, etc.)
function contactHref(value) {
	if (!value) return null;
	const v = value.trim();
	if (v.startsWith("http://") || v.startsWith("https://")) return v;
	if (v.includes("@") && !v.includes(" ")) return `mailto:${v}`;
	if (v.includes("linkedin.com")) return `https://${v}`;
	if (v.includes("github.com")) return `https://${v}`;
	if (v.match(/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}(\/|$)/)) return `https://${v}`;
	return null;
}

// ═══════════════════════════════════════════════════════════════
// RESUME PREVIEW COMPONENTS
// ═══════════════════════════════════════════════════════════════

function SecTitle({ title }) {
	return (
		<div style={{ marginBottom: 3, breakAfter: "avoid" }}>
			<div
				style={{
					fontWeight: 800,
					textTransform: "uppercase",
					letterSpacing: "0.1em",
					fontSize: "0.87em",
					color: "#111",
				}}
			>
				{title}
			</div>
			<div style={{ borderBottom: "1.5px solid #111", marginTop: 2 }} />
		</div>
	);
}

function SectionBlock({ section }) {
	if (section.type === "paragraph") {
		return (
			<div style={{ marginBottom: 9 }}>
				<SecTitle title={section.title} />
				<div style={{ lineHeight: 1.45, color: "#222", marginTop: 3 }}>
					{renderText(
						typeof section.content === "string"
							? section.content
							: "",
					)}
				</div>
			</div>
		);
	}

	if (section.type === "bullets") {
		const items = Array.isArray(section.content) ? section.content : [];
		return (
			<div style={{ marginBottom: 9 }}>
				<SecTitle title={section.title} />
				<div style={{ marginTop: 3 }}>
					{items.map((item, i) => {
						if ("left" in item || "right" in item) {
							return (
								<div
									key={i}
									style={{
										display: "flex",
										justifyContent: "space-between",
										alignItems: "baseline",
										lineHeight: 1.38,
										marginBottom: 2,
										color: "#222",
									}}
								>
									<span>{renderText(item.left || "")}</span>
									<span
										style={{
											color: "#555",
											flexShrink: 0,
											marginLeft: 8,
											fontSize: "0.92em",
										}}
									>
										{renderText(item.right || "")}
									</span>
								</div>
							);
						}
						return (
							<div
								key={i}
								style={{
									display: "flex",
									gap: 5,
									lineHeight: 1.38,
									marginBottom: 2,
									paddingLeft: 2,
									color: "#222",
								}}
							>
								<span
									style={{
										flexShrink: 0,
										userSelect: "none",
										marginTop: "0.05em",
									}}
								>
									•
								</span>
								<span>{renderText(item.line || "")}</span>
							</div>
						);
					})}
				</div>
			</div>
		);
	}

	return null;
}

function ResumeHeader({ header }) {
	const contacts = [
		header.email,
		header.phone,
		header.location,
		header.linkedin,
		header.github,
		header.portfolio,
	].filter(Boolean);

	return (
		<div style={{ textAlign: "center", marginBottom: 9 }}>
			<div
				style={{
					fontSize: "1.92em",
					fontWeight: 800,
					color: "#111",
					letterSpacing: "0.05em",
					textTransform: "uppercase",
					lineHeight: 1.15,
				}}
			>
				{header.name || "Your Name"}
			</div>
			{header.title && (
				<div
					style={{
						fontSize: "1.05em",
						color: "#555",
						fontWeight: 500,
						marginTop: 3,
					}}
				>
					{header.title}
				</div>
			)}
			{contacts.length > 0 && (
				<div
					style={{
						fontSize: "0.82em",
						color: "#555",
						marginTop: 5,
						display: "flex",
						flexWrap: "wrap",
						justifyContent: "center",
						alignItems: "center",
						gap: 0,
					}}
				>
					{contacts.map((c, i) => {
						const href = contactHref(c);
						return (
							<span key={i}>
								{i > 0 && (
									<span
										style={{
											margin: "0 5px",
											color: "#ccc",
										}}
									>
										|
									</span>
								)}
								{href ? (
									<a
										href={href}
										style={{
											color: "inherit",
											textDecoration: "none",
										}}
									>
										{c}
									</a>
								) : (
									c
								)}
							</span>
						);
					})}
				</div>
			)}
			<div style={{ borderBottom: "2px solid #111", marginTop: 7 }} />
		</div>
	);
}

function ResumePreview({ data }) {
	const { header = {}, sections = [], settings = {} } = data;
	const layout = settings.layout || "1col";
	const MM = 3.7795; // 1mm in px at 96dpi

	const mainSections = sections.filter(
		(s) => !s.column || s.column === "main",
	);
	const sidebarSections = sections.filter((s) => s.column === "sidebar");

	return (
		<div
			id="resume-paper"
			style={{
				background: "white",
				width: "210mm",
				minHeight: "297mm",
				paddingTop: `${(settings.marginTop ?? 14) * MM}px`,
				paddingBottom: `${(settings.marginBottom ?? 14) * MM}px`,
				paddingLeft: `${(settings.marginLeft ?? 14) * MM}px`,
				paddingRight: `${(settings.marginRight ?? 14) * MM}px`,
				fontFamily: settings.fontFamily || "Calibri, Arial, sans-serif",
				fontSize: `${settings.fontSize ?? 10}pt`,
				boxShadow:
					"0 12px 48px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03)",
				borderRadius: 2,
				flexShrink: 0,
			}}
		>
			<ResumeHeader header={header} />

			{layout === "1col" ? (
				<div>
					{sections.map((s) => (
						<SectionBlock key={s.id} section={s} />
					))}
				</div>
			) : (
				<div style={{ display: "flex", alignItems: "flex-start" }}>
					<div style={{ flex: "0 0 63%" }}>
						{mainSections.map((s) => (
							<SectionBlock key={s.id} section={s} />
						))}
					</div>
					<div
						style={{
							width: 1,
							background: "#e0e0e0",
							alignSelf: "stretch",
							margin: "0 11px",
							flexShrink: 0,
						}}
					/>
					<div style={{ flex: 1, minWidth: 0 }}>
						{sidebarSections.map((s) => (
							<SectionBlock key={s.id} section={s} />
						))}
					</div>
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// EDITOR PRIMITIVES
// ═══════════════════════════════════════════════════════════════

function FieldLabel({ children }) {
	return (
		<div
			style={{
				fontSize: 9.5,
				fontWeight: 700,
				color: C.textMuted,
				textTransform: "uppercase",
				letterSpacing: "0.08em",
				marginBottom: 4,
			}}
		>
			{children}
		</div>
	);
}

function Field({ label, children, style = {} }) {
	return (
		<div style={{ marginBottom: 9, ...style }}>
			{label && <FieldLabel>{label}</FieldLabel>}
			{children}
		</div>
	);
}

function EInput({
	value,
	onChange,
	placeholder,
	style: xs = {},
	onFocus,
	onBlur,
}) {
	const [focused, setFocused] = useState(false);
	return (
		<input
			value={value || ""}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			onFocus={() => {
				setFocused(true);
				onFocus?.();
			}}
			onBlur={() => {
				setFocused(false);
				onBlur?.();
			}}
			style={{
				...iStyle,
				...xs,
				borderColor: focused ? C.accent : C.border,
			}}
		/>
	);
}

function ETextarea({ value, onChange, placeholder, rows = 3, style: xs = {} }) {
	const [focused, setFocused] = useState(false);
	return (
		<textarea
			value={value || ""}
			onChange={(e) => onChange(e.target.value)}
			placeholder={placeholder}
			rows={rows}
			onFocus={() => setFocused(true)}
			onBlur={() => setFocused(false)}
			style={{
				...iStyle,
				...xs,
				resize: "vertical",
				lineHeight: 1.55,
				borderColor: focused ? C.accent : C.border,
			}}
		/>
	);
}

// ═══════════════════════════════════════════════════════════════
// HEADER EDITOR
// ═══════════════════════════════════════════════════════════════

function HeaderEditor({ header, onChange }) {
	const upd = (key) => (val) => onChange({ ...header, [key]: val });
	return (
		<div>
			<Field label="Full Name">
				<EInput
					value={header.name}
					onChange={upd("name")}
					placeholder="John Doe"
				/>
			</Field>
			<Field label="Professional Title">
				<EInput
					value={header.title}
					onChange={upd("title")}
					placeholder="Software Engineer"
				/>
			</Field>
			<div
				style={{
					display: "grid",
					gridTemplateColumns: "1fr 1fr",
					gap: "0 8px",
				}}
			>
				<Field label="Email">
					<EInput
						value={header.email}
						onChange={upd("email")}
						placeholder="john@example.com"
					/>
				</Field>
				<Field label="Phone">
					<EInput
						value={header.phone}
						onChange={upd("phone")}
						placeholder="+1 234 567 8900"
					/>
				</Field>
				<Field label="Location">
					<EInput
						value={header.location}
						onChange={upd("location")}
						placeholder="City, Country"
					/>
				</Field>
				<Field label="LinkedIn">
					<EInput
						value={header.linkedin}
						onChange={upd("linkedin")}
						placeholder="linkedin.com/in/..."
					/>
				</Field>
				<Field label="GitHub">
					<EInput
						value={header.github}
						onChange={upd("github")}
						placeholder="github.com/..."
					/>
				</Field>
				<Field label="Portfolio">
					<EInput
						value={header.portfolio}
						onChange={upd("portfolio")}
						placeholder="yoursite.com"
					/>
				</Field>
			</div>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// BULLET ROW EDITOR
// ═══════════════════════════════════════════════════════════════

function BulletRow({ item, onUpdate, onRemove, onToggleType }) {
	const isLR = "left" in item || "right" in item;
	return (
		<div
			style={{
				display: "flex",
				gap: 4,
				alignItems: "center",
				padding: "5px 0",
				borderTop: `1px solid ${C.border}`,
			}}
		>
			{/* L|R / — toggle */}
			<button
				onClick={onToggleType}
				title={
					isLR ? "Switch to single line" : "Switch to Left | Right"
				}
				style={{
					flexShrink: 0,
					fontSize: 9,
					fontWeight: 800,
					padding: "2px 5px",
					borderRadius: 4,
					border: `1px solid ${isLR ? C.accent : C.border}`,
					background: isLR ? C.accentFaint : "transparent",
					color: isLR ? C.accentLight : C.textMuted,
					cursor: "pointer",
					lineHeight: 1.5,
					minWidth: 30,
					textAlign: "center",
					letterSpacing: "0.02em",
				}}
			>
				{isLR ? "L|R" : "—"}
			</button>

			{isLR ? (
				<>
					<EInput
						value={item.left || ""}
						onChange={(v) =>
							onUpdate({ left: v, right: item.right || "" })
						}
						placeholder="Left text…"
						style={{ flex: 1 }}
					/>
					<EInput
						value={item.right || ""}
						onChange={(v) =>
							onUpdate({ left: item.left || "", right: v })
						}
						placeholder="Right"
						style={{ flex: "0 0 88px" }}
					/>
				</>
			) : (
				<EInput
					value={item.line || ""}
					onChange={(v) => onUpdate({ line: v })}
					placeholder="Bullet… **bold**, *italic*, [link](url)"
					style={{ flex: 1 }}
				/>
			)}

			<button
				onClick={onRemove}
				style={{
					flexShrink: 0,
					fontSize: 16,
					color: C.textMuted,
					background: "transparent",
					border: "none",
					cursor: "pointer",
					padding: "0 3px",
					lineHeight: 1,
					opacity: 0.65,
					transition: "color 0.12s, opacity 0.12s",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.color = C.danger;
					e.currentTarget.style.opacity = "1";
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.color = C.textMuted;
					e.currentTarget.style.opacity = "0.65";
				}}
			>
				×
			</button>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// SECTION CARD
// ═══════════════════════════════════════════════════════════════

function SectionCard({
	section,
	onUpdate,
	onRemove,
	onMoveUp,
	onMoveDown,
	isFirst,
	isLast,
	layout,
}) {
	const [collapsed, setCollapsed] = useState(false);
	const isBullets = section.type === "bullets";
	const isSidebar = section.column === "sidebar";
	const items =
		isBullets && Array.isArray(section.content) ? section.content : [];

	const setItems = (items) => onUpdate({ ...section, content: items });
	const updateItem = (i, v) => {
		const n = [...items];
		n[i] = v;
		setItems(n);
	};
	const removeItem = (i) => setItems(items.filter((_, j) => j !== i));
	const toggleItemType = (i) => {
		const item = items[i];
		const lr = "left" in item || "right" in item;
		updateItem(
			i,
			lr
				? { line: [item.left, item.right].filter(Boolean).join(" ") }
				: { left: item.line || "", right: "" },
		);
	};
	const addItem = (type) =>
		setItems([
			...items,
			type === "lr" ? { left: "", right: "" } : { line: "" },
		]);

	const toggleType = () => {
		const newType = isBullets ? "paragraph" : "bullets";
		onUpdate({
			...section,
			type: newType,
			content:
				newType === "bullets"
					? typeof section.content === "string" && section.content
						? [{ line: section.content }]
						: []
					: items[0]?.line || "",
		});
	};

	const addBtn = (label, type) => (
		<button
			onClick={() => addItem(type)}
			style={{
				flex: 1,
				fontSize: 10,
				fontWeight: 600,
				padding: "5px 0",
				border: `1px dashed ${C.border}`,
				borderRadius: 5,
				background: "transparent",
				color: C.textMuted,
				cursor: "pointer",
				transition: "all 0.15s",
			}}
			onMouseEnter={(e) => {
				e.currentTarget.style.borderColor = C.accent;
				e.currentTarget.style.color = C.accentLight;
				e.currentTarget.style.background = C.accentFaint2;
			}}
			onMouseLeave={(e) => {
				e.currentTarget.style.borderColor = C.border;
				e.currentTarget.style.color = C.textMuted;
				e.currentTarget.style.background = "transparent";
			}}
		>
			{label}
		</button>
	);

	return (
		<div
			style={{
				background: C.surface,
				border: `1px solid ${C.border}`,
				borderRadius: 9,
				marginBottom: 7,
				overflow: "hidden",
			}}
		>
			{/* ── Card header ── */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: 4,
					padding: "6px 8px 6px 6px",
					background: "rgba(0,0,0,0.18)",
					borderBottom: collapsed ? "none" : `1px solid ${C.border}`,
				}}
			>
				{/* Reorder buttons */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						flexShrink: 0,
					}}
				>
					{["up", "down"].map((dir) => (
						<button
							key={dir}
							onClick={dir === "up" ? onMoveUp : onMoveDown}
							disabled={dir === "up" ? isFirst : isLast}
							style={{
								fontSize: 8,
								padding: "1px 4px",
								lineHeight: 1.3,
								background: "transparent",
								border: "none",
								color: (dir === "up" ? isFirst : isLast)
									? C.border
									: C.textMuted,
								cursor: (dir === "up" ? isFirst : isLast)
									? "default"
									: "pointer",
							}}
						>
							{dir === "up" ? "▲" : "▼"}
						</button>
					))}
				</div>

				{/* Title input */}
				<input
					value={section.title}
					onChange={(e) =>
						onUpdate({ ...section, title: e.target.value })
					}
					placeholder="Section title"
					style={{
						flex: 1,
						minWidth: 0,
						background: "transparent",
						border: "none",
						color: C.textPrimary,
						fontSize: 12,
						fontWeight: 600,
						outline: "none",
						fontFamily: "inherit",
					}}
				/>

				{/* Badges row */}
				<div
					style={{
						display: "flex",
						gap: 4,
						alignItems: "center",
						flexShrink: 0,
					}}
				>
					{/* Type toggle */}
					<button
						onClick={toggleType}
						title="Toggle section type"
						style={{
							fontSize: 9,
							fontWeight: 700,
							padding: "2px 7px",
							borderRadius: 20,
							border: `1px solid ${isBullets ? C.accent + "80" : C.border}`,
							background: isBullets
								? C.accentFaint
								: "transparent",
							color: isBullets ? C.accentLight : C.textMuted,
							cursor: "pointer",
							letterSpacing: "0.02em",
						}}
					>
						{isBullets ? "bullets" : "para"}
					</button>

					{/* Column toggle (2col only) */}
					{layout === "2col" && (
						<button
							onClick={() =>
								onUpdate({
									...section,
									column: isSidebar ? "main" : "sidebar",
								})
							}
							title="Toggle column"
							style={{
								fontSize: 9,
								fontWeight: 700,
								padding: "2px 7px",
								borderRadius: 20,
								border: `1px solid ${isSidebar ? C.sideBlue + "80" : C.border}`,
								background: isSidebar
									? C.sideBlueFaint
									: "transparent",
								color: isSidebar ? C.sideBlue : C.textMuted,
								cursor: "pointer",
								letterSpacing: "0.02em",
							}}
						>
							{isSidebar ? "side" : "main"}
						</button>
					)}

					{/* Collapse toggle */}
					<button
						onClick={() => setCollapsed((c) => !c)}
						style={{
							fontSize: 9,
							padding: "2px 5px",
							background: "transparent",
							border: "none",
							color: C.textMuted,
							cursor: "pointer",
						}}
					>
						{collapsed ? "▼" : "▲"}
					</button>

					{/* Delete */}
					<button
						onClick={onRemove}
						style={{
							fontSize: 16,
							padding: "0 3px",
							background: "transparent",
							border: "none",
							color: C.textMuted,
							cursor: "pointer",
							lineHeight: 1,
							opacity: 0.65,
						}}
						onMouseEnter={(e) => {
							e.currentTarget.style.color = C.danger;
							e.currentTarget.style.opacity = "1";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.color = C.textMuted;
							e.currentTarget.style.opacity = "0.65";
						}}
					>
						×
					</button>
				</div>
			</div>

			{/* ── Card content ── */}
			{!collapsed && (
				<div style={{ padding: "8px 10px" }}>
					{!isBullets ? (
						<ETextarea
							value={
								typeof section.content === "string"
									? section.content
									: ""
							}
							onChange={(c) =>
								onUpdate({ ...section, content: c })
							}
							placeholder="Paragraph content… **bold**, *italic*, [link](url)"
							rows={4}
						/>
					) : (
						<>
							{items.length === 0 && (
								<div
									style={{
										fontSize: 10,
										color: C.textMuted,
										textAlign: "center",
										padding: "8px 0 4px",
										fontStyle: "italic",
									}}
								>
									No items yet — add one below.
								</div>
							)}
							{items.map((item, i) => (
								<BulletRow
									key={i}
									item={item}
									onUpdate={(v) => updateItem(i, v)}
									onRemove={() => removeItem(i)}
									onToggleType={() => toggleItemType(i)}
								/>
							))}
							<div
								style={{
									display: "flex",
									gap: 6,
									marginTop: 8,
								}}
							>
								{addBtn("+ Line", "line")}
								{addBtn("+ Left | Right", "lr")}
							</div>
						</>
					)}
				</div>
			)}
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// VISUAL SECTIONS EDITOR
// ═══════════════════════════════════════════════════════════════

function VisualSectionsEditor({ sections, onChange, layout }) {
	const update = (id, s) =>
		onChange(sections.map((x) => (x.id === id ? s : x)));
	const remove = (id) => onChange(sections.filter((x) => x.id !== id));
	const move = (id, dir) => {
		const i = sections.findIndex((x) => x.id === id);
		if (dir === "up" && i === 0) return;
		if (dir === "down" && i === sections.length - 1) return;
		const n = [...sections];
		const j = dir === "up" ? i - 1 : i + 1;
		[n[i], n[j]] = [n[j], n[i]];
		onChange(n);
	};
	const add = () =>
		onChange([
			...sections,
			{
				id: genId(),
				title: "New Section",
				type: "bullets",
				column: "main",
				content: [],
			},
		]);

	return (
		<div>
			{/* Formatting hint */}
			<div
				style={{
					fontSize: 10,
					color: C.textMuted,
					marginBottom: 12,
					display: "flex",
					gap: 6,
					flexWrap: "wrap",
					alignItems: "center",
				}}
			>
				<span>Formatting:</span>
				{[
					["**bold**", "#c4b5fd"],
					["*italic*", "#93c5fd"],
					["[text](url)", "#6ee7b7"],
				].map(([ex, col]) => (
					<code
						key={ex}
						style={{
							background: "rgba(255,255,255,0.05)",
							padding: "1px 5px",
							borderRadius: 3,
							color: col,
							fontSize: 10,
						}}
					>
						{ex}
					</code>
				))}
			</div>

			{sections.map((s, i) => (
				<SectionCard
					key={s.id}
					section={s}
					onUpdate={(v) => update(s.id, v)}
					onRemove={() => remove(s.id)}
					onMoveUp={() => move(s.id, "up")}
					onMoveDown={() => move(s.id, "down")}
					isFirst={i === 0}
					isLast={i === sections.length - 1}
					layout={layout}
				/>
			))}

			<button
				onClick={add}
				style={{
					width: "100%",
					padding: "10px 0",
					marginTop: 4,
					border: `2px dashed ${C.border}`,
					borderRadius: 9,
					background: "transparent",
					color: C.textMuted,
					fontSize: 12,
					fontWeight: 600,
					cursor: "pointer",
					transition: "all 0.15s",
				}}
				onMouseEnter={(e) => {
					e.currentTarget.style.borderColor = C.accent;
					e.currentTarget.style.color = C.accentLight;
					e.currentTarget.style.background = C.accentFaint2;
				}}
				onMouseLeave={(e) => {
					e.currentTarget.style.borderColor = C.border;
					e.currentTarget.style.color = C.textMuted;
					e.currentTarget.style.background = "transparent";
				}}
			>
				+ Add Section
			</button>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// JSON EDITOR PANEL
// ═══════════════════════════════════════════════════════════════

function JsonEditorPanel({ jsonText, onChange, error }) {
	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				gap: 8,
			}}
		>
			<div
				style={{
					fontSize: 10,
					color: C.textMuted,
					lineHeight: 1.6,
					flexShrink: 0,
				}}
			>
				Edit raw JSON — preview syncs automatically.&nbsp;
				{[
					["**bold**", "#c4b5fd"],
					["*italic*", "#93c5fd"],
					["[text](url)", "#6ee7b7"],
				].map(([ex, col]) => (
					<code
						key={ex}
						style={{
							background: "rgba(255,255,255,0.05)",
							padding: "1px 4px",
							borderRadius: 3,
							color: col,
							fontSize: 10,
							marginRight: 4,
						}}
					>
						{ex}
					</code>
				))}
				in content strings.
			</div>

			{error && (
				<div
					style={{
						fontSize: 10,
						color: C.danger,
						background: C.dangerFaint,
						border: `1px solid ${C.danger}44`,
						borderRadius: 5,
						padding: "6px 10px",
						fontFamily: "monospace",
						flexShrink: 0,
						lineHeight: 1.5,
					}}
				>
					⚠ {error}
				</div>
			)}

			<textarea
				value={jsonText}
				onChange={(e) => onChange(e.target.value)}
				spellCheck={false}
				style={{
					flex: 1,
					width: "100%",
					background: "#07080e",
					border: `1px solid ${error ? C.danger + "55" : C.border}`,
					borderRadius: 7,
					color: "#9dd3e8",
					fontSize: 11,
					fontFamily:
						"'Fira Code', 'Cascadia Code', 'Consolas', 'Courier New', monospace",
					padding: "12px",
					outline: "none",
					resize: "none",
					lineHeight: 1.65,
					minHeight: 300,
				}}
			/>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// SETTINGS EDITOR
// ═══════════════════════════════════════════════════════════════

function SliderRow({ label, value, min, max, step = 1, unit = "", onChange }) {
	return (
		<div style={{ marginBottom: 10 }}>
			<div
				style={{
					display: "flex",
					justifyContent: "space-between",
					marginBottom: 3,
				}}
			>
				<span
					style={{
						fontSize: 10,
						fontWeight: 600,
						color: C.textMuted,
						textTransform: "uppercase",
						letterSpacing: "0.07em",
					}}
				>
					{label}
				</span>
				<span
					style={{
						fontSize: 11,
						fontFamily: "monospace",
						color: C.accentLight,
					}}
				>
					{value}
					{unit}
				</span>
			</div>
			<input
				type="range"
				min={min}
				max={max}
				step={step}
				value={value}
				onChange={(e) => onChange(Number(e.target.value))}
				style={{ width: "100%", cursor: "pointer" }}
			/>
		</div>
	);
}

function SettingsEditor({ settings, onChange }) {
	const upd = (key) => (val) => onChange({ ...settings, [key]: val });
	return (
		<div>
			<Field label="Font Family">
				<select
					value={settings.fontFamily}
					onChange={(e) => upd("fontFamily")(e.target.value)}
					style={{ ...iStyle, cursor: "pointer" }}
				>
					{FONTS.map((f) => (
						<option key={f.value} value={f.value}>
							{f.label}
						</option>
					))}
				</select>
			</Field>
			<SliderRow
				label="Font Size"
				value={settings.fontSize ?? 10}
				min={8}
				max={14}
				unit="pt"
				onChange={upd("fontSize")}
			/>
			<div style={{ marginTop: 4, marginBottom: 6 }}>
				<FieldLabel>Page Margins</FieldLabel>
			</div>
			<SliderRow
				label="Top"
				value={settings.marginTop ?? 14}
				min={5}
				max={35}
				unit="mm"
				onChange={upd("marginTop")}
			/>
			<SliderRow
				label="Bottom"
				value={settings.marginBottom ?? 14}
				min={5}
				max={35}
				unit="mm"
				onChange={upd("marginBottom")}
			/>
			<SliderRow
				label="Left"
				value={settings.marginLeft ?? 14}
				min={5}
				max={35}
				unit="mm"
				onChange={upd("marginLeft")}
			/>
			<SliderRow
				label="Right"
				value={settings.marginRight ?? 14}
				min={5}
				max={35}
				unit="mm"
				onChange={upd("marginRight")}
			/>
		</div>
	);
}

// ═══════════════════════════════════════════════════════════════
// TOP BAR BUTTON HELPERS
// ═══════════════════════════════════════════════════════════════

function SegControl({ options, value, onChange }) {
	return (
		<div
			style={{
				display: "flex",
				background: C.surface,
				border: `1px solid ${C.border}`,
				borderRadius: 8,
				overflow: "hidden",
			}}
		>
			{options.map(([v, label]) => (
				<button
					key={v}
					onClick={() => onChange(v)}
					style={{
						padding: "4px 13px",
						fontSize: 11,
						fontWeight: 600,
						border: "none",
						cursor: "pointer",
						background: value === v ? C.accent : "transparent",
						color: value === v ? "white" : C.textSecondary,
						transition: "all 0.15s",
					}}
				>
					{label}
				</button>
			))}
		</div>
	);
}

function TopBtn({ onClick, children, primary = false }) {
	const [hov, setHov] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHov(true)}
			onMouseLeave={() => setHov(false)}
			style={{
				display: "flex",
				alignItems: "center",
				gap: 5,
				background: primary
					? hov
						? C.accentHover
						: C.accent
					: hov
						? C.surfaceHover
						: C.surface,
				border: primary
					? "none"
					: `1px solid ${hov ? C.borderHover : C.border}`,
				borderRadius: 7,
				padding: "5px 13px",
				fontSize: 11,
				fontWeight: primary ? 700 : 600,
				color: primary ? "white" : C.textSecondary,
				cursor: "pointer",
				transition: "all 0.15s",
				whiteSpace: "nowrap",
			}}
		>
			{children}
		</button>
	);
}

// ═══════════════════════════════════════════════════════════════
// APP
// ═══════════════════════════════════════════════════════════════

const TABS = [
	{ id: "header", label: "Header" },
	{ id: "sections", label: "Sections" },
	{ id: "settings", label: "⚙ Settings" },
];

export default function PurpleResume() {
	const [data, setData] = useState(loadFromLocalStorage);
	const [editorMode, setEditorMode] = useState("visual"); // "visual" | "json"
	const [activeTab, setActiveTab] = useState("header");
	const [jsonText, setJsonText] = useState(() =>
		JSON.stringify(loadFromLocalStorage(), null, 2),
	);
	const [jsonError, setJsonError] = useState(null);

	const syncTimer = useRef(null);
	const importRef = useRef(null);

	const layout = data.settings?.layout || "1col";

	const updateHeader = (h) => setData((d) => ({ ...d, header: h }));
	const updateSections = (ss) => setData((d) => ({ ...d, sections: ss }));
	const updateSettings = (s) => setData((d) => ({ ...d, settings: s }));

	// Keep jsonText in sync when editing visually
	useEffect(() => {
		if (editorMode === "visual") {
			setJsonText(JSON.stringify(data, null, 2));
		}
	}, [data, editorMode]);

	// Persist every change to localStorage
	useEffect(() => {
		saveToLocalStorage(data);
	}, [data]);

	useEffect(() => () => clearTimeout(syncTimer.current), []);

	// JSON editor — debounced live sync
	const handleJsonChange = (text) => {
		setJsonText(text);
		clearTimeout(syncTimer.current);
		syncTimer.current = setTimeout(() => {
			try {
				setData(JSON.parse(text));
				setJsonError(null);
			} catch (e) {
				setJsonError(e.message);
			}
		}, 600);
	};

	const goJson = () => {
		setJsonText(JSON.stringify(data, null, 2));
		setJsonError(null);
		setEditorMode("json");
	};

	const goVisual = () => {
		// Try applying latest JSON before leaving
		try {
			setData(JSON.parse(jsonText));
			setJsonError(null);
		} catch {}
		setEditorMode("visual");
	};

	// Export JSON file
	const exportJSON = () => {
		const name = (data.header?.name || "resume")
			.toLowerCase()
			.replace(/\s+/g, "-");
		const blob = new Blob([JSON.stringify(data, null, 2)], {
			type: "application/json",
		});
		const url = URL.createObjectURL(blob);
		const a = Object.assign(document.createElement("a"), {
			href: url,
			download: `${name}.json`,
		});
		a.click();
		URL.revokeObjectURL(url);
	};

	// Import JSON file
	const importJSON = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => {
			try {
				const parsed = JSON.parse(ev.target.result);
				setData(parsed);
				setJsonText(JSON.stringify(parsed, null, 2));
				setJsonError(null);
				setEditorMode("visual");
			} catch {
				alert(
					"Invalid JSON file — please check the format and try again.",
				);
			}
		};
		reader.readAsText(file);
		e.target.value = "";
	};

	return (
		<>
			<style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow: hidden; font-family: 'Inter', system-ui, -apple-system, sans-serif; }
        input, textarea, select { font-family: inherit; }
        input[type=range] { accent-color: #7c3aed; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #2a2d40; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #3a3e55; }
        select option { background: #13151f; }
        @page { size: A4; margin: 0; }
        @media print {
          .no-print { display: none !important; }
          body { overflow: visible !important; background: white; }
          .preview-shell {
            overflow: visible !important;
            background: none !important;
            padding: 0 !important;
            display: block !important;
          }
          #resume-paper {
            box-shadow: none !important;
            border-radius: 0 !important;
            position: fixed;
            top: 0; left: 0;
            width: 210mm;
            min-height: 297mm;
          }
        }
      `}</style>

			<div
				style={{
					background: C.bg,
					color: C.textPrimary,
					height: "100vh",
					display: "flex",
					flexDirection: "column",
					overflow: "hidden",
				}}
			>
				{/* ════════ TOP BAR ════════ */}
				<header
					className="no-print"
					style={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						padding: "0 16px",
						height: 48,
						background: C.panel,
						borderBottom: `1px solid ${C.border}`,
						flexShrink: 0,
						gap: 10,
					}}
				>
					{/* Logo */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 9,
							flexShrink: 0,
						}}
					>
						<div
							style={{
								width: 27,
								height: 27,
								background:
									"linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)",
								borderRadius: 7,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 10,
								fontWeight: 900,
								color: "white",
								letterSpacing: -0.5,
								boxShadow: "0 2px 8px rgba(124,58,237,0.45)",
							}}
						>
							PR
						</div>
						<span
							style={{
								fontSize: 14,
								fontWeight: 800,
								letterSpacing: "-0.4px",
							}}
						>
							Purple
							<span style={{ color: C.accentLight }}>Resume</span>
						</span>
					</div>

					{/* Centre controls */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 8,
						}}
					>
						<SegControl
							options={[
								["1col", "1 Col"],
								["2col", "2 Col"],
							]}
							value={layout}
							onChange={(l) =>
								updateSettings({ ...data.settings, layout: l })
							}
						/>
						<SegControl
							options={[
								["visual", "✏ Visual"],
								["json", "{ } JSON"],
							]}
							value={editorMode}
							onChange={(m) =>
								m === "json" ? goJson() : goVisual()
							}
						/>
					</div>

					{/* Right actions */}
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: 6,
							flexShrink: 0,
						}}
					>
						<TopBtn onClick={() => importRef.current?.click()}>
							↑ Import
						</TopBtn>
						<input
							ref={importRef}
							type="file"
							accept=".json,application/json"
							style={{ display: "none" }}
							onChange={importJSON}
						/>
						<TopBtn onClick={exportJSON}>↓ Export JSON</TopBtn>
						<TopBtn onClick={() => window.print()} primary>
							↓ Export PDF
						</TopBtn>
					</div>
				</header>

				{/* ════════ BODY ════════ */}
				<div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
					{/* ── LEFT PANEL ── */}
					<div
						className="no-print"
						style={{
							width: 380,
							flexShrink: 0,
							display: "flex",
							flexDirection: "column",
							background: C.panel,
							borderRight: `1px solid ${C.border}`,
						}}
					>
						{editorMode === "visual" ? (
							<>
								{/* Tab bar */}
								<div
									style={{
										display: "flex",
										borderBottom: `1px solid ${C.border}`,
										padding: "0 6px",
										flexShrink: 0,
										gap: 0,
									}}
								>
									{TABS.map((t) => (
										<button
											key={t.id}
											onClick={() => setActiveTab(t.id)}
											style={{
												padding: "10px 12px",
												fontSize: 11,
												fontWeight: 600,
												background: "transparent",
												border: "none",
												cursor: "pointer",
												color:
													activeTab === t.id
														? C.accentLight
														: C.textMuted,
												borderBottom:
													activeTab === t.id
														? `2px solid ${C.accent}`
														: "2px solid transparent",
												transition: "all 0.12s",
												whiteSpace: "nowrap",
											}}
										>
											{t.label}
										</button>
									))}
								</div>

								{/* Tab content */}
								<div
									style={{
										flex: 1,
										overflowY: "auto",
										padding: 14,
									}}
								>
									{activeTab === "header" && (
										<HeaderEditor
											header={data.header}
											onChange={updateHeader}
										/>
									)}
									{activeTab === "sections" && (
										<VisualSectionsEditor
											sections={data.sections}
											onChange={updateSections}
											layout={layout}
										/>
									)}
									{activeTab === "settings" && (
										<SettingsEditor
											settings={data.settings}
											onChange={updateSettings}
										/>
									)}
								</div>
							</>
						) : (
							<div
								style={{
									flex: 1,
									padding: 14,
									display: "flex",
									flexDirection: "column",
									overflow: "hidden",
								}}
							>
								<JsonEditorPanel
									jsonText={jsonText}
									onChange={handleJsonChange}
									error={jsonError}
								/>
							</div>
						)}
					</div>

					{/* ── RIGHT PANEL (A4 preview) ── */}
					<div
						className="preview-shell"
						style={{
							flex: 1,
							overflowY: "auto",
							background: "#111420",
							display: "flex",
							justifyContent: "center",
							padding: "32px 28px",
						}}
					>
						<ResumePreview data={data} />
					</div>
				</div>
			</div>
		</>
	);
}
