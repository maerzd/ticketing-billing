"use client";

import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import type { BankAccount } from "@qonto/embed-sdk/types";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	fetchQontoBankAccounts,
	initiateBillingPayout,
} from "@/actions/billing";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { formatCurrency } from "@/lib/utils";

interface BillingPayoutDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	billingRecord: BillingRecord;
	organizer: OrganizerRecord;
	onSuccess: (updated: BillingRecord) => void;
}

export function BillingPayoutDialog({
	open,
	onOpenChange,
	billingRecord,
	organizer,
	onSuccess,
}: BillingPayoutDialogProps) {
	const [isInitiating, setIsInitiating] = useState(false);
	const [bankAccountId, setBankAccountId] = useState<string | null>(null);

	useEffect(() => {
		if (!open) return;

		fetchQontoBankAccounts().then((result) => {
			if (result.success) {
				const main =
					(result.data as BankAccount[]).find((a) => a.main) ?? result.data[0];
				if (main) {
					setBankAccountId(
						(main as BankAccount).slug ?? (main as BankAccount).id ?? null,
					);
				}
			}
		});
	}, [open]);

	const handleInitiatePayout = async () => {
		if (!bankAccountId) {
			toast.error("Kein Bankkonto verfügbar.");
			return;
		}

		if (!organizer.iban || !organizer.sepaBeneficiaryName) {
			toast.error(
				"Veranstalter hat keine IBAN oder keinen Begünstigten-Namen hinterlegt.",
			);
			return;
		}

		if (!organizer.qontoBeneficiaryId) {
			toast.error("Veranstalter hat keine Qonto-Begünstigten-ID hinterlegt.");
			return;
		}

		setIsInitiating(true);
		const result = await initiateBillingPayout({
			organizerId: billingRecord.organizerId,
			eventId: billingRecord.eventId,
			beneficiaryId: organizer.qontoBeneficiaryId,
			iban: organizer.iban,
			beneficiaryName: organizer.sepaBeneficiaryName,
			bankAccountId,
		});

		setIsInitiating(false);

		if (!result.success) {
			toast.error(`Auszahlung fehlgeschlagen: ${result.error}`);
			return;
		}

		toast.success("Auszahlung erfolgreich ausgelöst.");
		onSuccess(result.data);
		onOpenChange(false);
	};

	const payoutAmount = billingRecord.payoutAmountCents / 100;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Auszahlung auslösen</DialogTitle>
					<DialogDescription>
						{billingRecord.eventName} – {organizer.name}
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-3 py-2">
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Betrag</span>
						<span className="font-semibold">
							{formatCurrency(payoutAmount)}
						</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">IBAN</span>
						<span className="font-mono text-xs">{organizer.iban ?? "—"}</span>
					</div>
					<div className="flex justify-between text-sm">
						<span className="text-muted-foreground">Empfänger</span>
						<span>
							{organizer.sepaBeneficiaryName ?? organizer.name ?? "—"}
						</span>
					</div>
				</div>

				<DialogFooter className="flex gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Abbrechen
					</Button>
					<Button
						onClick={handleInitiatePayout}
						disabled={isInitiating || !bankAccountId}
					>
						{isInitiating
							? "Wird überwiesen..."
							: `${formatCurrency(payoutAmount)} überweisen`}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
