"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ClientCreateDialog } from "@/components/forms/ClientCreateDialog";
import { ClientDetailDialog } from "@/components/forms/ClientDetailDialog";
import { Button } from "@/components/ui/button";
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
import type { Client, ListClientsResponse } from "@/types/qonto/clients";

interface ClientsManagerProps {
	clients: Client[];
	meta: ListClientsResponse["meta"];
}

const getClientLabel = (client: Client) => {
	if (client.kind === "company") {
		return client.name ?? "-";
	}

	const fullName =
		`${client.first_name ?? ""} ${client.last_name ?? ""}`.trim();
	return fullName || "-";
};

const getKindLabel = (kind: Client["kind"]) => {
	switch (kind) {
		case "company":
			return "Company";
		case "freelancer":
			return "Freelancer";
		default:
			return "Individual";
	}
};

const formatUpdatedAt = (value?: string | null) => {
	if (!value) return "-";
	return new Date(value).toLocaleDateString("en-GB", {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

export function ClientsManager({
	clients,
	meta,
}: Readonly<ClientsManagerProps>) {
	const router = useRouter();
	const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

	const selectedClient = useMemo(
		() => clients.find((client) => client.id === selectedClientId) ?? null,
		[clients, selectedClientId],
	);

	const previousPage = meta.prev_page ?? meta.previous_page ?? null;
	const nextPage = meta.next_page ?? null;

	const navigateToPage = (page: number) => {
		router.push(`/banking/clients?page=${page}`);
	};

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<div>
							<CardTitle>Kundenliste</CardTitle>
							<CardDescription>
								Insgesamt {meta.total_count} Kunden
							</CardDescription>
						</div>
						<ClientCreateDialog />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					{clients.length === 0 ? (
						<p className="text-center text-slate-500">Keine Kunden vorhanden</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Name</TableHead>
									<TableHead>Updated</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{clients.map((client) => (
									<TableRow
										key={client.id}
										onClick={() => setSelectedClientId(client.id)}
										className="cursor-pointer transition-colors hover:bg-muted/50"
									>
										<TableCell className="font-medium">
											{getClientLabel(client)}
										</TableCell>
										<TableCell>{formatUpdatedAt(client.updated_at)}</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}

					<div className="flex items-center justify-end gap-2 border-t pt-4">
						<Button
							variant="outline"
							onClick={() => previousPage && navigateToPage(previousPage)}
							disabled={!previousPage}
						>
							Vorherige
						</Button>
						<Button
							variant="outline"
							onClick={() => nextPage && navigateToPage(nextPage)}
							disabled={!nextPage}
						>
							Nächste
						</Button>
					</div>
				</CardContent>
			</Card>

			<ClientDetailDialog
				open={selectedClient !== null}
				onOpenChange={(open) => {
					if (!open) {
						setSelectedClientId(null);
					}
				}}
				client={selectedClient}
				onSaved={(updatedClient) => {
					setSelectedClientId(updatedClient.id);
				}}
			/>
		</>
	);
}
