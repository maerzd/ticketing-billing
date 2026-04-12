"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface QontoErrorToastProps {
	error?: string;
	description?: string;
}

export function QontoErrorToast({ error, description }: QontoErrorToastProps) {
	useEffect(() => {
		if (error) {
			toast.error("Qonto-Verbindungsfehler", {
				description: description || error,
			});
		}
	}, [error, description]);

	return null;
}
