"use client";

import type { Beneficiary } from "@qonto/embed-sdk/beneficiaries";
import { beneficiaries } from "@qonto/embed-sdk/beneficiaries";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
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
import { BeneficiaryCreateDialog } from "@/components/forms/BeneficiaryCreateDialog";

const getStatusLabel = (status: string) => {
	switch (status) {
		case "pending":
			return "Ausstehend";
		case "validated":
			return "Bestätigt";
		case "declined":
			return "Abgelehnt";
		default:
			return status;
	}
};

const getStatusClassName = (status: string) => {
	switch (status) {
		case "validated":
			return "bg-green-50 text-green-800";
		case "declined":
			return "bg-red-50 text-red-800";
		default:
			return "bg-amber-50 text-amber-800";
	}
};

export function BeneficiariesManager() {
	const [items, setItems] = useState<Beneficiary[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [actionId, setActionId] = useState<string | null>(null);

	const load = useCallback(async () => {
		setIsLoading(true);
		try {
			const result = await beneficiaries.getBeneficiaries();
			setItems(result.beneficiaries);
		} catch (error) {
			console.error(error);
			toast.error("Begünstigte konnten nicht geladen werden");
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		load();
	}, [load]);

	const handleTrustToggle = async (beneficiary: Beneficiary) => {
		setActionId(beneficiary.id);
		try {
			if (beneficiary.trusted) {
				await beneficiaries.untrustBeneficiaries({
					beneficiarySettings: { beneficiaryIds: [beneficiary.id] },
				});
				toast.success("Begünstigter wurde entzogen");
			} else {
				await beneficiaries.trustBeneficiaries({
					beneficiarySettings: { beneficiaryIds: [beneficiary.id] },
				});
				toast.success("Begünstigter wurde vertraut");
			}
			await load();
		} catch (error) {
			console.error(error);
			toast.error("Aktualisierung fehlgeschlagen");
		} finally {
			setActionId(null);
		}
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Begünstigte</CardTitle>
						<CardDescription>
							{isLoading
								? "Wird geladen…"
								: `Insgesamt ${items.length} Begünstigte`}
						</CardDescription>
					</div>
					<BeneficiaryCreateDialog onCreated={load} />
				</div>
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<p className="text-center text-slate-500">Wird geladen…</p>
				) : items.length === 0 ? (
					<p className="text-center text-slate-500">
						Keine Begünstigten vorhanden
					</p>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>IBAN</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Vertrauen</TableHead>
								<TableHead className="text-right">Aktion</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{items.map((beneficiary) => (
								<TableRow key={beneficiary.id}>
									<TableCell className="font-medium">
										{beneficiary.name}
									</TableCell>
									<TableCell className="font-mono text-slate-600 text-xs">
										{beneficiary.iban ?? "-"}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(beneficiary.status)}`}
										>
											{getStatusLabel(beneficiary.status)}
										</span>
									</TableCell>
									<TableCell>
										{beneficiary.trusted ? "Vertraut" : "Nicht vertraut"}
									</TableCell>
									<TableCell className="text-right">
										<Button
											variant={beneficiary.trusted ? "outline" : "default"}
											size="sm"
											disabled={actionId === beneficiary.id}
											onClick={() => handleTrustToggle(beneficiary)}
										>
											{beneficiary.trusted ? "Entziehen" : "Vertrauen"}
										</Button>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
