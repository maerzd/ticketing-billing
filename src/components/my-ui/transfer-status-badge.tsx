import { cn } from "@/lib/utils";
import type { QontoTransferStatus } from "@/types/sepa-transfers";

interface TransferStatusBadgeProps {
	status: QontoTransferStatus;
	className?: string;
}

const statusMap: Record<
	QontoTransferStatus,
	{ label: string; className: string }
> = {
	pending: {
		label: "Pending",
		className: "bg-yellow-100 text-yellow-700",
	},
	processing: {
		label: "In Bearbeitung",
		className: "bg-blue-100 text-blue-700",
	},
	settled: {
		label: "Abgeschlossen",
		className: "bg-green-100 text-green-700",
	},
	declined: {
		label: "Abgelehnt",
		className: "bg-red-100 text-red-700",
	},
	canceled: {
		label: "Abgebrochen",
		className: "bg-red-100 text-red-700",
	},
};

export function TransferStatusBadge({
	status,
	className,
}: Readonly<TransferStatusBadgeProps>) {
	const entry = statusMap[status] || {
		label: status,
		className: "bg-slate-100 text-slate-700",
	};

	return (
		<span
			className={cn(
				"inline-flex rounded-full px-3 py-1 font-semibold text-xs",
				entry.className,
				className,
			)}
		>
			{entry.label}
		</span>
	);
}
