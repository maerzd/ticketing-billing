import { organizations } from "@qonto/embed-sdk/server/organizations";
import { transactions } from "@qonto/embed-sdk/server/transactions";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
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

export default async function TransactionsPage() {
	const authenticated = await isAuthenticated();

	if (!authenticated) {
		return (
			<div className="space-y-8">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Transaktionen</h1>
				</div>
				<QontoConnectCard />
			</div>
		);
	}

	const accessToken = await getAccessToken();

	// The API requires bankAccountId or iban — use the main bank account
	const bankAccounts = await organizations.getBankAccounts({
		operationSettings: { accessToken },
	});
	const mainAccount = bankAccounts.find((a) => a.main) ?? bankAccounts[0];

	if (!mainAccount) {
		return (
			<div className="space-y-6">
				<h1 className="font-bold text-3xl text-slate-900">Transaktionen</h1>
				<p className="text-muted-foreground">Kein Bankkonto gefunden.</p>
			</div>
		);
	}

	const { transactions: txns } = await transactions.getTransactions({
		transactionSettings: { iban: mainAccount.iban },
		operationSettings: { accessToken },
	});

	return (
		<div className="space-y-6">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Transaktionen</h1>
				<p className="mt-2 text-slate-600">
					Alle Kontotransaktionen im Überblick
				</p>
			</div>

			<div className="rounded-lg border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Bezeichnung</TableHead>
							<TableHead>Datum</TableHead>
							<TableHead>Status</TableHead>
							<TableHead className="text-right">Betrag</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{txns.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={4}
									className="text-center text-muted-foreground"
								>
									Keine Transaktionen vorhanden
								</TableCell>
							</TableRow>
						)}
						{txns.map((txn) => (
							<TableRow key={txn.transactionId}>
								<TableCell className="font-medium">
									<div className="flex items-center gap-2">
										{txn.side === "debit" ? (
											<ArrowUpRight className="h-4 w-4 text-red-500" />
										) : (
											<ArrowDownLeft className="h-4 w-4 text-green-500" />
										)}
										{txn.label}
									</div>
								</TableCell>
								<TableCell className="text-muted-foreground text-sm">
									{txn.settledAt
										? new Date(txn.settledAt).toLocaleDateString("de-DE")
										: new Date(txn.emittedAt).toLocaleDateString("de-DE")}
								</TableCell>
								<TableCell>
									<span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700">
										{txn.status}
									</span>
								</TableCell>
								<TableCell className="text-right font-mono">
									<span
										className={
											txn.side === "debit" ? "text-red-600" : "text-green-600"
										}
									>
										{txn.side === "debit" ? "-" : "+"}
										{formatCurrency(txn.amount, txn.currency)}
									</span>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
