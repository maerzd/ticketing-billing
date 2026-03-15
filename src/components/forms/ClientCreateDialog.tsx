"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { checkClientDuplicates, createClient } from "@/actions/clients";
import {
	ClientForm,
	type ClientFormValues,
	defaultClientFormValues,
	formValuesToCreateInput,
} from "@/components/forms/ClientForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

interface ClientCreateDialogProps {
	onCreated?: () => void;
}

const getClientName = (values: ClientFormValues) => {
	if (values.kind === "company") {
		return values.name.trim() || "Unknown client";
	}

	return `${values.first_name} ${values.last_name}`.trim() || "Unknown client";
};

export function ClientCreateDialog({
	onCreated,
}: Readonly<ClientCreateDialogProps>) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [values, setValues] = useState<ClientFormValues>(
		defaultClientFormValues,
	);

	const handleSubmit = () => {
		if (values.kind === "company" && !values.name.trim()) {
			toast.error("Company clients require a company name");
			return;
		}

		if (
			(values.kind === "individual" || values.kind === "freelancer") &&
			(!values.first_name.trim() || !values.last_name.trim())
		) {
			toast.error(
				"First and last name are required for individuals and freelancers",
			);
			return;
		}

		startTransition(async () => {
			const payload = formValuesToCreateInput(values);
			const duplicateResult = await checkClientDuplicates({
				name: getClientName(values),
				email: payload.email,
				vat_number: payload.vat_number,
				tax_identification_number: payload.tax_identification_number,
			});

			if (!duplicateResult.success) {
				toast.error(duplicateResult.error ?? "Duplicate check failed");
				return;
			}

			if (duplicateResult.data.blocking.length > 0) {
				toast.error(
					"A client with matching email, VAT or tax id already exists",
				);
				return;
			}

			if (duplicateResult.data.warnings.length > 0) {
				const shouldContinue = window.confirm(
					"Potential duplicate by name found. Create this client anyway?",
				);
				if (!shouldContinue) {
					return;
				}
			}

			const result = await createClient(payload);
			if (!result.success) {
				toast.error(result.error ?? "Failed to create client");
				return;
			}

			toast.success("Client created");
			setValues(defaultClientFormValues);
			setOpen(false);
			onCreated?.();
			router.refresh();
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button className="gap-2" />}>
				Kunden erstellen
			</DialogTrigger>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Kunden erstellen</DialogTitle>
					<DialogDescription>
						Lege einen neuen Kunden in Qonto an.
					</DialogDescription>
				</DialogHeader>
				<ClientForm values={values} onChange={setValues} disabled={isPending} />
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Abbrechen
					</Button>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending ? "Wird erstellt..." : "Client erstellen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
