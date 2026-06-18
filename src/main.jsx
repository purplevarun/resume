import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import PurpleResume from "./PurpleResume.jsx";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<PurpleResume />
	</StrictMode>,
);
