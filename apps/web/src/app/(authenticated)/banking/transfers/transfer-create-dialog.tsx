"use client";

import type { QontoSepaBeneficiary } from "@ticketing-billing/types/qonto/beneficiaries";
import type { QontoBankAccount } from "@ticketing-billing/types/qonto/organization";
import { useState } from "react";
import { TransferForm } from "@/components/forms/TransferForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface TransferCreateDialogProps {
	beneficiaries: QontoSepaBeneficiary[];
	bankAccounts: QontoBankAccount[];
}

export function TransferCreateDialog({
	beneficiaries,
	bankAccounts,
}: Readonly<TransferCreateDialogProps>) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button className="gap-2" />}>
				Neue Überweisung
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Überweisung erstellen</DialogTitle>
					<DialogDescription>
						Neue SEPA-Überweisung an einen Zahlungsempfänger erstellen
					</DialogDescription>
				</DialogHeader>
				<TransferForm
					beneficiaries={beneficiaries}
					bankAccounts={bankAccounts}
					onCancel={() => setOpen(false)}
					onSuccess={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
