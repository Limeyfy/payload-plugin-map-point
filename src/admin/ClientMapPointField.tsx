"use client";
import type {
	DefaultCellComponentProps,
	DefaultServerCellComponentProps,
	FieldClientComponent,
	FieldDescriptionClientProps,
	FieldDescriptionServerProps,
	FieldDiffClientProps,
	FieldDiffServerProps,
	FieldServerComponent,
	PayloadComponent,
} from "payload";
import type { CustomPointFieldClientProps } from "./config";
import MapPointField from "./MapPointField";

export type ClientComponentsProps = {
	Cell?: PayloadComponent<
		DefaultServerCellComponentProps,
		DefaultCellComponentProps
	>;
	Description?: PayloadComponent<
		FieldDescriptionServerProps,
		FieldDescriptionClientProps
	>;
	Diff?: PayloadComponent<FieldDiffServerProps, FieldDiffClientProps>;
	Field?: PayloadComponent<FieldClientComponent | FieldServerComponent>;
	Filter?: PayloadComponent;
};

export const ClientMapPointField = (props: CustomPointFieldClientProps) => {
	return <MapPointField {...props} />;
};

export default ClientMapPointField;
