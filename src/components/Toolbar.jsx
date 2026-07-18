import { useRef, useState } from "react";

function Btn({ onClick, children, primary, title }) {
	return (
		<button
			type="button"
			className={`btn${primary ? " btn--primary" : ""}`}
			onClick={onClick}
			title={title}
		>
			{children}
		</button>
	);
}

export function Toolbar({
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
	onDownloadStarter,
	onCopyPrompt,
	onImportFile,
	onReset,
}) {
	const fileInputRef = useRef(null);
	const [copied, setCopied] = useState(false);
	const hasSelectedFont = fonts.some((font) => font.label === selectedFont);
	const hasSelectedMargin = marginOptions.some(
		(option) => option.value === selectedMargin,
	);

	const handleCopyPrompt = async () => {
		await onCopyPrompt();
		setCopied(true);
		setTimeout(() => setCopied(false), 1500);
	};

	const handleFileChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const reader = new FileReader();
		reader.onload = (ev) => onImportFile(String(ev.target.result ?? ""));
		reader.readAsText(file);
		e.target.value = "";
	};

	return (
		<div className="toolbar no-print">
			<span className="toolbar-brand">PurpleResume</span>
			<label className="toolbar-field">
				<span className="toolbar-field-label">Preset</span>
				<select
					className="select"
					value={selectedPreset}
					onChange={(e) => onPresetChange(e.target.value)}
					title="Change the resume preset"
				>
					{presets.map((preset) => (
						<option key={preset.id} value={preset.id}>
							{preset.label}
						</option>
					))}
				</select>
			</label>
			<label className="toolbar-field">
				<span className="toolbar-field-label">Font</span>
				<select
					className="select select--font"
					value={selectedFont}
					onChange={(e) => onFontChange(e.target.value)}
					title="Change the resume font"
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
			<label className="toolbar-field">
				<span className="toolbar-field-label">Margin</span>
				<select
					className="select select--margin"
					value={
						hasSelectedMargin ? String(selectedMargin) : "custom"
					}
					onChange={(e) => onMarginChange(Number(e.target.value))}
					title="Set all four margins together; use JSON for fine tuning"
				>
					{!hasSelectedMargin && (
						<option value="custom" disabled>
							Custom
						</option>
					)}
					{marginOptions.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label} ({option.value}mm)
						</option>
					))}
				</select>
			</label>
			<div className="toolbar-spacer" />
			<Btn
				onClick={onDownloadStarter}
				title="Download the starter JSON — send this plus a job description to ChatGPT"
			>
				↓ Starter JSON
			</Btn>
			<Btn
				onClick={handleCopyPrompt}
				title="Copy the ChatGPT prompt template to your clipboard"
			>
				{copied ? "Copied ✓" : "Copy Prompt"}
			</Btn>
			<Btn
				onClick={() => fileInputRef.current?.click()}
				title="Import a resume JSON file"
			>
				↑ Import
			</Btn>
			<Btn
				onClick={onReset}
				title="Reset to the starter resume and clear the saved draft"
			>
				↺ Reset
			</Btn>
			<Btn
				onClick={onExportJson}
				title="Download the current resume as JSON"
			>
				↓ Export JSON
			</Btn>
			<Btn
				onClick={onExportPdf}
				primary
				title="Opens your browser's print dialog — choose Save as PDF"
			>
				↓ Export PDF
			</Btn>
			<input
				ref={fileInputRef}
				type="file"
				accept="application/json,.json"
				onChange={handleFileChange}
				hidden
			/>
		</div>
	);
}
