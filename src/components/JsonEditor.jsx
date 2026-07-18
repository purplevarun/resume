import { json } from "@codemirror/lang-json";
import CodeMirror from "@uiw/react-codemirror";

const extensions = [json()];

export function JsonEditor({
	text,
	onChange,
	warnings,
	parseError,
	resumeMetrics,
}) {
	const characterCount = resumeMetrics?.characterCount ?? 0;
	const pageMetrics = resumeMetrics?.page;
	const hasPageMeasurement = Boolean(pageMetrics);
	const isOverflowing = Boolean(pageMetrics?.isOverflowing);
	const hasNotes =
		Boolean(parseError) || warnings.length > 0 || isOverflowing;

	return (
		<div className="json-editor">
			<div className="json-editor-status">
				{parseError ? (
					<span className="status status--error">
						✗ Invalid JSON — not updating the preview until this is
						fixed
					</span>
				) : isOverflowing ? (
					<span className="status status--error">
						✗ Invalid — text spills past page ·{" "}
						{formatNumber(pageMetrics.overflowPx)}px over ·{" "}
						{pageMetrics.pageCount.toFixed(2)} pages
					</span>
				) : warnings.length > 0 ? (
					<span className="status status--warn">
						⚠ {warnings.length} note{warnings.length > 1 ? "s" : ""}{" "}
						— showing a best-effort preview ·{" "}
						{formatNumber(characterCount)} chars
					</span>
				) : (
					<span className="status status--ok">
						✓ Valid · {formatNumber(characterCount)} chars ·{" "}
						{hasPageMeasurement
							? "fits 1 page"
							: "checking page fit"}
					</span>
				)}
			</div>

			{hasNotes && (
				<ul className="json-editor-notes">
					{parseError && <li>{parseError}</li>}
					{isOverflowing && (
						<li>
							Rendered content extends past the usable white page
							area. Trim content, reduce font size, choose a
							tighter margin, or switch to the compact preset.
						</li>
					)}
					{warnings.map((w, i) => (
						<li key={i}>{w}</li>
					))}
				</ul>
			)}

			<div className="json-editor-cm">
				<CodeMirror
					value={text}
					height="100%"
					maxHeight="100%"
					style={{ height: "100%" }}
					theme="dark"
					extensions={extensions}
					onChange={onChange}
					basicSetup={{
						lineNumbers: true,
						foldGutter: true,
						highlightActiveLine: true,
					}}
				/>
			</div>
		</div>
	);
}

function formatNumber(value) {
	return new Intl.NumberFormat("en-IN").format(value);
}
