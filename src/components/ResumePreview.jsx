import {
	CircleCheck,
	FileText,
	Minus,
	Plus,
	TriangleAlert,
} from "lucide-react";
import { useLayoutEffect, useRef, useState } from "react";
import { fontStack } from "../data/fonts.js";
import { getPreset } from "../data/presets.js";
import { contactHref, renderText } from "../lib/markdown.jsx";
import { IconButton } from "./IconButton.jsx";

const LETTER_WIDTH_MM = 215.9;
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
			{header.name && (
				<h1 className="resume-name">{renderText(header.name)}</h1>
			)}
			{header.title && (
				<p className="resume-role">{renderText(header.title)}</p>
			)}
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
									{renderText(item.label, { links: false })}
								</a>
							) : (
								renderText(item.label)
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
			{renderText(title)}
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

export function ResumePreview({ data, onMetricsChange, metrics, hasError }) {
	const preset = getPreset(data.settings.preset);
	const paperRef = useRef(null);
	const contentRef = useRef(null);
	const lastMetricsRef = useRef(null);
	const viewportRef = useRef(null);
	const [zoom, setZoom] = useState("fit");
	const [fitScale, setFitScale] = useState(1);
	const scale = zoom === "fit" ? fitScale : zoom / 100;
	const fillPercent = Math.round((metrics?.fillRatio ?? 0) * 100);
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
		const viewport = viewportRef.current;
		const updateFit = () => {
			const paper = paperRef.current;
			if (
				!viewport.clientWidth ||
				!viewport.clientHeight ||
				!paper?.offsetWidth
			)
				return;
			const styles = getComputedStyle(viewport);
			const width =
				viewport.clientWidth -
				Number.parseFloat(styles.paddingLeft) -
				Number.parseFloat(styles.paddingRight);
			const height =
				viewport.clientHeight -
				Number.parseFloat(styles.paddingTop) -
				Number.parseFloat(styles.paddingBottom);
			setFitScale(
				Math.max(
					0.1,
					Math.min(
						1,
						width / paper.offsetWidth,
						height / paper.offsetHeight,
					),
				),
			);
		};
		const observer = new ResizeObserver(updateFit);
		observer.observe(viewport);
		updateFit();
		return () => observer.disconnect();
	}, []);

	useLayoutEffect(() => {
		const paper = paperRef.current;
		const content = contentRef.current;
		if (!paper || !onMetricsChange) return;
		let active = true;

		const updateMetrics = () => {
			if (!active) return;
			const paperRect = paper.getBoundingClientRect();
			if (!paperRect.width || !paper.offsetWidth) return;
			const contentRect = content?.getBoundingClientRect() ?? paperRect;
			const styles = getComputedStyle(paper);
			const renderScale = paperRect.width / paper.offsetWidth;
			const paddingTop = Number.parseFloat(styles.paddingTop);
			const paddingBottom = Number.parseFloat(styles.paddingBottom);
			const usedHeightPx =
				(contentRect.bottom - paperRect.top) / renderScale;
			const pageHeightPx =
				paper.offsetHeight || LETTER_HEIGHT_MM * getPxPerMm();
			const overflowPx = Math.max(
				0,
				usedHeightPx - (pageHeightPx - paddingBottom),
			);
			const contentHeightPx = contentRect.height / renderScale;
			const usableHeightPx = Math.max(
				1,
				pageHeightPx - paddingTop - paddingBottom,
			);
			const pageCount = usedHeightPx / pageHeightPx;
			const metrics = {
				isOverflowing: overflowPx > OVERFLOW_TOLERANCE_PX,
				overflowPx: Math.ceil(overflowPx),
				pageCount,
				fillRatio: contentHeightPx / usableHeightPx,
			};
			const last = lastMetricsRef.current;
			if (
				last &&
				last.isOverflowing === metrics.isOverflowing &&
				last.overflowPx === metrics.overflowPx &&
				Math.abs(last.pageCount - metrics.pageCount) < 0.01 &&
				Math.abs(last.fillRatio - metrics.fillRatio) < 0.005
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
		<section className="preview-pane" aria-label="Resume preview">
			<div className="pane-heading no-print">
				<div className="preview-title-group">
					<h2 className="pane-title">
						<FileText size={16} aria-hidden="true" />
						Preview
					</h2>
					<span className="paper-format">
						{hasError ? "Last valid preview" : "US Letter"}
					</span>
				</div>
				<div
					className="zoom-controls"
					role="group"
					aria-label="Preview zoom controls"
				>
					<IconButton
						icon={Minus}
						label="Zoom out"
						disabled={scale <= 0.25}
						onClick={() =>
							setZoom(
								Math.max(25, Math.ceil(scale * 4) * 25 - 25),
							)
						}
					/>
					<select
						aria-label="Preview zoom"
						value={zoom}
						onChange={(event) =>
							setZoom(
								event.target.value === "fit"
									? "fit"
									: Number(event.target.value),
							)
						}
					>
						<option value="fit">
							Fit ({Math.round(fitScale * 100)}%)
						</option>
						{[25, 50, 75, 100, 125, 150].map((percent) => (
							<option key={percent} value={percent}>
								{percent}%
							</option>
						))}
					</select>
					<IconButton
						icon={Plus}
						label="Zoom in"
						disabled={scale >= 1.5}
						onClick={() =>
							setZoom(
								Math.min(150, Math.floor(scale * 4) * 25 + 25),
							)
						}
						align="end"
					/>
				</div>
			</div>
			<div className="preview-viewport" ref={viewportRef}>
				<div
					className="paper-stage"
					style={{
						width: `${LETTER_WIDTH_MM * scale}mm`,
						minHeight: `${LETTER_HEIGHT_MM * scale}mm`,
					}}
				>
					<div
						className="paper-transform"
						style={{ transform: `scale(${scale})` }}
					>
						<div
							id="resume-paper"
							className="resume-paper"
							ref={paperRef}
							style={paperStyle}
						>
							<div
								className="resume-page-content"
								ref={contentRef}
							>
								<ResumeHeader
									header={data.header}
									preset={preset}
								/>
								{data.sections.length === 0 ? (
									<p className="resume-empty">
										No sections yet.
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
					</div>
				</div>
			</div>
			<div
				className={`preview-footer no-print ${metrics?.isOverflowing ? "is-overflowing" : ""}`}
			>
				<span className="page-fit-status" role="status">
					{metrics?.isOverflowing ? (
						<TriangleAlert size={14} aria-hidden="true" />
					) : (
						<CircleCheck size={14} aria-hidden="true" />
					)}
					{!metrics
						? "Measuring page"
						: metrics.isOverflowing
							? `${metrics.overflowPx} px over one page`
							: "Fits one page"}
				</span>
				<div
					className="page-fit-meter"
					role="meter"
					aria-label="Printable area used"
					aria-valuemin={0}
					aria-valuemax={100}
					aria-valuenow={Math.min(fillPercent, 100)}
					aria-valuetext={`${fillPercent}% of printable area`}
				>
					<span style={{ width: `${Math.min(fillPercent, 100)}%` }} />
				</div>
				<span className="page-fill-label">{fillPercent}% used</span>
				<span className="page-dimensions">8.5 x 11 in</span>
			</div>
		</section>
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
