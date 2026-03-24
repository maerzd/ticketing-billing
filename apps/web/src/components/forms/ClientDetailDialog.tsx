"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateClient } from "@/actions/clients";
import {
	ClientForm,
	type ClientFormValues,
	clientToFormValues,
	formValuesToUpdateInput,
} from "@/components/forms/ClientForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { Client } from "@/types/qonto/clients";

interface ClientDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	client: Client | null;
	onSaved?: (client: Client) => void;
}

const getClientDisplayName = (client: Client) => {
	if (client.kind === "company") {
		return client.name ?? "Company client";
	}

	return (
		`${client.first_name ?? ""} ${client.last_name ?? ""}`.trim() ||
		"Individual client"
	);
};

export function ClientDetailDialog({
	open,
	onOpenChange,
	client,
	onSaved,
}: Readonly<ClientDetailDialogProps>) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [isEditing, setIsEditing] = useState(false);
	const [values, setValues] = useState<ClientFormValues | null>(null);

	useEffect(() => {
		if (client) {
			setValues(clientToFormValues(client));
			setIsEditing(false);
		}
	}, [client]);

	const handleClose = () => {
		onOpenChange(false);
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		if (client) {
			setValues(clientToFormValues(client));
		}
		setIsEditing(false);
	};

	const handleSave = () => {
		if (!client || !values) return;

		startTransition(async () => {
			const result = await updateClient(
				client.id,
				formValuesToUpdateInput(values),
			);
			if (!result.success) {
				toast.error(result.error ?? "Update fehlgeschlagen");
				return;
			}

			toast.success("Kunden aktualisiert");
			onSaved?.(result.data);
			setIsEditing(false);
			router.refresh();
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>
						{client ? getClientDisplayName(client) : "Client details"}
					</DialogTitle>
					<DialogDescription>Kunden anzeigen und bearbeiten</DialogDescription>
				</DialogHeader>
				{values && (
					<ClientForm
						values={values}
						onChange={setValues}
						disabled={!isEditing || isPending}
						hideKind
					/>
				)}
				<DialogFooter>
					{!isEditing ? (
						<>
							<Button variant="outline" onClick={handleClose}>
								Schliessen
							</Button>
							<Button onClick={() => setIsEditing(true)}>Bearbeiten</Button>
						</>
					) : (
						<>
							<Button
								variant="outline"
								onClick={handleCancelEdit}
								disabled={isPending}
							>
								Verwerfen
							</Button>
							<Button onClick={handleSave} disabled={isPending}>
								{isPending ? "Speichern..." : "Speichern"}
							</Button>
						</>
					)}
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
