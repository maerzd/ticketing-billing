"use client";

import { Copy } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { createInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { SALES_TAX_RATE, TICKET_COMMISSION_RATE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import type { Client } from "@/types/qonto/clients";

interface InvoiceData {
	items: {
		label: string;
		netValue: string;
		tax: string;
		value: string;
	}[];
	totalRevenue: number;
	revenueOrganizer: number;
	netInvoiceAmount: number;
	invoiceAmount: number;
	payoutAmount: number;
	payoutItems: {
		label: string;
		amount: string | null;
		value: number;
	}[];
}

function InvoiceTable({ invoiceData }: { invoiceData: InvoiceData }) {
	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Bezeichnung</TableHead>
					<TableHead className="text-right">Netto</TableHead>
					<TableHead className="text-right">Mwst</TableHead>
					<TableHead className="text-right">Brutto</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{invoiceData.items?.map((row) => (
					<TableRow key={row.label}>
						<TableCell>{row.label}</TableCell>
						<TableCell className="text-right">{row.netValue}</TableCell>
						<TableCell className="text-right">{row.tax}</TableCell>
						<TableCell className="text-right">{row.value}</TableCell>
					</TableRow>
				))}
			</TableBody>
			<TableFooter>
				<TableRow className="font-normal">
					<TableCell colSpan={3} className="text-right">
						Summe Netto
					</TableCell>
					<TableCell className="text-right">
						{formatCurrency(invoiceData.netInvoiceAmount)}
					</TableCell>
				</TableRow>
				<TableRow className="font-bold">
					<TableCell colSpan={3} className="text-right">
						Gesamt
					</TableCell>
					<TableCell className="text-right">
						{formatCurrency(invoiceData.invoiceAmount)}
					</TableCell>
				</TableRow>
			</TableFooter>
		</Table>
	);
}

export default function Invoice({
	totalRevenue,
	ticketsCount,
	officialPos,
	revenuePerPos,
	eventTaxRate = 0,
	setupFee = 25,
	ticketCommissionRate = TICKET_COMMISSION_RATE,
	clients = [],
	eventStartDate,
}: {
	totalRevenue: number;
	ticketsCount: number;
	eventTaxRate?: number;
	setupFee?: number;
	ticketCommissionRate?: number;
	officialPos?: Set<string>;
	revenuePerPos?: Record<string, number>;
	clients?: Client[];
	eventStartDate?: string;
}): React.ReactNode {
	const router = useRouter();
	// Systemgebühr: 1€ pro verkauftem Ticket
	const systemFee = ticketsCount * 1;
	const systemFeeWithTax = systemFee * (1 + SALES_TAX_RATE);
	// Variable Vorverkaufsgebühr: 10% des Basispreis
	const variableFeeHelper =
		(totalRevenue - systemFeeWithTax) /
		(1 + ticketCommissionRate * (1 + Number(eventTaxRate)));
	const variableFeeWithTax =
		totalRevenue - systemFeeWithTax - variableFeeHelper;
	const variableFee = variableFeeWithTax / (1 + Number(eventTaxRate));
	// Einrichtungsgebühr: einmalig xx€
	const setupFeeWithTax = setupFee * (1 + SALES_TAX_RATE);
	// Brutto-Rechnungsbetrag (inkl. MwSt)
	const invoiceAmount = systemFeeWithTax + variableFeeWithTax + setupFeeWithTax;
	// Netto-Rechnungsbetrag (ohne MwSt)
	const netInvoiceAmount = systemFee + variableFee + setupFee;
	// Durch den Veranstalter über die eigene Kasse eingenommener Betrag
	const revenueOrganizer = revenuePerPos
		? Object.entries(revenuePerPos).reduce(
				(sum, [posId, revenue]) =>
					officialPos?.has(posId) || posId === "Online" ? sum : sum + revenue,
				0,
			)
		: 0;
	// Auszahlungsbetrag an den Veranstalter
	const payoutAmount = totalRevenue - invoiceAmount - revenueOrganizer;

	// Daten für die Darstellung der Rechnungsposten und der Erlöszusammensetzung
	const invoiceData = {
		items: [
			{
				label: "Systemgebühr",
				netValue: formatCurrency(systemFee),
				value: formatCurrency(systemFeeWithTax),
				tax: `${(SALES_TAX_RATE * 100).toFixed(0)}%`,
			},
			{
				label: "Vorverkaufsgebühr",
				netValue: formatCurrency(variableFee),
				value: formatCurrency(variableFeeWithTax),
				tax: `${(Number(eventTaxRate) * 100).toFixed(0)}%`,
			},
			{
				label: "Einrichtungsgebühr",
				netValue: formatCurrency(setupFee),
				value: formatCurrency(setupFeeWithTax),
				tax: `${(SALES_TAX_RATE * 100).toFixed(0)}%`,
			},
		],
		payoutItems: [
			{
				label: "Einnahmen über zünftick Online-Verkauf",
				value: revenuePerPos?.Online ?? 0,
				amount: revenuePerPos
					? formatCurrency(revenuePerPos.Online ?? 0)
					: null,
			},
			{
				label: "Einnahmen über zünftick Vorverkaufsstelle",
				value: revenuePerPos
					? Object.entries(revenuePerPos).reduce(
							(sum, [posId, revenue]) =>
								officialPos?.has(posId) && posId !== "Online"
									? sum + revenue
									: sum,
							0,
						)
					: 0,
				amount: revenuePerPos
					? formatCurrency(
							Object.entries(revenuePerPos).reduce(
								(sum, [posId, revenue]) =>
									officialPos?.has(posId) && posId !== "Online"
										? sum + revenue
										: sum,
								0,
							),
						)
					: null,
			},
			{
				label: "Einnahmen über die eigene Kasse des Veranstalters",
				value: revenueOrganizer,
				amount: formatCurrency(revenueOrganizer),
			},
		],
		totalRevenue,
		revenueOrganizer,
		netInvoiceAmount,
		invoiceAmount,
		payoutAmount,
	};

	const invoiceTextRef = useRef<HTMLDivElement>(null);
	const [copied, setCopied] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [selectedClientId, setSelectedClientId] = useState("");
	const [isCreating, setIsCreating] = useState(false);

	const formatIsoDate = (date: Date) => date.toISOString().split("T")[0];

	const handleCreateDraft = async () => {
		if (!selectedClientId) return;

		setIsCreating(true);
		try {
			const today = new Date();
			const dueDate = new Date(today);
			dueDate.setDate(dueDate.getDate() + 14);

			const result = await createInvoice({
				client_id: selectedClientId,
				payment_methods: { iban: "DE80100101236302300273" }, // Dummy IBAN, da für Drafts in Qonto keine Zahlung hinterlegt werden muss
				issue_date: formatIsoDate(today),
				due_date: formatIsoDate(dueDate),
				performance_start_date: eventStartDate?.split("T")[0],
				status: "draft",
				currency: "EUR",
				items: [
					{
						title: "Systemgebühr",
						quantity: "1",
						unit_price: {
							value: systemFee.toFixed(2),
							currency: "EUR",
						},
						vat_rate: SALES_TAX_RATE.toString(),
					},
					{
						title: "Vorverkaufsgebühr",
						quantity: "1",
						unit_price: {
							value: variableFee.toFixed(2),
							currency: "EUR",
						},
						vat_rate: Number(eventTaxRate).toString(),
					},
					{
						title: "Einrichtungsgebühr",
						quantity: "1",
						unit_price: {
							value: setupFee.toFixed(2),
							currency: "EUR",
						},
						vat_rate: SALES_TAX_RATE.toString(),
					},
				],
			});

			if (!result.success) {
				toast.error(result.error ?? "Rechnung konnte nicht erstellt werden");
				return;
			}

			toast.success("Rechnungsentwurf in Qonto erstellt");
			router.push("/banking/invoices");
		} catch (error) {
			toast.error("Ein unerwarteter Fehler ist aufgetreten");
			console.error(error);
		} finally {
			setIsCreating(false);
		}
	};

	const handleCopy = async () => {
		if (!invoiceTextRef.current) return;

		try {
			await navigator.clipboard.writeText(invoiceTextRef.current.outerHTML);
			setCopied(true);
			setShowTooltip(true);
			setTimeout(() => {
				setCopied(false);
				setShowTooltip(false);
			}, 2000);
		} catch (error) {
			console.error(error);
		}
	};

	return (
		<>
			<div className="my-4 space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
				<h3 className="font-semibold">Entwurf in Qonto erstellen</h3>
				{clients.length === 0 ? (
					<p className="text-muted-foreground text-sm">
						Keine Qonto-Kunden verfugbar.
					</p>
				) : (
					<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
						<div className="w-full sm:max-w-sm">
							<label htmlFor="qonto-client" className="mb-1 block text-sm">
								Kunde
							</label>
							<select
								id="qonto-client"
								value={selectedClientId}
								onChange={(event) => setSelectedClientId(event.target.value)}
								disabled={isCreating}
								className="block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
							>
								<option value="">Bitte Kunde auswahlen</option>
								{clients.map((client) => (
									<option key={client.id} value={client.id}>
										{client.name ||
											`${client.first_name ?? ""} ${client.last_name ?? ""}`.trim()}
									</option>
								))}
							</select>
						</div>
						<Button
							onClick={handleCreateDraft}
							disabled={isCreating || !selectedClientId}
						>
							{isCreating ? "Entwurf wird erstellt..." : "Entwurf erstellen"}
						</Button>
					</div>
				)}
			</div>
			<div>
				<h3 className="my-4 font-semibold">Rechnungsposten</h3>
				<div className="rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<InvoiceTable invoiceData={invoiceData} />
				</div>
			</div>
			<h3 className="my-6 font-semibold">Rechnung: Fußzeile</h3>
			<Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
				<TooltipTrigger
					render={
						<Button
							aria-label="Copy to clipboard"
							className="hover:cursor-pointer"
							onClick={handleCopy}
							variant="outline"
						>
							<Copy />
							Kopieren
						</Button>
					}
				/>
				<TooltipContent>{copied ? "Kopiert!" : "Kopieren"}</TooltipContent>
			</Tooltip>
			<div className="mt-6 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
				<div ref={invoiceTextRef}>
					<InvoiceTextTable invoiceData={invoiceData} />
				</div>
			</div>
		</>
	);
}

function InvoiceTextTable({ invoiceData }: { invoiceData: InvoiceData }) {
	return (
		<div style={{ fontSize: "14px" }}>
			<p style={{ fontSize: "14px", pageBreakAfter: "always" }}>
				Auf der folgenden Seite finden Sie eine Abrechnungsübersicht.
			</p>
			<p style={{ fontSize: "14px" }}>
				Die Einnahmen der Veranstaltung setzen sich zusammen aus:{" "}
			</p>
			<table style={{ width: "100%", borderCollapse: "collapse" }}>
				<thead>
					<tr>
						<th
							style={{ textAlign: "left", padding: "4px 0", minWidth: "500px" }}
						>
							Beschreibung
						</th>
						<th style={{ textAlign: "left", padding: "4px 0" }}>Betrag</th>
					</tr>
					<tr>
						<td colSpan={2} style={{ borderBottom: "1px solid #d3d3d3" }} />
					</tr>
				</thead>
				<tbody>
					{invoiceData.payoutItems.map(
						(item) =>
							item.value > 0 && (
								<tr key={item.label}>
									<td style={{ padding: "4px 0" }}>{item.label}</td>
									<td style={{ padding: "4px 0", textAlign: "right" }}>
										{item.amount}
									</td>
								</tr>
							),
					)}
					<tr>
						<td colSpan={2} style={{ borderBottom: "1px solid #d3d3d3" }} />
					</tr>
					<tr style={{ fontWeight: "bold" }}>
						<td
							style={{
								textAlign: "right",
								padding: "4px 0",
								paddingRight: "16px",
							}}
						>
							Gesamteinnahmen
						</td>
						<td style={{ padding: "4px 0", textAlign: "right" }}>
							{formatCurrency(invoiceData.totalRevenue)}
						</td>
					</tr>
					<tr>
						<td style={{ padding: "4px 0" }}>
							abzgl. Gebühren (Rechnungsbetrag)
						</td>
						<td style={{ padding: "4px 0", textAlign: "right" }}>
							{formatCurrency(invoiceData.invoiceAmount)}
						</td>
					</tr>
					{invoiceData.revenueOrganizer > 0 && (
						<tr>
							<td style={{ padding: "4px 0" }}>
								abzgl. Einnahmen über die eigene Kasse des Veranstalters
							</td>
							<td style={{ padding: "4px 0", textAlign: "right" }}>
								{formatCurrency(invoiceData.revenueOrganizer)}
							</td>
						</tr>
					)}
					<tr>
						<td colSpan={2} style={{ borderBottom: "1px solid #d3d3d3" }} />
					</tr>
					<tr style={{ fontWeight: "bold" }}>
						<td
							style={{
								textAlign: "right",
								padding: "4px 0",
								paddingRight: "16px",
							}}
						>
							Auszahlungsbetrag
						</td>
						<td style={{ padding: "4px 0", textAlign: "right" }}>
							{formatCurrency(invoiceData.payoutAmount)}
						</td>
					</tr>
				</tbody>
			</table>
			<br />
			<p style={{ fontSize: "14px" }}>
				Wir überweisen den Auszahlungsbetrag von{" "}
				{formatCurrency(invoiceData.payoutAmount)} auf Ihr Konto. Bitte nehmen
				Sie keine Überweisung vor, die obenstehende Rechnung muss nicht
				beglichen werden.
			</p>
		</div>
	);
}
