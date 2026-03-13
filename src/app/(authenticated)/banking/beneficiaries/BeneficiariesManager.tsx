"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
	trustSepaBeneficiaries,
	untrustSepaBeneficiaries,
} from "@/actions/beneficiaries";
import { BeneficiaryCreateDialog } from "@/components/forms/BeneficiaryCreateDialog";
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
import type { QontoSepaBeneficiary } from "@/types/qonto/beneficiaries";

interface BeneficiariesManagerProps {
	beneficiaries: QontoSepaBeneficiary[];
	totalCount: number;
}

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

export function BeneficiariesManager({
	beneficiaries,
	totalCount,
}: Readonly<BeneficiariesManagerProps>) {
	const router = useRouter();
	const [isPending, startTransition] = useTransition();
	const [actionId, setActionId] = useState<string | null>(null);

	const handleTrustToggle = (beneficiary: QontoSepaBeneficiary) => {
		setActionId(beneficiary.id);
		startTransition(async () => {
			const action = beneficiary.trusted
				? untrustSepaBeneficiaries
				: trustSepaBeneficiaries;
			const result = await action([beneficiary.id]);

			if (result.success) {
				toast.success(
					beneficiary.trusted
						? "Begünstigter wurde entzogen"
						: "Begünstigter wurde vertraut",
				);
				router.refresh();
			} else {
				toast.error(result.error ?? "Aktualisierung fehlgeschlagen");
			}

			setActionId(null);
		});
	};

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle>Begünstigte</CardTitle>
						<CardDescription>
							Insgesamt {totalCount} Begünstigte
						</CardDescription>
					</div>
					<BeneficiaryCreateDialog />
				</div>
			</CardHeader>
			<CardContent>
				{beneficiaries.length === 0 ? (
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
							{beneficiaries.map((beneficiary) => (
								<TableRow key={beneficiary.id}>
									<TableCell className="font-medium">
										{beneficiary.name}
									</TableCell>
									<TableCell className="font-mono text-slate-600 text-xs">
										{beneficiary.iban ?? "-"}
									</TableCell>
									<TableCell>
										<span
											className={`rounded-full px-2 py-1 text-xs ${getStatusClassName(
												beneficiary.status,
											)}`}
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
											disabled={isPending && actionId === beneficiary.id}
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
