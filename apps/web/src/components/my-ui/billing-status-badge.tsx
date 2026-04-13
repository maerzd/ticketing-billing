import type { BillingStatus } from "@ticketing-billing/types/ddb";
import { cn } from "@/lib/utils";

interface BillingStatusBadgeProps {
	status: BillingStatus | "UNBILLED";
	className?: string;
}

const statusConfig: Record<
	BillingStatus | "UNBILLED",
	{ label: string; className: string }
> = {
	UNBILLED: {
		label: "Nicht abgerechnet",
		className: "bg-slate-100 text-slate-600 border-slate-200",
	},
	PENDING: {
		label: "Ausstehend",
		className: "bg-slate-100 text-slate-700 border-slate-200",
	},
	IN_PROGRESS: {
		label: "In Bearbeitung",
		className: "bg-amber-100 text-amber-700 border-amber-200",
	},
	COMPLETED: {
		label: "Abgeschlossen",
		className: "bg-green-100 text-green-700 border-green-200",
	},
	ATTENTION_NEEDED: {
		label: "Achtung",
		className: "bg-red-100 text-red-700 border-red-200",
	},
};

export function BillingStatusBadge({
	status,
	className,
}: Readonly<BillingStatusBadgeProps>) {
	const config = statusConfig[status];

	return (
		<span
			className={cn(
				"inline-flex rounded-full border px-3 py-1 font-semibold text-xs",
				config.className,
				className,
			)}
		>
			{config.label}
		</span>
	);
}
