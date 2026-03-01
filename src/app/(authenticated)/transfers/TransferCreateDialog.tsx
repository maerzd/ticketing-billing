"use client";

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
import type { QontoSepaBeneficiary } from "@/types/beneficiaries";
import type { QontoBankAccount } from "@/types/organization";

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
			<DialogTrigger asChild>
				<Button className="gap-2">Neue Überweisung</Button>
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
