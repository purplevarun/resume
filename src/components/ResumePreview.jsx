import { useLayoutEffect, useRef } from "react";
import { fontStack } from "../data/fonts.js";
import { getPreset } from "../data/presets.js";
import { contactHref, renderText } from "../lib/markdown.jsx";

const LETTER_HEIGHT_MM = 279.4;
const OVERFLOW_TOLERANCE_PX = 2;
let pxPerMm;

function ResumeHeader({ header, preset }) {
	const items = [
		header.email && {
			label: header.email,
			href: contactHref("email", header.email),
		},
		header.phone && {
			label: header.phone,
			href: contactHref("phone", header.phone),
		},
		header.location && { label: header.location, href: null },
		header.linkedin && {
			label: header.linkedin,
			href: contactHref("url", header.linkedin),
		},
		header.github && {
			label: header.github,
			href: contactHref("url", header.github),
		},
		header.portfolio && {
			label: header.portfolio,
			href: contactHref("url", header.portfolio),
		},
	].filter(Boolean);

	return (
		<header
			className={`resume-header resume-header--${preset.headerAlign}`}
		>
			{header.name && <h1 className="resume-name">{header.name}</h1>}
			{header.title && <p className="resume-role">{header.title}</p>}
			{items.length > 0 && (
				<p className="resume-contact">
					{items.map((item, i) => (
						<span className="resume-contact-item" key={i}>
							{i > 0 && (
								<span className="resume-contact-sep">|</span>
							)}
							{item.href ? (
								<a
									href={item.href}
									target="_blank"
									rel="noreferrer"
								>
									{item.label}
								</a>
							) : (
								item.label
							)}
						</span>
					))}
				</p>
			)}
		</header>
	);
}

function SecTitle({ title, preset }) {
	return (
		<h2 className={`resume-heading resume-heading--${preset.headingStyle}`}>
			{title}
		</h2>
	);
}

function SectionBlock({ section, preset }) {
	const isKeyValueList =
		section.type === "bullets" &&
		section.content.length > 0 &&
		section.content.every((item) => typeof item !== "string");

	return (
		<section
			className={`resume-section${preset.tight ? " resume-section--tight" : ""}`}
		>
			<SecTitle title={section.title} preset={preset} />
			{section.type === "paragraph" ? (
				<p className="resume-paragraph">
					{renderText(section.content)}
				</p>
			) : (
				<div
					className={`resume-bullets${isKeyValueList ? " resume-bullets--pairs" : ""}`}
				>
					{section.content.map((item, i) =>
						typeof item === "string" ? (
							<div className="resume-bullet-line" key={i}>
								<span className="resume-bullet-marker">•</span>
								<span className="resume-bullet-text">
									{renderText(item)}
								</span>
							</div>
						) : (
							<div
								className={
									isKeyValueList
										? "resume-key-value-row"
										: "resume-entry-header"
								}
								key={i}
							>
								<span
									className={
										isKeyValueList
											? "resume-key-value-left"
											: "resume-entry-left"
									}
								>
									{renderText(item.left)}
								</span>
								{item.right && (
									<span
										className={
											isKeyValueList
												? "resume-key-value-right"
												: "resume-entry-right"
										}
									>
										{renderText(item.right)}
									</span>
								)}
							</div>
						),
					)}
				</div>
			)}
		</section>
	);
}

export function ResumePreview({ data, onMetricsChange }) {
	const preset = getPreset(data.settings.preset);
	const paperRef = useRef(null);
	const contentRef = useRef(null);
	const lastMetricsRef = useRef(null);
	const s = data.settings;
	const paperStyle = {
		fontFamily: fontStack(s.fontFamily),
		fontSize: `${s.fontSize}pt`,
		paddingTop: `${s.marginTop}mm`,
		paddingBottom: `${s.marginBottom}mm`,
		paddingLeft: `${s.marginLeft}mm`,
		paddingRight: `${s.marginRight}mm`,
	};

	useLayoutEffect(() => {
		const paper = paperRef.current;
		const content = contentRef.current;
		if (!paper || !onMetricsChange) return;
		let active = true;

		const updateMetrics = () => {
			if (!active) return;
			const paperRect = paper.getBoundingClientRect();
			const contentRect = content?.getBoundingClientRect() ?? paperRect;
			const styles = getComputedStyle(paper);
			const usableBottom =
				paperRect.bottom - Number.parseFloat(styles.paddingBottom);
			const overflowPx = Math.max(0, contentRect.bottom - usableBottom);
			const usedHeightPx = contentRect.bottom - paperRect.top;
			const pageHeightPx =
				paperRect.height || LETTER_HEIGHT_MM * getPxPerMm();
			const pageCount = usedHeightPx / pageHeightPx;
			const metrics = {
				isOverflowing: overflowPx > OVERFLOW_TOLERANCE_PX,
				overflowPx: Math.ceil(overflowPx),
				pageCount,
			};
			const last = lastMetricsRef.current;
			if (
				last &&
				last.isOverflowing === metrics.isOverflowing &&
				last.overflowPx === metrics.overflowPx &&
				Math.abs(last.pageCount - metrics.pageCount) < 0.01
			) {
				return;
			}
			lastMetricsRef.current = metrics;
			onMetricsChange(metrics);
		};

		updateMetrics();
		const resizeObserver = new ResizeObserver(updateMetrics);
		resizeObserver.observe(paper);
		if (content) resizeObserver.observe(content);
		window.addEventListener("resize", updateMetrics);
		const frame = requestAnimationFrame(updateMetrics);
		if (document.fonts) {
			document.fonts.ready.then(updateMetrics);
		}

		return () => {
			active = false;
			cancelAnimationFrame(frame);
			resizeObserver.disconnect();
			window.removeEventListener("resize", updateMetrics);
		};
	}, [data, onMetricsChange]);

	return (
		<div
			id="resume-paper"
			className="resume-paper"
			ref={paperRef}
			style={paperStyle}
		>
			<div className="resume-page-content" ref={contentRef}>
				<ResumeHeader header={data.header} preset={preset} />
				{data.sections.length === 0 ? (
					<p className="resume-empty">
						No sections yet — add some in the JSON editor on the
						left.
					</p>
				) : (
					data.sections.map((section) => (
						<SectionBlock
							key={section.id}
							section={section}
							preset={preset}
						/>
					))
				)}
			</div>
		</div>
	);
}

function getPxPerMm() {
	if (pxPerMm) return pxPerMm;

	const probe = document.createElement("div");
	probe.style.position = "absolute";
	probe.style.visibility = "hidden";
	probe.style.width = "100mm";
	document.body.appendChild(probe);
	pxPerMm = probe.getBoundingClientRect().width / 100;
	probe.remove();
	return pxPerMm;
}
