"use client";

import type { OrganizerRecord } from "@ticketing-billing/types/ddb";
import { useMemo, useState } from "react";
import { OrganizerCreateDialog } from "@/components/forms/OrganizerCreateDialog";
import { OrganizerDetailDialog } from "@/components/forms/OrganizerDetailDialog";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";

interface OrganizersManagerProps {
	organizers: OrganizerRecord[];
}

const formatUpdatedAt = (value?: string | null) => {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("en-GB", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export function OrganizersManager({
	organizers,
}: Readonly<OrganizersManagerProps>) {
	const [selectedOrganizerId, setSelectedOrganizerId] = useState<string | null>(
		null,
	);

	const selectedOrganizer = useMemo(
		() =>
			organizers.find(
				(organizer) => organizer.organizerId === selectedOrganizerId,
			) ?? null,
		[organizers, selectedOrganizerId],
	);

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<div>
							<CardTitle>Veranstalter Liste</CardTitle>
							<CardDescription>
								Insgesamt {organizers.length} Veranstalter
							</CardDescription>
						</div>
						<OrganizerCreateDialog />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{organizers.length === 0 ? (
						<p className="text-center text-slate-500">
							Keine Veranstalter vorhanden
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Organizer ID</TableHead>
									<TableHead>Name</TableHead>
									<TableHead>Email</TableHead>
									<TableHead>Updated</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{organizers.map((organizer) => (
									<TableRow
										key={organizer.organizerId}
										onClick={() =>
											setSelectedOrganizerId(organizer.organizerId)
										}
										className="cursor-pointer transition-colors hover:bg-muted/50"
									>
										<TableCell className="font-medium">
											{organizer.organizerId}
										</TableCell>
										<TableCell>{organizer.name}</TableCell>
										<TableCell>{organizer.email}</TableCell>
										<TableCell>
											{formatUpdatedAt(organizer.updatedAt)}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			<OrganizerDetailDialog
				open={selectedOrganizer !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedOrganizerId(null);
					}
				}}
				organizer={selectedOrganizer}
				onSaved={(updatedOrganizer) => {
					setSelectedOrganizerId(updatedOrganizer.organizerId);
				}}
			/>
		</>
	);
}
