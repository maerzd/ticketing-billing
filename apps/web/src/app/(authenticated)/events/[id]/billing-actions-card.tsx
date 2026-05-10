"use client";
import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import { AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";

export function BillingActionsCard({
	billingRecord,
	organizer,
	isLoading,
	onSendEmail,
	onPayoutClick,
}: {
	billingRecord: BillingRecord;
	organizer: OrganizerRecord | null;
	isLoading: boolean;
	onSendEmail: () => void;
	onPayoutClick: () => void;
}) {
	const { invoiceStatus, payoutStatus } = billingRecord;

	return (
		<div className="space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
			<h3 className="font-semibold">Abrechnung</h3>
			<div className="flex flex-wrap gap-3">
				{invoiceStatus !== "VOID" && (
					<div className="flex flex-col gap-1">
						<Button
							onClick={onSendEmail}
							disabled={isLoading || invoiceStatus === "SENT"}
							variant={invoiceStatus === "SENT" ? "outline" : "default"}
						>
							{invoiceStatus === "SENT" ? (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
									E-Mail gesendet
								</>
							) : isLoading ? (
								"Wird gesendet..."
							) : (
								"Rechnung per E-Mail senden"
							)}
						</Button>
						{billingRecord.emailSentAt && (
							<p className="text-muted-foreground text-xs">
								{new Date(billingRecord.emailSentAt).toLocaleString("de-DE")}
							</p>
						)}
					</div>
				)}

				{payoutStatus === "PENDING" && organizer && (
					<Button
						onClick={onPayoutClick}
						disabled={isLoading}
						variant="outline"
					>
						Auszahlung auslösen (
						{formatCurrency(billingRecord.payoutAmountCents / 100)})
					</Button>
				)}

				{payoutStatus === "INITIATED" && (
					<div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-700 text-sm">
						<Clock className="h-4 w-4" />
						Auszahlung in Bearbeitung
						{billingRecord.payoutInitiatedAt && (
							<span className="text-xs">
								(
								{new Date(billingRecord.payoutInitiatedAt).toLocaleString(
									"de-DE",
								)}
								)
							</span>
						)}
					</div>
				)}

				{payoutStatus === "COMPLETED" && (
					<div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-green-700 text-sm">
						<CheckCircle2 className="h-4 w-4" />
						Auszahlung abgeschlossen
						{billingRecord.payoutCompletedAt && (
							<span className="text-xs">
								(
								{new Date(billingRecord.payoutCompletedAt).toLocaleString(
									"de-DE",
								)}
								)
							</span>
						)}
					</div>
				)}

				{payoutStatus === "FAILED" && (
					<div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-700 text-sm">
						<AlertCircle className="h-4 w-4" />
						Auszahlung fehlgeschlagen
					</div>
				)}
			</div>
		</div>
	);
}
