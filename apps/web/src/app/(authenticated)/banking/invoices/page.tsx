import { InvoiceStatusBadge } from "@/components/my-ui/invoice-status-badge";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
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
import { queryClients, queryInvoices } from "@/lib/qonto/queries";
import { InvoiceCreateDialog } from "./InvoiceCreateDialog";

export default async function InvoicesPage() {
	const result = await queryInvoices();
	const showQontoLogin = !result.success && requiresQontoAuth(result.error);
	const clientsResult = await queryClients();
	const clients = clientsResult.success ? clientsResult.data.clients : [];

	const formatDate = (dateString: string) => {
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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Rechnungen</h1>
					<p className="mt-2 text-slate-600">Ausgehende Rechnungen</p>
				</div>
				{!showQontoLogin && <InvoiceCreateDialog clients={clients} />}
			</div>

			{/* Invoices List */}
			{showQontoLogin && <QontoConnectCard />}

			{!showQontoLogin && result.success && result.data && (
				<Card>
					<CardHeader>
						<CardTitle>Alle Rechnungen</CardTitle>
						<CardDescription>
							Insgesamt {result.data.meta.total_count} Rechnungen
						</CardDescription>
					</CardHeader>
					<CardContent>
						{result.data.meta.total_count === 0 ? (
							<p className="text-center text-slate-500">
								Keine Rechnungen vorhanden
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Rechnungs-#</TableHead>
										<TableHead>Kunde</TableHead>
										<TableHead>Betrag</TableHead>
										<TableHead>Datum</TableHead>
										<TableHead>Status</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{result.data.client_invoices.map((invoice) => (
										<TableRow key={invoice.id}>
											<TableCell className="font-mono text-sm">
												{invoice.number}
											</TableCell>
											<TableCell>{invoice.client.name}</TableCell>
											<TableCell className="font-mono">
												{formatCurrency(invoice.total_amount_cents)}
											</TableCell>
											<TableCell>{formatDate(invoice.issue_date)}</TableCell>
											<TableCell>
												<InvoiceStatusBadge status={invoice.status} />
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
