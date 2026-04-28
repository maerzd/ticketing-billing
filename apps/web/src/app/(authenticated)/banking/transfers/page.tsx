import { sepaTransfers } from "@qonto/embed-sdk/server/sepa-transfers";
import { Plus } from "lucide-react";
import Link from "next/link";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { getAccessToken, isAuthenticated } from "@/lib/auth";
import { formatCurrency } from "@/lib/utils";

export default async function TransfersPage() {
	const authenticated = await isAuthenticated();

	if (!authenticated) {
		return (
			<div className="space-y-8">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Überweisungen</h1>
				</div>
				<QontoConnectCard />
			</div>
		);
	}

	const accessToken = await getAccessToken();
	const { transfers } = await sepaTransfers.getSepaTransfers({
		operationSettings: { accessToken },
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Überweisungen</h1>
					<p className="mt-2 text-slate-600">
						SEPA-Überweisungen an Begünstigte
					</p>
				</div>
				<Button
					render={<Link href="/banking/transfers/create" />}
					className="gap-2"
				>
					<Plus className="h-4 w-4" />
					Neue Überweisung
				</Button>
			</div>

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Empfänger-ID</TableHead>
							<TableHead>Referenz</TableHead>
							<TableHead>Datum</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Betrag</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{transfers.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									className="text-center text-muted-foreground"
								>
									Keine Überweisungen vorhanden
								</TableCell>
							</TableRow>
						)}
						{transfers.map((t) => (
							<TableRow key={t.id}>
								<TableCell className="font-mono text-xs text-muted-foreground">
									{t.beneficiaryId}
								</TableCell>
								<TableCell>{t.reference}</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{new Date(t.createdAt).toLocaleDateString("de-DE")}
								</TableCell>
								<TableCell>
									<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
										{t.status}
									</span>
								</TableCell>
								<TableCell className="text-right font-mono">
									{formatCurrency(t.amount, t.amountCurrency)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
