export function IconButton({
	icon: Icon,
	label,
	onClick,
	disabled = false,
	pressed,
	className = "",
	align = "center",
}) {
	return (
		<span className="icon-button-wrap" data-tooltip-align={align}>
			<button
				type="button"
				className={`icon-button ${className}`}
				aria-label={label}
				title={label}
				aria-pressed={pressed}
				disabled={disabled}
				onClick={onClick}
			>
				<Icon size={17} strokeWidth={1.75} aria-hidden="true" />
			</button>
			<span className="control-tooltip" aria-hidden="true">
				{label}
			</span>
		</span>
	);
}
