"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { TableRow } from "@/components/ui/table";

interface ClickableTableRowProps {
	readonly href: string;
	readonly children: ReactNode;
	readonly className?: string;
}

export function ClickableTableRow({
	href,
	children,
	className,
}: ClickableTableRowProps) {
	const router = useRouter();

	const handleClick = () => {
		router.push(href);
	};

	return (
		<TableRow
			onClick={handleClick}
			className={`cursor-pointer transition-colors hover:bg-muted/50 ${className || ""}`}
		>
			{children}
		</TableRow>
	);
}
