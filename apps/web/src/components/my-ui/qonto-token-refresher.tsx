"use client";

import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 10 * 60 * 1000;

export function QontoTokenRefresher() {
	useEffect(() => {
		let intervalId: ReturnType<typeof setInterval> | undefined;

		const refresh = async () => {
			try {
				const response = await fetch("/api/qonto/auth/refresh", {
					method: "POST",
					cache: "no-store",
				});

				if (response.status === 401 && intervalId) {
					clearInterval(intervalId);
				}
			} catch {
				// Ignore transient network failures; next interval retries.
			}
		};

		void refresh();
		intervalId = setInterval(() => {
			void refresh();
		}, REFRESH_INTERVAL_MS);

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
		};
	}, []);

	return null;
}
