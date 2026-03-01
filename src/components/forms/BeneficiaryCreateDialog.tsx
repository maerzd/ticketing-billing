"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createSepaBeneficiary } from "@/actions/beneficiaries";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface FormState {
	name: string;
	iban: string;
	bic: string;
	email: string;
	activityTag: string;
}

interface BeneficiaryCreateDialogProps {
	triggerLabel?: string;
	triggerVariant?: "default" | "outline" | "secondary" | "ghost" | "link";
	triggerClassName?: string;
	onCreated?: () => void;
}

const normalizeOptional = (value: string) => {
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
};

export function BeneficiaryCreateDialog({
	triggerLabel = "Begünstigten anlegen",
	triggerVariant = "default",
	triggerClassName,
	onCreated,
}: Readonly<BeneficiaryCreateDialogProps>) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [open, setOpen] = useState(false);
	const [formState, setFormState] = useState<FormState>({
		name: "",
		iban: "",
		bic: "",
		email: "",
		activityTag: "",
	});

	const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!formState.name.trim() || !formState.iban.trim()) {
			toast.error("Name und IBAN sind erforderlich");
			return;
		}

		startTransition(async () => {
			const result = await createSepaBeneficiary({
				name: formState.name.trim(),
				iban: formState.iban.trim(),
				bic: normalizeOptional(formState.bic),
				email: normalizeOptional(formState.email),
				activity_tag: normalizeOptional(formState.activityTag),
			});

			if (result.success) {
				toast.success("Begünstigter wurde angelegt");
				setFormState({
					name: "",
					iban: "",
					bic: "",
					email: "",
					activityTag: "",
				});
				setOpen(false);
				onCreated?.();
				router.refresh();
			} else {
				toast.error(result.error ?? "Anlegen fehlgeschlagen");
			}
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button variant={triggerVariant} className={triggerClassName}>
					{triggerLabel}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-2xl">
				<DialogHeader>
					<DialogTitle>Neuen Begünstigten hinzufügen</DialogTitle>
					<DialogDescription>
						Begünstigte für SEPA-Überweisungen anlegen
					</DialogDescription>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleCreate}>
					<div className="space-y-2">
						<Label htmlFor="beneficiary-name">Name</Label>
						<Input
							id="beneficiary-name"
							value={formState.name}
							onChange={(event) =>
								setFormState((prev) => ({
									...prev,
									name: event.target.value,
								}))
							}
							placeholder="Muster GmbH"
							required
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="beneficiary-iban">IBAN</Label>
						<Input
							id="beneficiary-iban"
							value={formState.iban}
							onChange={(event) =>
								setFormState((prev) => ({
									...prev,
									iban: event.target.value,
								}))
							}
							placeholder="DE00 0000 0000 0000 0000 00"
							required
						/>
					</div>
					<div className="grid gap-4 md:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="beneficiary-bic">BIC</Label>
							<Input
								id="beneficiary-bic"
								value={formState.bic}
								onChange={(event) =>
									setFormState((prev) => ({
										...prev,
										bic: event.target.value,
									}))
								}
								placeholder="DEUTDEFF"
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="beneficiary-email">Email</Label>
							<Input
								id="beneficiary-email"
								type="email"
								value={formState.email}
								onChange={(event) =>
									setFormState((prev) => ({
										...prev,
										email: event.target.value,
									}))
								}
								placeholder="billing@example.com"
							/>
						</div>
					</div>
					<div className="space-y-2">
						<Label htmlFor="beneficiary-activity">Tag</Label>
						<Input
							id="beneficiary-activity"
							value={formState.activityTag}
							onChange={(event) =>
								setFormState((prev) => ({
									...prev,
									activityTag: event.target.value,
								}))
							}
							placeholder="Lieferant, Freelancer, Kunde"
						/>
					</div>
					<Button type="submit" className="w-full" disabled={isPending}>
						Begünstigten anlegen
					</Button>
				</form>
			</DialogContent>
		</Dialog>
	);
}
