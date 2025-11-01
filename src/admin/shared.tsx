import { useTheme } from "@payloadcms/ui";
import type React from "react";
import { type FC, useEffect, useRef, useState } from "react";

export const useUI = () => {
	const { theme } = useTheme();
	const ui =
		theme === "dark"
			? {
					bg: "var(--theme-elevation-200)",
					bgAlt: "var(--theme-elevation-150)",
					border: "var(--theme-border-color)",
					pin: "var(--theme-error-400)",
					pinBorder: "var(--theme-elevation-200)",
					subtle: "var(--theme-elevation-400)",
					text: "var(--theme-elevation-900)",
					theme,
				}
			: ({
					bg: "var(--theme-elevation-0)",
					bgAlt: "var(--theme-elevation-50)",
					border: "var(--theme-border-color)",
					pin: "var(--theme-error-400)",
					pinBorder: "var(--theme-elevation-0)",
					subtle: "var(--theme-elevation-500)",
					text: "var(--theme-elevation-900)",
					theme,
				} as const);
	return ui;
};

export type AutocompleteOption = {
	displayName: string;
	lng: number;
	lat: number;
};

export const SearchBar: React.FC<{
	value: string;
	onChange: (v: string) => void;
	onSubmit?: () => void;
	placeholder?: string;
	options?: AutocompleteOption[];
	onSelectOption?: (option: AutocompleteOption) => void;
}> = ({
	value,
	onChange,
	onSubmit,
	placeholder,
	options = [],
	onSelectOption,
}) => {
	const ui = useUI();
	const [isFocused, setIsFocused] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				containerRef.current &&
				!containerRef.current.contains(event.target as Node)
			) {
				setIsFocused(false);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, []);

	return (
		<div
			ref={containerRef}
			style={{ position: "relative", display: "flex", gap: 8 }}
		>
			<div style={{ position: "relative", width: "100%" }}>
				<input
					type="text"
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onFocus={() => setIsFocused(true)}
					onKeyDown={(e) => {
						if (e.key === "Enter" && onSubmit) {
							onSubmit();
						}
					}}
					placeholder={placeholder || "Search location"}
					style={{
						width: "100%",
					}}
				/>
				{isFocused && options.length > 0 && (
					<div
						style={{
							position: "absolute",
							top: "100%",
							left: 0,
							right: 0,
							zIndex: 1000,
							background: ui.bg,
							border: `1px solid ${ui.border}`,
							borderRadius: 6,
							marginTop: 4,
							maxHeight: 200,
							overflowY: "auto",
							boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
						}}
					>
						{options.map((option, index) => (
							<button
								key={`${option.displayName}-${index}`}
								type="button"
								onClick={() => {
									if (onSelectOption) {
										onSelectOption(option);
									}
									setIsFocused(false);
								}}
								style={{
									width: "100%",
									padding: "8px 12px",
									textAlign: "left",
									background: "transparent",
									border: "none",
									color: ui.text,
									cursor: "pointer",
									borderBottom:
										index < options.length - 1
											? `1px solid ${ui.border}`
											: "none",
								}}
								onMouseEnter={(e) => {
									e.currentTarget.style.background = ui.bgAlt;
								}}
								onMouseLeave={(e) => {
									e.currentTarget.style.background = "transparent";
								}}
							>
								{option.displayName}
							</button>
						))}
					</div>
				)}
			</div>
			{onSubmit && (
				<button
					type="button"
					onClick={onSubmit}
					style={{
						background: ui.bgAlt,
						border: `1px solid ${ui.border}`,
						borderRadius: 6,
						color: ui.text,
						cursor: "pointer",
						padding: "8px 12px",
					}}
				>
					Search
				</button>
			)}
		</div>
	);
};

export const Footer: FC<{
	value: [number, number] | null;
	onClear: () => void;
}> = ({ value, onClear }) => {
	const ui = useUI();
	return (
		<div style={{ alignItems: "center", display: "flex", gap: 8 }}>
			<small style={{ color: ui.subtle, opacity: 0.9 }}>
				{value
					? `Lng, Lat: ${value[0]?.toFixed(6)}, ${value[1]?.toFixed(6)}`
					: "Click the map to set a point"}
			</small>
			<button
				type="button"
				disabled={!value}
				onClick={onClear}
				style={{
					background: ui.bgAlt,
					border: `1px solid ${ui.border}`,
					borderRadius: 6,
					color: ui.text,
					cursor: "pointer",
					marginLeft: "auto",
					padding: "6px 10px",
				}}
			>
				Clear
			</button>
		</div>
	);
};
