"use client";

import { useState } from "react";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import type { Client } from "@/types/qonto/clients";

interface InvoiceCreateDialogProps {
	clients: Client[];
}

export function InvoiceCreateDialog({
	clients,
}: Readonly<InvoiceCreateDialogProps>) {
	const [open, setOpen] = useState(false);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button className="gap-2" />}>
				Rechnung erstellen
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Rechnung erstellen</DialogTitle>
					<DialogDescription>
						Erstellen Sie eine neue Kundenrechnung in Qonto
					</DialogDescription>
				</DialogHeader>
				<InvoiceForm
					clients={clients}
					onCancel={() => setOpen(false)}
					onSuccess={() => setOpen(false)}
				/>
			</DialogContent>
		</Dialog>
	);
}
