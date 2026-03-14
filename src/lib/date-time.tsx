"use client";

import { Suspense } from "react";
import { useHydration } from "@/hooks/use-hydration";

/**
 * Pure date formatting utilities (no client/server dependency)
 * Imported by both server and client code
 */

const LOCALE = "de-DE";

export function formatDate(
	date?: Date | string | number,
	defaultValue = "",
	options: Intl.DateTimeFormatOptions = {},
) {
	if (!date) {
		return defaultValue;
	}
	return new Date(date).toLocaleDateString(LOCALE, {
		weekday: "long",
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
		...options,
	});
}

export function formatTime(date: Date | string | number) {
	return new Date(date).toLocaleTimeString(LOCALE, {
		hour12: false,
		hour: "2-digit",
		minute: "2-digit",
	});
}

type Props = React.ComponentProps<"time"> & {
	date: Date | string | number | undefined;
	format: Intl.DateTimeFormatOptions;
	hydratedSuffix?: React.ReactNode;
};

export function LocalDateTime({
	date,
	format,
	hydratedSuffix = null,
	...props
}: Props) {
	const hydrated = useHydration();
	if (!date) {
		return null;
	}
	const iso = new Date(date).toISOString();

	const formatOptions = {
		...format,
		timeZone: "Europe/Berlin",
	};
	return (
		<Suspense key={hydrated ? "local" : "utc"}>
			<time dateTime={iso} title={iso} {...props}>
				{new Date(date).toLocaleString(LOCALE, formatOptions)}
				{hydratedSuffix}
			</time>
		</Suspense>
	);
}
