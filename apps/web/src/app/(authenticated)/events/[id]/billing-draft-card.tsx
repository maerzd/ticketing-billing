"use client";
import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function BillingDraftCard({
	organizer,
	organizerId,
	billingRecord,
	isLoading,
	onCreateDraft,
	onUpdateDraft,
	onFinalizeInvoice,
}: {
	organizer: OrganizerRecord | null;
	organizerId: string | undefined;
	billingRecord: BillingRecord | undefined;
	isLoading: boolean;
	onCreateDraft: () => void;
	onUpdateDraft: () => void;
	onFinalizeInvoice: () => void;
}) {
	const hasDraft = !!billingRecord;
	const primaryContact = organizer?.contactPersons?.[0];

	return (
		<div className="space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
			<h3 className="font-semibold">
				{hasDraft ? "Entwurf bearbeiten" : "Entwurf in Sevdesk erstellen"}
			</h3>
			{organizer === null || !organizerId ? (
				<p className="text-muted-foreground text-sm">
					{!organizerId ? (
						"Kein Veranstalter für diese Veranstaltung konfiguriert."
					) : (
						<>
							Kein Veranstalter gefunden.{" "}
							<Link href="/organizers" className="underline">
								Veranstalter anlegen
							</Link>
						</>
					)}
				</p>
			) : (
				<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
					<div className="w-full sm:max-w-sm">
						<p className="font-medium text-sm">
							{organizer.name ??
								[primaryContact?.firstName, primaryContact?.lastName]
									.filter(Boolean)
									.join(" ")}
						</p>
						<p className="text-muted-foreground text-sm">
							{primaryContact?.email ?? organizer.email}
						</p>
					</div>
					<div className="flex gap-2">
						{hasDraft ? (
							<>
								<Button
									onClick={onUpdateDraft}
									disabled={isLoading}
									variant="outline"
								>
									{isLoading ? "Wird aktualisiert..." : "Aktualisieren"}
								</Button>
								<Button onClick={onFinalizeInvoice} disabled={isLoading}>
									{isLoading ? "Wird finalisiert..." : "Rechnung finalisieren"}
								</Button>
							</>
						) : (
							<Button onClick={onCreateDraft} disabled={isLoading}>
								{isLoading ? "Entwurf wird erstellt..." : "Entwurf erstellen"}
							</Button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
