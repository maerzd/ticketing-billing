import { cn } from "@/lib/utils";

interface InvoiceStatusBadgeProps {
	status: "draft" | "unpaid" | "paid" | "canceled";
	className?: string;
}

const statusConfig = {
	draft: {
		label: "Draft",
		className: "bg-slate-100 text-slate-700 border-slate-200",
	},
	unpaid: {
		label: "Unpaid",
		className: "bg-amber-100 text-amber-700 border-amber-200",
	},
	paid: {
		label: "Paid",
		className: "bg-green-100 text-green-700 border-green-200",
	},
	canceled: {
		label: "Canceled",
		className: "bg-red-100 text-red-700 border-red-200",
	},
};

export function InvoiceStatusBadge({
	status,
	className,
}: Readonly<InvoiceStatusBadgeProps>) {
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
