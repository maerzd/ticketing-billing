"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { toast } from "sonner";
import { createOrganizer } from "@/actions/organizers";
import {
	defaultOrganizerFormValues,
	OrganizerForm,
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
	const formId = useId();
	const [open, setOpen] = useState(false);
	const [isPending, startTransition] = useTransition();
	const [initialValues, setInitialValues] = useState(
		defaultOrganizerFormValues(),
	);

	const handleSubmit = (values: Parameters<typeof createOrganizer>[0]) => {
		startTransition(async () => {
			const result = await createOrganizer(values);
			if (!result.success) {
				toast.error(result.error ?? "Failed to create organizer");
				return;
			}

			toast.success("Organizer created");
			setInitialValues(defaultOrganizerFormValues());
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
					formId={formId}
					initialValues={initialValues}
					onSubmit={handleSubmit}
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
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending ? "Wird erstellt..." : "Organizer erstellen"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
