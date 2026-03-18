"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { createOrganizer } from "@/actions/organizers";
import {
	defaultOrganizerFormValues,
	formValuesToCreateInput,
	OrganizerForm,
	type OrganizerFormValues,
} from "@/components/forms/OrganizerForm";
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

interface OrganizerCreateDialogProps {
	onCreated?: () => void;
}

export function OrganizerCreateDialog({
	onCreated,
}: Readonly<OrganizerCreateDialogProps>) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [values, setValues] = useState<OrganizerFormValues>(
		defaultOrganizerFormValues(),
	);

	const handleSubmit = () => {
		if (!values.organizerid.trim().startsWith("org-")) {
			toast.error("Organizer ID must start with 'org-'");
			return;
		}

		startTransition(async () => {
			const result = await createOrganizer(formValuesToCreateInput(values));
			if (!result.success) {
				toast.error(result.error ?? "Failed to create organizer");
				return;
			}

			toast.success("Organizer created");
			setValues(defaultOrganizerFormValues());
			setOpen(false);
			onCreated?.();
			router.refresh();
		});
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger render={<Button className="gap-2" />}>
				Organizer erstellen
			</DialogTrigger>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>Organizer erstellen</DialogTitle>
					<DialogDescription>
						Lege einen neuen Organizer in DynamoDB an.
					</DialogDescription>
				</DialogHeader>
				<OrganizerForm
					values={values}
					onChange={setValues}
					disabled={isPending}
				/>
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => setOpen(false)}
						disabled={isPending}
					>
						Abbrechen
					</Button>
					<Button onClick={handleSubmit} disabled={isPending}>
						{isPending ? "Wird erstellt..." : "Organizer erstellen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
