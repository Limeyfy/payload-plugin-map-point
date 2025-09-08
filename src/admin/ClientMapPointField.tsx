"use client";
import MapPointField from "./MapPointField";
import type { AdminFieldProps } from "./types";

export default function ClientMapPointField(props: AdminFieldProps) {
	return <MapPointField {...props} />;
}
