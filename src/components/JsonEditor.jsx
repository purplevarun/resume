import { redo, redoDepth, undo, undoDepth } from "@codemirror/commands";
import { json } from "@codemirror/lang-json";
import { openSearchPanel, search } from "@codemirror/search";
import CodeMirror from "@uiw/react-codemirror";
import {
	AlignLeft,
	Check,
	CircleCheck,
	Copy,
	FileJson,
	Redo2,
	Search,
	TriangleAlert,
	Undo2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { IconButton } from "./IconButton.jsx";

const extensions = [json(), search()];

export function JsonEditor({
	text,
	onChange,
	warnings,
	parseError,
	resumeMetrics,
}) {
	const editorRef = useRef(null);
	const [history, setHistory] = useState({ undo: false, redo: false });
	const [copied, setCopied] = useState(false);
	const [actionError, setActionError] = useState(null);
	const characterCount = resumeMetrics?.characterCount ?? 0;
	const hasNotes = Boolean(parseError) || warnings.length > 0;

	useEffect(() => {
		if (!copied) return;
		const timer = setTimeout(() => setCopied(false), 2000);
		return () => clearTimeout(timer);
	}, [copied]);

	const runCommand = (command) => {
		if (!editorRef.current) return;
		command(editorRef.current);
		if (command !== openSearchPanel) editorRef.current.focus();
	};

	const handleFormat = () => {
		try {
			const source = text
				.trim()
				.replace(/^```(?:json)?\s*([\s\S]*?)\s*```$/i, "$1");
			const formatted = JSON.stringify(JSON.parse(source), null, 2);
			const editor = editorRef.current;
			if (editor && formatted !== text) {
				editor.dispatch({
					changes: {
						from: 0,
						to: editor.state.doc.length,
						insert: formatted,
					},
					userEvent: "input.format",
				});
			}
			setActionError(null);
		} catch {
			setActionError("Invalid JSON cannot be formatted.");
		}
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(text);
			setCopied(true);
			setActionError(null);
		} catch {
			setActionError("Clipboard access is unavailable.");
		}
	};

	return (
		<div className="json-editor">
			<div className="pane-heading">
				<h2 className="pane-title">
					<FileJson size={16} aria-hidden="true" />
					Source
				</h2>
				<div className="pane-tools">
					<IconButton
						icon={Undo2}
						label="Undo"
						disabled={!history.undo}
						onClick={() => runCommand(undo)}
					/>
					<IconButton
						icon={Redo2}
						label="Redo"
						disabled={!history.redo}
						onClick={() => runCommand(redo)}
					/>
					<span className="tool-separator" />
					<IconButton
						icon={Search}
						label="Find in JSON"
						onClick={() => runCommand(openSearchPanel)}
					/>
					<IconButton
						icon={AlignLeft}
						label="Format JSON"
						onClick={handleFormat}
					/>
					<IconButton
						icon={copied ? Check : Copy}
						label={copied ? "JSON copied" : "Copy JSON"}
						onClick={handleCopy}
						align="end"
					/>
				</div>
			</div>
			{hasNotes && (
				<details
					className="json-editor-diagnostics"
					open={Boolean(parseError)}
				>
					<summary>
						<TriangleAlert size={14} aria-hidden="true" />
						{parseError
							? "JSON needs attention"
							: `${warnings.length} normalization ${warnings.length === 1 ? "note" : "notes"}`}
					</summary>
					<ul className="json-editor-notes">
						{parseError && <li>{parseError}</li>}
						{warnings.map((warning, index) => (
							<li key={index}>{warning}</li>
						))}
					</ul>
				</details>
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
					onCreateEditor={(editor) => {
						editorRef.current = editor;
					}}
					onUpdate={(update) => {
						if (!update.docChanged) return;
						setActionError(null);
						const next = {
							undo: undoDepth(update.state) > 0,
							redo: redoDepth(update.state) > 0,
						};
						setHistory((previous) =>
							previous.undo === next.undo &&
							previous.redo === next.redo
								? previous
								: next,
						);
					}}
					basicSetup={{
						lineNumbers: true,
						foldGutter: true,
						highlightActiveLine: true,
					}}
				/>
			</div>
			<div className="json-editor-footer" role="status">
				<span
					className={`editor-validity ${parseError || actionError ? "is-error" : "is-valid"}`}
				>
					{parseError || actionError ? (
						<TriangleAlert size={13} aria-hidden="true" />
					) : (
						<CircleCheck size={13} aria-hidden="true" />
					)}
					{actionError ??
						(parseError ? "Invalid JSON" : "Valid JSON")}
				</span>
				<span className="editor-character-count">
					{new Intl.NumberFormat("en-US").format(characterCount)}{" "}
					characters
				</span>
			</div>
		</div>
	);
}
