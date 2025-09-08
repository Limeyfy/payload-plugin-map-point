"use client";
import { useField } from "@payloadcms/ui";
import MapPointField from "./MapPointField";
import type { AdminFieldProps, PointValue } from "./types";

export default function ClientMapPointField(props: AdminFieldProps) {
	const { path, field } = props as AdminFieldProps & { [key: string]: any };

	// Bind to Payload form state for this field
	const { value, setValue } = useField<PointValue>({ path });

	return (
		<MapPointField
			path={path}
			field={field}
			value={value}
			onChange={setValue}
		/>
	);
}
