import type { MapPointPluginOptions } from '../types';

export type PointValue = [number, number] | null;

export type MapPointAdminOptions = MapPointPluginOptions;

export type FieldLike = {
	name: string;
	label?: string;
	type?: string;
	admin?: {
		readOnly?: boolean;
		mapPoint?: MapPointAdminOptions;
		components?: {
			Field?: string;
		};
	};
};

export type AdminFieldProps = {
	path: string;
	field: FieldLike;
	value: PointValue;
	onChange?: (val: PointValue) => void;
};
