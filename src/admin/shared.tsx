import { useTheme } from '@payloadcms/ui';
import type React from 'react';

export const useUI = () => {
	const { theme } = useTheme();
	const ui =
		theme === 'dark'
			? {
					bg: 'var(--theme-elevation-200)',
					bgAlt: 'var(--theme-elevation-150)',
					border: 'var(--theme-border-color)',
					pin: 'var(--theme-error-400)',
					pinBorder: 'var(--theme-elevation-200)',
					subtle: 'var(--theme-elevation-400)',
					text: 'var(--theme-elevation-900)',
					theme,
				}
			: ({
					bg: 'var(--theme-elevation-0)',
					bgAlt: 'var(--theme-elevation-50)',
					border: 'var(--theme-border-color)',
					pin: 'var(--theme-error-400)',
					pinBorder: 'var(--theme-elevation-0)',
					subtle: 'var(--theme-elevation-500)',
					text: 'var(--theme-elevation-900)',
					theme,
				} as const);
	return ui;
};

export const SearchBar: React.FC<{
	value: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
	placeholder?: string;
}> = ({ value, onChange, onSubmit, placeholder }) => {
	const ui = useUI();
	return (
		<div style={{ display: 'flex', gap: 8 }}>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') onSubmit();
				}}
				placeholder={placeholder || 'Search location'}
				style={{
					width: '100%',
				}}
			/>
			<button
				type="button"
				onClick={onSubmit}
				style={{
					background: ui.bgAlt,
					border: `1px solid ${ui.border}`,
					borderRadius: 6,
					color: ui.text,
					cursor: 'pointer',
					padding: '8px 12px',
				}}
			>
				Search
			</button>
		</div>
	);
};

export const Footer: React.FC<{
	value: [number, number] | null;
	onClear: () => void;
}> = ({ value, onClear }) => {
	const ui = useUI();
	return (
		<div style={{ alignItems: 'center', display: 'flex', gap: 8 }}>
			<small style={{ color: ui.subtle, opacity: 0.9 }}>
				{value
					? `Lng, Lat: ${value[0]?.toFixed(6)}, ${value[1]?.toFixed(6)}`
					: 'Click the map to set a point'}
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
					cursor: 'pointer',
					marginLeft: 'auto',
					padding: '6px 10px',
				}}
			>
				Clear
			</button>
		</div>
	);
};
