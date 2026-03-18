"use client";

import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react";

interface BreadcrumbContextType {
	eventName?: string;
	setEventName: (name: string | undefined) => void;
}

const BreadcrumbContext = createContext<BreadcrumbContextType | undefined>(
	undefined,
);

export function BreadcrumbProvider({
	children,
}: Readonly<{ children: ReactNode }>) {
	const [eventName, setEventName] = useState<string | undefined>();

	const value = useMemo(() => ({ eventName, setEventName }), [eventName]);

	return (
		<BreadcrumbContext.Provider value={value}>
			{children}
		</BreadcrumbContext.Provider>
	);
}

export function useBreadcrumb() {
	const context = useContext(BreadcrumbContext);
	if (!context) {
		throw new Error("useBreadcrumb must be used within BreadcrumbProvider");
	}
	return context;
}

/**
 * Component to set breadcrumb data from server components via client component
 */
export function BreadcrumbSetter({
	eventName,
}: Readonly<{ eventName?: string }>) {
	const { setEventName } = useBreadcrumb();

	useEffect(() => {
		setEventName(eventName);
		return () => setEventName(undefined);
	}, [eventName, setEventName]);

	return null;
}
