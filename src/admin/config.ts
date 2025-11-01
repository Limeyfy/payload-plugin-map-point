import { deepMerge, type PointFieldClientProps } from 'payload';
import type { MapPointPluginOptions } from '../types';
import type { ClientComponentsProps } from './ClientMapPointField';

export const defaultConfigProps: ClientComponentsProps = {
	Field: {
		path: '@limeyfy/payload-plugin-map-point/admin/ClientMapPointField',
	},
};

type GetConfigProps = {
	clientProps: {
		apiKey: string;
	};
};

export type CustomPointFieldClientProps = PointFieldClientProps & {
	apiKey: string;
	field: PointFieldClientProps['field'] & {
		admin: PointFieldClientProps['field']['admin'] & {
			mapPoint: MapPointPluginOptions;
		};
	};
};

export const getConfig = (props: GetConfigProps): ClientComponentsProps => {
	const config: ClientComponentsProps = {
		Field: {
			clientProps: {
				apiKey: props.clientProps.apiKey,
			},
			path: '@limeyfy/payload-plugin-map-point/admin/ClientMapPointField',
		},
	};
	return deepMerge(defaultConfigProps, config);
};
