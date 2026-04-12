import { BeneficiaryCreateDialog } from "@/components/forms/BeneficiaryCreateDialog";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { TransferStatusBadge } from "@/components/my-ui/transfer-status-badge";
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
import { requiresQontoAuth } from "@/lib/qonto/auth-state";
import {
	queryBeneficiaries,
	queryOrganization,
	queryTransfers,
} from "@/lib/qonto/queries";
import { TransferCreateDialog } from "./transfer-create-dialog";

export default async function TransfersPage() {
	const result = await queryTransfers();
	const showQontoLogin = !result.success && requiresQontoAuth(result.errorCode);
	const beneficiariesResult = await queryBeneficiaries();
	const beneficiaries = beneficiariesResult.success
		? beneficiariesResult.data.beneficiaries
		: [];
	const organizationResult = await queryOrganization();
	const bankAccounts = organizationResult.success
		? organizationResult.data.organization.bank_accounts
		: [];

	const formatDate = (dateString: string | null) => {
		if (!dateString) return "—";
		return new Date(dateString).toLocaleDateString("en-GB", {
			year: "numeric",
			month: "short",
			day: "numeric",
		});
	};

	const formatCurrency = (centAmount: number) => {
		return (centAmount / 100).toLocaleString("en-GB", {
			style: "currency",
			currency: "EUR",
		});
	};

	return (
		<div className="space-y-8">
			{/* Header */}
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Überweisungen</h1>
				<p className="mt-2 text-slate-600">
					Verwalten Sie SEPA-Überweisungen an Begünstigte
				</p>
			</div>

			{/* Action Buttons */}
			{!showQontoLogin && (
				<div className="flex items-center gap-2">
					<TransferCreateDialog
						beneficiaries={beneficiaries}
						bankAccounts={bankAccounts}
					/>
					<BeneficiaryCreateDialog
						triggerVariant="outline"
						triggerLabel="Begünstigten hinzufügen"
					/>
				</div>
			)}
			{/* Transfers List */}
			{showQontoLogin && <QontoConnectCard />}

			{!showQontoLogin && result.success && result.data && (
				<Card>
					<CardHeader>
						<CardTitle>Alle Überweisungen</CardTitle>
						<CardDescription>
							Insgesamt {result.data.meta.total_count} Überweisungen
						</CardDescription>
					</CardHeader>
					<CardContent>
						{result.data.transfers.length === 0 ? (
							<p className="text-center text-slate-500">
								Keine Überweisungen vorhanden
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Betrag</TableHead>
										<TableHead>Referenz</TableHead>
										<TableHead>Ausgeführungsdatum</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.data.transfers.map((transfer) => (
										<TableRow key={transfer.id}>
											<TableCell className="font-mono font-semibold">
												{formatCurrency(transfer.amount_cents)}
											</TableCell>
											<TableCell className="text-slate-600 text-sm">
												{transfer.reference || "—"}
											</TableCell>
											<TableCell>{formatDate(transfer.completed_at)}</TableCell>
											<TableCell>
												<TransferStatusBadge status={transfer.status} />
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			)}

			{!showQontoLogin && result.success === false && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-900">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-800">{result.error}</p>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
