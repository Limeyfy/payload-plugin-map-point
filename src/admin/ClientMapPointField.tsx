"use client";
import {
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
import MapPointField from "./MapPointField";
import { CustomPointFieldClientProps } from "./config";

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
