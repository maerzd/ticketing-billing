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

		const onVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refresh();
			}
		};

		void refresh();
		intervalId = setInterval(() => {
			void refresh();
		}, REFRESH_INTERVAL_MS);

		document.addEventListener("visibilitychange", onVisibilityChange);

		return () => {
			if (intervalId) {
				clearInterval(intervalId);
			}
			document.removeEventListener("visibilitychange", onVisibilityChange);
		};
	}, []);

	return null;
}
