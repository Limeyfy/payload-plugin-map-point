import { deepMerge } from "payload";
import { ClientComponentsProps } from "./ClientMapPointField";
import { PointFieldClientProps } from "payload";
import { MapPointPluginOptions } from "../types";

export const defaultConfigProps: ClientComponentsProps = {
  Field: {
    path: "@limeyfy/payload-plugin-map-point/admin/ClientMapPointField",
  },
};

type GetConfigProps = {
	clientProps: {
		apiKey: string;
	};
};

export type CustomPointFieldClientProps = PointFieldClientProps & {
  apiKey: string;
  field: PointFieldClientProps["field"] & {
    admin: PointFieldClientProps["field"]["admin"] & {
      mapPoint: MapPointPluginOptions;
    };
  };
};

export const getConfig = (props: GetConfigProps): ClientComponentsProps => {
  const config: ClientComponentsProps = {
    Field: {
      path: "@limeyfy/payload-plugin-map-point/admin/ClientMapPointField",
      clientProps: {
        apiKey: props.clientProps.apiKey,
      },
    },
  };
  return deepMerge(defaultConfigProps, config);
};
