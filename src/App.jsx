import { useEffect, useRef, useState } from "react";
import { JsonEditor } from "./components/JsonEditor.jsx";
import { ResumePreview } from "./components/ResumePreview.jsx";
import { Toolbar } from "./components/Toolbar.jsx";
import { buildPrompt } from "./data/chatgptPrompt.js";
import { DEFAULT_DATA } from "./data/defaultResume.js";
import { FONTS } from "./data/fonts.js";
import { PRESETS } from "./data/presets.js";
import { downloadJson } from "./lib/download.js";
import { normalize, parseAndNormalize } from "./lib/normalize.js";
import { countResumeCharacters } from "./lib/resumeMetrics.js";
import {
	clearLocalStorage,
	loadFromLocalStorage,
	saveToLocalStorage,
} from "./lib/storage.js";

const DEBOUNCE_MS = 350;
const MARGIN_OPTIONS = [
	{ label: "Very Tight", value: 6 },
	{ label: "Tight", value: 8 },
	{ label: "Compact", value: 10 },
	{ label: "Jake", value: 12.7 },
];

export default function App() {
	const [jsonText, setJsonText] = useState(() =>
		JSON.stringify(loadFromLocalStorage() ?? DEFAULT_DATA, null, 2),
	);
	const [data, setData] = useState(
		() => normalize(loadFromLocalStorage() ?? DEFAULT_DATA).data,
	);
	const [warnings, setWarnings] = useState([]);
	const [parseError, setParseError] = useState(null);
	const [pageMetrics, setPageMetrics] = useState(null);
	const debounceRef = useRef(null);
	const characterCount = countResumeCharacters(data);
	const selectedMargin = getSharedMargin(data.settings);

	useEffect(() => {
		if (debounceRef.current) clearTimeout(debounceRef.current);
		debounceRef.current = setTimeout(() => {
			const result = parseAndNormalize(jsonText);
			setParseError(result.parseError);
			if (!result.parseError) {
				setData(result.data);
				setWarnings(result.warnings);
				saveToLocalStorage(result.data);
			}
		}, DEBOUNCE_MS);
		return () => clearTimeout(debounceRef.current);
	}, [jsonText]);

	const updateSettings = (settingsPatch) => {
		const raw = parseJsonObject(jsonText) ?? data;
		const next = {
			...raw,
			settings: {
				...(isObject(raw.settings) ? raw.settings : data.settings),
				...settingsPatch,
			},
		};
		setJsonText(JSON.stringify(next, null, 2));
	};

	const handleReset = () => {
		const confirmed = window.confirm(
			"Reset the resume to the starter template? This clears your saved draft.",
		);
		if (!confirmed) return;

		const result = normalize(DEFAULT_DATA);
		clearLocalStorage();
		setJsonText(JSON.stringify(DEFAULT_DATA, null, 2));
		setData(result.data);
		setWarnings(result.warnings);
		setParseError(null);
		setPageMetrics(null);
	};

	return (
		<div className="app-shell">
			<Toolbar
				presets={PRESETS}
				selectedPreset={data.settings.preset}
				onPresetChange={(preset) => updateSettings({ preset })}
				fonts={FONTS}
				selectedFont={data.settings.fontFamily}
				onFontChange={(fontFamily) => updateSettings({ fontFamily })}
				marginOptions={MARGIN_OPTIONS}
				selectedMargin={selectedMargin}
				onMarginChange={(margin) =>
					updateSettings({
						marginTop: margin,
						marginBottom: margin,
						marginLeft: margin,
						marginRight: margin,
					})
				}
				onExportPdf={() => window.print()}
				onExportJson={() => downloadJson(data, "resume.json")}
				onDownloadStarter={() =>
					downloadJson(DEFAULT_DATA, "purpleresume-starter.json")
				}
				onCopyPrompt={() =>
					navigator.clipboard.writeText(buildPrompt(jsonText))
				}
				onImportFile={(text) => setJsonText(text)}
				onReset={handleReset}
			/>
			<div className="app-body">
				<div className="editor-pane no-print">
					<JsonEditor
						text={jsonText}
						onChange={setJsonText}
						warnings={warnings}
						parseError={parseError}
						resumeMetrics={{
							characterCount,
							page: pageMetrics,
						}}
					/>
				</div>
				<div className="preview-pane">
					<ResumePreview
						data={data}
						onMetricsChange={setPageMetrics}
					/>
				</div>
			</div>
		</div>
	);
}

function parseJsonObject(text) {
	try {
		const parsed = JSON.parse(stripCodeFence(text));
		return isObject(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function stripCodeFence(text) {
	const trimmed = String(text ?? "").trim();
	const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	return fenced ? fenced[1] : trimmed;
}

function isObject(value) {
	return value !== null && typeof value === "object" && !Array.isArray(value);
}

function getSharedMargin(settings) {
	const margins = [
		settings.marginTop,
		settings.marginBottom,
		settings.marginLeft,
		settings.marginRight,
	];
	const [first] = margins;
	return margins.every((margin) => margin === first) ? first : "custom";
}
