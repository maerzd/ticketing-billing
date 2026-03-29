"use client";

import type { OrganizerRecord } from "@ticketing-billing/types/ddb";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrganizer } from "@/actions/organizers";
import {
	OrganizerForm,
	organizerToFormValues,
} from "@/components/forms/OrganizerForm";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface OrganizerDetailDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	organizer: OrganizerRecord | null;
	onSaved?: (organizer: OrganizerRecord) => void;
}

export function OrganizerDetailDialog({
	open,
	onOpenChange,
	organizer,
	onSaved,
}: Readonly<OrganizerDetailDialogProps>) {
	const router = useRouter();
	const formId = useId();
	const [isPending, startTransition] = useTransition();
	const [initialValues, setInitialValues] = useState(
		organizer ? organizerToFormValues(organizer) : null,
	);

	useEffect(() => {
		if (organizer) {
			setInitialValues(organizerToFormValues(organizer));
		}
	}, [organizer]);

	const handleClose = () => {
		onOpenChange(false);
	};

	const handleSave = (values: Parameters<typeof updateOrganizer>[0]) => {
		if (!organizer) return;
		startTransition(async () => {
			const result = await updateOrganizer(values);
			if (!result.success) {
				toast.error(result.error ?? "Update fehlgeschlagen");
				return;
			}

			toast.success("Veranstalter aktualisiert");
			onSaved?.(result.data);
			router.refresh();
		});
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-4xl">
				<DialogHeader>
					<DialogTitle>
						{organizer ? organizer.name : "Veranstalter details"}
					</DialogTitle>
					<DialogDescription>
						Veranstalter anzeigen und bearbeiten
					</DialogDescription>
				</DialogHeader>
				{initialValues && (
					<OrganizerForm
						formId={formId}
						initialValues={initialValues}
						onSubmit={handleSave}
						disabled={isPending}
						hideOrganizerId
					/>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={handleClose} disabled={isPending}>
						Abbrechen
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending ? "Speichern..." : "Speichern"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
