"use client";
import type { VivenuEvent } from "@ticketing-billing/types";
import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import { AlertCircle, CheckCircle2, Clock, Copy } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { toast } from "sonner";
import {
	createBillingDraft,
	finalizeBillingInvoice,
	sendBillingEmail,
	updateBillingDraft,
} from "@/actions/billing";
import { BillingPayoutDialog } from "@/components/forms/BillingPayoutDialog";
import { BillingStatusBadge } from "@/components/my-ui/billing-status-badge";
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
import { calculateBillingAmounts } from "@/lib/billing-calculator";
import { SALES_TAX_RATE, TICKET_COMMISSION_RATE } from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";

interface InvoiceData {
	items: {
		label: string;
		netValue: number;
		tax: number;
		value: number;
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
						<TableCell className="text-right">
							{formatCurrency(row.netValue)}
						</TableCell>
						<TableCell className="text-right">
							{(row.tax * 100).toFixed(0)} %
						</TableCell>
						<TableCell className="text-right">
							{formatCurrency(row.value)}
						</TableCell>
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
	event,
	totalRevenue,
	ticketsCount,
	organizer,
	officialPos,
	revenuePerPos,
	eventTaxRate = 0,
	setupFee = 25,
	ticketCommissionRate = TICKET_COMMISSION_RATE,
	billingRecord: initialBillingRecord,
}: {
	event: VivenuEvent;
	totalRevenue: number;
	ticketsCount: number;
	organizer: OrganizerRecord | null;
	eventTaxRate?: number;
	setupFee?: number;
	ticketCommissionRate?: number;
	officialPos?: Set<string>;
	revenuePerPos?: Record<string, number>;
	billingRecord?: BillingRecord;
}): React.ReactNode {
	const invoiceTextRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [billingRecord, setBillingRecord] = useState<BillingRecord | undefined>(
		initialBillingRecord,
	);
	const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);

	const resolvedOfficialPos = officialPos ?? new Set<string>();
	const resolvedRevenuePerPos = revenuePerPos ?? {};

	const amounts = calculateBillingAmounts({
		totalRevenue,
		ticketsCount,
		revenuePerPos: resolvedRevenuePerPos,
		officialPos: resolvedOfficialPos,
		eventTaxRate,
		setupFee,
		ticketCommissionRate,
	});

	const invoiceData = {
		items: [
			{
				label: "Systemgebühr",
				netValue: amounts.systemFee,
				value: amounts.systemFeeWithTax,
				tax: SALES_TAX_RATE,
			},
			{
				label: "Vorverkaufsgebühr",
				netValue: amounts.variableFee,
				value: amounts.variableFeeWithTax,
				tax: eventTaxRate,
			},
			{
				label: "Einrichtungsgebühr",
				netValue: setupFee,
				value: amounts.setupFeeWithTax,
				tax: SALES_TAX_RATE,
			},
		],
		payoutItems: [
			{
				label: "Einnahmen über zünftick Online-Verkauf",
				value: resolvedRevenuePerPos.Online ?? 0,
				amount: revenuePerPos
					? formatCurrency(resolvedRevenuePerPos.Online ?? 0)
					: null,
			},
			{
				label: "Einnahmen über zünftick Vorverkaufsstelle",
				value: revenuePerPos
					? Object.entries(resolvedRevenuePerPos).reduce(
							(sum, [posId, revenue]) =>
								resolvedOfficialPos.has(posId) && posId !== "Online"
									? sum + revenue
									: sum,
							0,
						)
					: 0,
				amount: revenuePerPos
					? formatCurrency(
							Object.entries(resolvedRevenuePerPos).reduce(
								(sum, [posId, revenue]) =>
									resolvedOfficialPos.has(posId) && posId !== "Online"
										? sum + revenue
										: sum,
								0,
							),
						)
					: null,
			},
			{
				label: "Einnahmen über die eigene Kasse des Veranstalters",
				value: amounts.revenueOrganizer,
				amount: formatCurrency(amounts.revenueOrganizer),
			},
		],
		totalRevenue,
		revenueOrganizer: amounts.revenueOrganizer,
		netInvoiceAmount: amounts.netInvoiceAmount,
		invoiceAmount: amounts.invoiceAmount,
		payoutAmount: amounts.payoutAmount,
	};

	const primaryContact = organizer?.contactPersons?.[0];
	const organizerId = event.attributes?.organizerid;
	const eventId = event._id;

	const buildDraftInput = () => {
		if (
			!organizer?.sevdeskContactId ||
			!organizerId ||
			!invoiceTextRef.current
		) {
			return null;
		}

		return {
			organizerId,
			eventId,
			eventName: event.name,
			organizerName:
				organizer.name ??
				[primaryContact?.firstName, primaryContact?.lastName]
					.filter(Boolean)
					.join(" ") ??
				"",
			organizerContactId: organizer.sevdeskContactId,
			organizerEmail: organizer.email,
			organizerAddressName: organizer.name,
			organizerAddressStreet: organizer.billingAddress?.street,
			organizerAddressZip: organizer.billingAddress?.zipCode,
			organizerAddressCity: organizer.billingAddress?.city,
			organizerAddressCountry: organizer.billingAddress?.country,
			totalRevenue,
			ticketsCount,
			revenuePerPos: resolvedRevenuePerPos,
			officialPos: Array.from(resolvedOfficialPos),
			eventTaxRate,
			setupFee,
			ticketCommissionRate,
			invoiceDate: new Date().toISOString().split("T")[0],
			invoiceFootHtml: invoiceTextRef.current.outerHTML,
		};
	};

	const handleCreateDraft = async () => {
		const draftInput = buildDraftInput();
		if (!draftInput) {
			toast.error(
				"Fehlende Daten: SevDesk Kontakt ID und Veranstalter-Zuordnung erforderlich.",
			);
			return;
		}

		setIsLoading(true);
		try {
			const result = await createBillingDraft(draftInput);

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			setBillingRecord(result.data);
			toast.success(
				`Rechnungsentwurf erstellt: ${result.data.sevdeskInvoiceNumber ?? result.data.sevdeskInvoiceId}`,
			);
		} catch (error) {
			toast.error(
				"Ein unerwarteter Fehler ist aufgetreten: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleUpdateDraft = async () => {
		if (
			!billingRecord ||
			!organizer?.sevdeskContactId ||
			!invoiceTextRef.current
		) {
			return;
		}

		setIsLoading(true);
		try {
			const result = await updateBillingDraft({
				organizerId: billingRecord.organizerId,
				eventId: billingRecord.eventId,
				organizerContactId: organizer.sevdeskContactId,
				organizerAddressName: organizer.name,
				organizerAddressStreet: organizer.billingAddress?.street,
				organizerAddressZip: organizer.billingAddress?.zipCode,
				organizerAddressCity: organizer.billingAddress?.city,
				organizerAddressCountry: organizer.billingAddress?.country,
				totalRevenue,
				ticketsCount,
				revenuePerPos: resolvedRevenuePerPos,
				officialPos: Array.from(resolvedOfficialPos),
				eventTaxRate,
				setupFee,
				ticketCommissionRate,
				invoiceDate: new Date().toISOString().split("T")[0],
				invoiceFootHtml: invoiceTextRef.current.outerHTML,
			});

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			setBillingRecord(result.data);
			toast.success("Entwurf aktualisiert.");
		} catch (error) {
			toast.error(
				"Fehler beim Aktualisieren: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleFinalizeInvoice = async () => {
		if (!billingRecord || !organizerId) return;

		setIsLoading(true);
		try {
			const result = await finalizeBillingInvoice(organizerId, eventId);

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			setBillingRecord(result.data);
			toast.success("Rechnung finalisiert.");
		} catch (error) {
			toast.error(
				"Fehler beim Finalisieren: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setIsLoading(false);
		}
	};

	const handleSendEmail = async () => {
		if (!billingRecord || !organizerId) return;

		const recipientEmail = primaryContact?.email ?? organizer?.email;
		if (!recipientEmail) {
			toast.error("Keine E-Mail-Adresse für den Veranstalter hinterlegt.");
			return;
		}

		setIsLoading(true);
		try {
			const result = await sendBillingEmail(
				organizerId,
				eventId,
				recipientEmail,
			);

			if (!result.success) {
				toast.error(result.error);
				return;
			}

			setBillingRecord(result.data);
			toast.success(`Rechnung per E-Mail gesendet an ${recipientEmail}.`);
		} catch (error) {
			toast.error(
				"Fehler beim E-Mail-Versand: " +
					(error instanceof Error ? error.message : "Unknown error"),
			);
		} finally {
			setIsLoading(false);
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

	const invoiceStatus = billingRecord?.invoiceStatus;
	const payoutStatus = billingRecord?.payoutStatus;
	const isReadOnly =
		invoiceStatus === "OPEN" ||
		invoiceStatus === "SENT" ||
		invoiceStatus === "PAID" ||
		invoiceStatus === "VOID";

	return (
		<>
			{/* Billing Status Header */}
			{billingRecord && (
				<div className="mb-4 flex items-center justify-between rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<div>
						<p className="font-medium text-sm">Abrechnungsstatus</p>
						{billingRecord.sevdeskInvoiceNumber && (
							<p className="text-muted-foreground text-xs">
								Rechnung {billingRecord.sevdeskInvoiceNumber}
							</p>
						)}
					</div>
					<BillingStatusBadge status={billingRecord.billingStatus} />
				</div>
			)}

			{/* DRAFT / NO RECORD: SevDesk create/update section */}
			{(!billingRecord || invoiceStatus === "DRAFT") && (
				<div className="my-4 space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<h3 className="font-semibold">
						{billingRecord
							? "Entwurf bearbeiten"
							: "Entwurf in Sevdesk erstellen"}
					</h3>
					{organizer === null || !organizerId ? (
						<p className="text-muted-foreground text-sm">
							{!organizerId ? (
								"Kein Veranstalter für diese Veranstaltung konfiguriert."
							) : (
								<>
									Kein Veranstalter gefunden.{" "}
									<Link href="/organizers" className="underline">
										Veranstalter anlegen
									</Link>
								</>
							)}
						</p>
					) : (
						<div className="flex flex-col gap-3 sm:flex-row sm:items-end">
							<div className="w-full sm:max-w-sm">
								<p className="font-medium text-sm">
									{organizer.name ??
										[primaryContact?.firstName, primaryContact?.lastName]
											.filter(Boolean)
											.join(" ")}
								</p>
								<p className="text-muted-foreground text-sm">
									{primaryContact?.email ?? organizer.email}
								</p>
							</div>
							<div className="flex gap-2">
								{billingRecord ? (
									<>
										<Button
											onClick={handleUpdateDraft}
											disabled={isLoading}
											variant="outline"
										>
											{isLoading ? "Wird aktualisiert..." : "Aktualisieren"}
										</Button>
										<Button
											onClick={handleFinalizeInvoice}
											disabled={isLoading}
										>
											{isLoading
												? "Wird finalisiert..."
												: "Rechnung finalisieren"}
										</Button>
									</>
								) : (
									<Button onClick={handleCreateDraft} disabled={isLoading}>
										{isLoading
											? "Entwurf wird erstellt..."
											: "Entwurf erstellen"}
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			)}

			{/* OPEN / SENT / PAID: Actions section */}
			{isReadOnly && (
				<div className="my-4 space-y-3 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<h3 className="font-semibold">Abrechnung</h3>
					<div className="flex flex-wrap gap-3">
						{invoiceStatus !== "VOID" && (
							<div className="flex flex-col gap-1">
								<Button
									onClick={handleSendEmail}
									disabled={isLoading || invoiceStatus === "SENT"}
									variant={invoiceStatus === "SENT" ? "outline" : "default"}
								>
									{invoiceStatus === "SENT" ? (
										<>
											<CheckCircle2 className="mr-2 h-4 w-4 text-green-600" />
											E-Mail gesendet
										</>
									) : isLoading ? (
										"Wird gesendet..."
									) : (
										"Rechnung per E-Mail senden"
									)}
								</Button>
								{billingRecord?.emailSentAt && (
									<p className="text-muted-foreground text-xs">
										{new Date(billingRecord.emailSentAt).toLocaleString(
											"de-DE",
										)}
									</p>
								)}
							</div>
						)}

						{payoutStatus === "PENDING" && organizer && (
							<Button
								onClick={() => setPayoutDialogOpen(true)}
								disabled={isLoading}
								variant="outline"
							>
								Auszahlung auslösen (
								{formatCurrency((billingRecord?.payoutAmountCents ?? 0) / 100)})
							</Button>
						)}

						{payoutStatus === "INITIATED" && (
							<div className="flex items-center gap-2 rounded-md bg-amber-50 px-3 py-2 text-amber-700 text-sm">
								<Clock className="h-4 w-4" />
								Auszahlung in Bearbeitung
								{billingRecord?.payoutInitiatedAt && (
									<span className="text-xs">
										(
										{new Date(billingRecord.payoutInitiatedAt).toLocaleString(
											"de-DE",
										)}
										)
									</span>
								)}
							</div>
						)}

						{payoutStatus === "COMPLETED" && (
							<div className="flex items-center gap-2 rounded-md bg-green-50 px-3 py-2 text-green-700 text-sm">
								<CheckCircle2 className="h-4 w-4" />
								Auszahlung abgeschlossen
								{billingRecord?.payoutCompletedAt && (
									<span className="text-xs">
										(
										{new Date(billingRecord.payoutCompletedAt).toLocaleString(
											"de-DE",
										)}
										)
									</span>
								)}
							</div>
						)}

						{payoutStatus === "FAILED" && (
							<div className="flex items-center gap-2 rounded-md bg-red-50 px-3 py-2 text-red-700 text-sm">
								<AlertCircle className="h-4 w-4" />
								Auszahlung fehlgeschlagen
							</div>
						)}
					</div>
				</div>
			)}

			{/* Invoice Table */}
			<div>
				<h3 className="my-4 font-semibold">Rechnungsposten</h3>
				<div className="rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
					<InvoiceTable invoiceData={invoiceData} />
				</div>
			</div>

			{/* Invoice footer */}
			<h3 className="my-6 font-semibold">Rechnung: Fußzeile</h3>
			{!isReadOnly && (
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
			)}
			<div className="mt-6 rounded-xl bg-muted/50 p-4 ring-1 ring-muted">
				<div ref={invoiceTextRef}>
					<InvoiceTextTable invoiceData={invoiceData} />
				</div>
			</div>

			{/* Payout dialog */}
			{organizer && billingRecord && (
				<BillingPayoutDialog
					open={payoutDialogOpen}
					onOpenChange={setPayoutDialogOpen}
					billingRecord={billingRecord}
					organizer={organizer}
					onSuccess={setBillingRecord}
				/>
			)}
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
						<th style={{ textAlign: "right", padding: "4px 0" }}>Betrag</th>
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
