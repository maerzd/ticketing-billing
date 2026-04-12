"use client";

import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
	fetchQontoBankAccounts,
	initiateBillingPayout,
} from "@/actions/billing";
import { verifyTransferPayee } from "@/actions/transfers";
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

type Step = "idle" | "verifying" | "verified" | "initiating";

export function BillingPayoutDialog({
	open,
	onOpenChange,
	billingRecord,
	organizer,
	onSuccess,
}: BillingPayoutDialogProps) {
	const [step, setStep] = useState<Step>("idle");
	const [vopProofToken, setVopProofToken] = useState<string | null>(null);
	const [bankAccountId, setBankAccountId] = useState<string | null>(null);

	// Fetch the main bank account when dialog opens
	useEffect(() => {
		if (!open) {
			return;
		}

		fetchQontoBankAccounts().then((result) => {
			if (result.success) {
				const main = result.data.find((a) => a.main) ?? result.data[0];
				if (main) {
					setBankAccountId(main.id);
				}
			}
		});
	}, [open]);

	const handleVerify = async () => {
		if (!organizer.iban || !organizer.sepaBeneficiaryName) {
			toast.error(
				"Veranstalter hat keine IBAN oder keinen Begünstigten Namen hinterlegt.",
			);
			return;
		}

		setStep("verifying");
		const result = await verifyTransferPayee(
			organizer.iban,
			organizer.sepaBeneficiaryName,
		);

		if (!result.success || !result.data) {
			toast.error(`Verifikation fehlgeschlagen: ${result.error}`);
			setStep("idle");
			return;
		}

		setVopProofToken(result.data.proof_token.token);
		setStep("verified");
	};

	const handleInitiatePayout = async () => {
		if (!vopProofToken || !bankAccountId) {
			toast.error("Verifikationstoken oder Bankkonto fehlt.");
			return;
		}

		if (!organizer.qontoBeneficiaryId) {
			toast.error("Veranstalter hat keine Qonto-Begünstigten-ID hinterlegt.");
			return;
		}

		setStep("initiating");
		const result = await initiateBillingPayout({
			organizerId: billingRecord.organizerId,
			eventId: billingRecord.eventId,
			beneficiaryId: organizer.qontoBeneficiaryId,
			vopProofToken,
			bankAccountId,
		});

		if (!result.success) {
			toast.error(`Auszahlung fehlgeschlagen: ${result.error}`);
			setStep("verified");
			return;
		}

		toast.success("Auszahlung erfolgreich ausgelöst.");
		onSuccess(result.data);
		onOpenChange(false);
	};

	const payoutAmount = billingRecord.payoutAmountCents / 100;
	const isLoading = step === "verifying" || step === "initiating";

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

					{step === "idle" && (
						<p className="text-muted-foreground text-sm">
							Klicken Sie auf „Verifizieren", um den Begünstigten zu prüfen.
						</p>
					)}

					{step === "verified" && (
						<p className="text-sm text-green-700">
							Begünstigter verifiziert. Jetzt kann die Überweisung gestartet
							werden.
						</p>
					)}
				</div>

				<DialogFooter className="flex gap-2">
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Abbrechen
					</Button>
					{step === "idle" || step === "verifying" ? (
						<Button
							onClick={handleVerify}
							disabled={isLoading || !organizer.iban}
						>
							{step === "verifying" ? "Wird verifiziert..." : "Verifizieren"}
						</Button>
					) : (
						<Button onClick={handleInitiatePayout} disabled={isLoading}>
							{isLoading
								? "Wird überwiesen..."
								: `${formatCurrency(payoutAmount)} überweisen`}
						</Button>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
