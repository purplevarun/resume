// Short, dependency-free unique id — good enough for React keys and
// section/entry identity within a single resume document.
export function genId() {
	return Math.random().toString(36).slice(2, 10);
}
