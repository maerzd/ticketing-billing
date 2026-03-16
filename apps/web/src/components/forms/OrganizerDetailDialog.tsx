"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { updateOrganizer } from "@/actions/organizers";
import {
	formValuesToUpdateInput,
	OrganizerForm,
	type OrganizerFormValues,
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
import type { OrganizerRecord } from "@/types/organizers";

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
	const [isPending, startTransition] = useTransition();
	const [isEditing, setIsEditing] = useState(false);
	const [values, setValues] = useState<OrganizerFormValues | null>(null);

	useEffect(() => {
		if (organizer) {
			setValues(organizerToFormValues(organizer));
			setIsEditing(false);
		}
	}, [organizer]);

	const handleClose = () => {
		onOpenChange(false);
		setIsEditing(false);
	};

	const handleCancelEdit = () => {
		if (organizer) {
			setValues(organizerToFormValues(organizer));
		}
		setIsEditing(false);
	};

	const handleSave = () => {
		if (!values || !organizer) return;

		if (!values.organizerid.trim().startsWith("org-")) {
			toast.error("Veranstalter ID must start with 'org-'");
			return;
		}

		startTransition(async () => {
			const result = await updateOrganizer(formValuesToUpdateInput(values));
			if (!result.success) {
				toast.error(result.error ?? "Update fehlgeschlagen");
				return;
			}

			toast.success("Veranstalter aktualisiert");
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
						{organizer ? organizer.name : "Veranstalter details"}
					</DialogTitle>
					<DialogDescription>
						Veranstalter anzeigen und bearbeiten
					</DialogDescription>
				</DialogHeader>
				{values && (
					<OrganizerForm
						values={values}
						onChange={setValues}
						disabled={!isEditing || isPending}
						hideOrganizerId
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
