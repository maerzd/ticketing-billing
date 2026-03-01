"use client";
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
import type { QontoSepaBeneficiary } from "@/types/beneficiaries";

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
		case "pending":
		default:
			return "bg-amber-50 text-amber-800";
	}
};

export function BeneficiariesManager({
	beneficiaries,
	totalCount,
}: Readonly<BeneficiariesManagerProps>) {
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
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</CardContent>
		</Card>
	);
}
