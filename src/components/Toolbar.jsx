import {
	ArrowDownToLine,
	Check,
	ChevronDown,
	CircleCheck,
	Code2,
	Columns2,
	FileJson,
	FileText,
	FolderOpen,
	Loader2,
	Minus,
	Plus,
	RotateCcw,
	Sparkles,
	TriangleAlert,
	X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton.jsx";

function ActionMenu({ label, trigger, children, className = "" }) {
	const menuRef = useRef(null);

	useEffect(() => {
		const closeOutside = (event) => {
			if (!menuRef.current?.contains(event.target))
				menuRef.current?.removeAttribute("open");
		};
		const closeOnEscape = (event) => {
			if (event.key !== "Escape" || !menuRef.current?.open) return;
			menuRef.current.removeAttribute("open");
			menuRef.current.querySelector("summary").focus();
		};
		document.addEventListener("pointerdown", closeOutside);
		document.addEventListener("keydown", closeOnEscape);
		return () => {
			document.removeEventListener("pointerdown", closeOutside);
			document.removeEventListener("keydown", closeOnEscape);
		};
	}, []);

	return (
		<details
			className={`action-menu ${className}`}
			ref={menuRef}
			onClick={(event) => {
				if (event.target.closest("button"))
					menuRef.current.removeAttribute("open");
			}}
			onKeyDown={(event) => {
				if (
					!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)
				)
					return;
				event.preventDefault();
				menuRef.current.open = true;
				const buttons = [
					...menuRef.current.querySelectorAll(
						"button:not(:disabled)",
					),
				];
				const current = buttons.indexOf(document.activeElement);
				const next =
					event.key === "Home"
						? 0
						: event.key === "End" ||
							  (event.key === "ArrowUp" && current === -1)
							? buttons.length - 1
							: event.key === "ArrowDown"
								? (current + 1) % buttons.length
								: (current - 1 + buttons.length) %
									buttons.length;
				buttons[next]?.focus();
			}}
		>
			<summary className="menu-trigger" aria-label={label}>
				{trigger}
			</summary>
			<div className="action-menu-panel">{children}</div>
		</details>
	);
}

export function Toolbar({
	resumeTitle,
	viewMode,
	onViewChange,
	fontSize = 11,
	onFontSizeStep,
	isParsing,
	hasError,
	presets,
	selectedPreset,
	onPresetChange,
	fonts,
	selectedFont,
	onFontChange,
	marginOptions,
	selectedMargin,
	onMarginChange,
	onExportPdf,
	onExportJson,
	onCopyPrompt,
	onReset,
}) {
	const [copied, setCopied] = useState(false);
	const [actionError, setActionError] = useState(null);
	const exportBlocked = isParsing || hasError;
	const hasSelectedFont = fonts.some((font) => font.label === selectedFont);
	const hasSelectedMargin = marginOptions.some(
		(option) => option.value === selectedMargin,
	);

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [copied]);

	const handleCopyPrompt = async () => {
		try {
			await onCopyPrompt();
			setCopied(true);
			setActionError(null);
		} catch {
			setActionError("Clipboard access is unavailable.");
		}
	};

	return (
		<>
			<header className="workspace-header no-print">
				<div className="brand-lockup">
					<span className="brand-mark">
						<FileText
							size={19}
							strokeWidth={1.7}
							aria-hidden="true"
						/>
					</span>
					<span>
						Purple<span className="brand-wordmark">Resume</span>
					</span>
				</div>
				<div className="document-heading">
					<h1>{resumeTitle}</h1>
					<span
						className={`document-status ${hasError ? "is-error" : ""}`}
					>
						{isParsing ? (
							<Loader2
								size={12}
								className="is-spinning"
								aria-hidden="true"
							/>
						) : hasError ? (
							<TriangleAlert size={12} aria-hidden="true" />
						) : (
							<CircleCheck size={12} aria-hidden="true" />
						)}
						{isParsing
							? "Updating preview"
							: hasError
								? "JSON needs attention"
								: "Saved in this browser"}
					</span>
				</div>
				<div className="header-actions">
					<button
						type="button"
						className="action-button prompt-button"
						onClick={handleCopyPrompt}
						title="Copy AI prompt"
						aria-label={copied ? "Prompt copied" : "Copy AI prompt"}
					>
						{copied ? (
							<Check size={16} aria-hidden="true" />
						) : (
							<Sparkles size={16} aria-hidden="true" />
						)}
						<span>{copied ? "Copied" : "Copy prompt"}</span>
					</button>
					<button
						type="button"
						className="action-button primary-button"
						onClick={onExportPdf}
						disabled={exportBlocked}
					>
						<ArrowDownToLine size={16} aria-hidden="true" />
						Export PDF
					</button>
				</div>
			</header>
			<div className="workspace-toolbar no-print">
				<ActionMenu
					label="File actions"
					className="file-menu"
					trigger={
						<>
							<FolderOpen size={16} aria-hidden="true" />
							<span>File</span>
							<ChevronDown size={12} aria-hidden="true" />
						</>
					}
				>
					<button
						type="button"
						onClick={onExportJson}
						disabled={exportBlocked}
					>
						<FileJson size={16} aria-hidden="true" />
						Export JSON
					</button>
					<hr />
					<button
						type="button"
						className="danger-action"
						onClick={onReset}
					>
						<RotateCcw size={16} aria-hidden="true" />
						Reset resume
					</button>
				</ActionMenu>
				<div className="formatting-controls">
					<label className="format-field">
						<span>Template</span>
						<select
							aria-label="Template"
							value={selectedPreset}
							onChange={(event) =>
								onPresetChange(event.target.value)
							}
							disabled={hasError}
						>
							{presets.map((preset) => (
								<option key={preset.id} value={preset.id}>
									{preset.label}
								</option>
							))}
						</select>
					</label>
					<label className="format-field font-field">
						<span>Font</span>
						<select
							aria-label="Font family"
							value={selectedFont}
							onChange={(event) =>
								onFontChange(event.target.value)
							}
							disabled={hasError}
						>
							{!hasSelectedFont && (
								<option value={selectedFont} disabled>
									Custom
								</option>
							)}
							{fonts.map((font) => (
								<option key={font.label} value={font.label}>
									{font.label}
								</option>
							))}
						</select>
					</label>
					<div
						className="font-size-control"
						role="group"
						aria-label="Font size"
					>
						<IconButton
							icon={Minus}
							label="Decrease font size"
							onClick={() => onFontSizeStep(-0.5)}
							disabled={hasError || fontSize <= 6}
						/>
						<output aria-label="Font size">
							{fontSize}
							<span>pt</span>
						</output>
						<IconButton
							icon={Plus}
							label="Increase font size"
							onClick={() => onFontSizeStep(0.5)}
							disabled={hasError || fontSize >= 30}
						/>
					</div>
					<label className="format-field margin-field">
						<span>Margins</span>
						<select
							aria-label="Page margins"
							value={
								hasSelectedMargin
									? String(selectedMargin)
									: "custom"
							}
							onChange={(event) =>
								onMarginChange(Number(event.target.value))
							}
							disabled={hasError}
						>
							{!hasSelectedMargin && (
								<option value="custom" disabled>
									Custom
								</option>
							)}
							{marginOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.value} mm
								</option>
							))}
						</select>
					</label>
				</div>
				<div
					className="workspace-views"
					role="group"
					aria-label="Workspace view"
				>
					{[
						{ value: "source", label: "Source", icon: Code2 },
						{ value: "split", label: "Split", icon: Columns2 },
						{ value: "preview", label: "Preview", icon: FileText },
					].map(({ value, label, icon: ViewIcon }) => (
						<button
							type="button"
							key={value}
							className={`view-option view-option--${value}`}
							aria-label={label}
							title={`${label} view`}
							aria-pressed={viewMode === value}
							onClick={() => onViewChange(value)}
						>
							<ViewIcon size={15} aria-hidden="true" />
							<span>{label}</span>
						</button>
					))}
				</div>
			</div>
			{actionError && (
				<div className="workspace-notice no-print" role="status">
					<span>{actionError}</span>
					<IconButton
						icon={X}
						label="Dismiss status"
						onClick={() => setActionError(null)}
						align="end"
					/>
				</div>
			)}
		</>
	);
}
