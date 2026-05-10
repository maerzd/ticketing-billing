"use client";
import type { BankAccount } from "@qonto/embed-sdk/types";
import type { VivenuEvent } from "@ticketing-billing/types";
import type {
	BillingRecord,
	OrganizerRecord,
} from "@ticketing-billing/types/ddb";
import { ChevronDown, Copy } from "lucide-react";
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
import {
	BILLING_SETUP_FEE_LABEL,
	BILLING_SYSTEM_FEE_LABEL,
	BILLING_VARIABLE_FEE_LABEL,
	SALES_TAX_RATE,
	TICKET_COMMISSION_RATE,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/utils";
import { BillingActionsCard } from "./billing-actions-card";
import { BillingDraftCard } from "./billing-draft-card";
import InvoiceFooter from "./invoice-footer";

export interface InvoiceData {
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
	setupFee = 2500,
	ticketCommissionRate = TICKET_COMMISSION_RATE,
	billingRecord: initialBillingRecord,
	bankAccounts,
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
	bankAccounts?: BankAccount[];
}): React.ReactNode {
	const invoiceTextRef = useRef<HTMLDivElement>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [copied, setCopied] = useState(false);
	const [showTooltip, setShowTooltip] = useState(false);
	const [billingRecord, setBillingRecord] = useState<BillingRecord | undefined>(
		initialBillingRecord,
	);
	const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
	const [footerOpen, setFooterOpen] = useState(false);

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
				label: BILLING_SYSTEM_FEE_LABEL,
				netValue: amounts.systemFeeNet,
				value: amounts.systemFeeWithTax,
				tax: SALES_TAX_RATE,
			},
			{
				label: BILLING_VARIABLE_FEE_LABEL,
				netValue: amounts.variableFeeNet,
				value: amounts.variableFeeWithTax,
				tax: eventTaxRate,
			},
			{
				label: BILLING_SETUP_FEE_LABEL,
				netValue: amounts.setupFeeNet,
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
				<BillingDraftCard
					organizer={organizer}
					organizerId={organizerId}
					billingRecord={billingRecord}
					isLoading={isLoading}
					onCreateDraft={handleCreateDraft}
					onUpdateDraft={handleUpdateDraft}
					onFinalizeInvoice={handleFinalizeInvoice}
				/>
			)}

			{/* OPEN / SENT / PAID: Actions section */}
			{isReadOnly && billingRecord && (
				<BillingActionsCard
					billingRecord={billingRecord}
					organizer={organizer}
					isLoading={isLoading}
					onSendEmail={handleSendEmail}
					onPayoutClick={() => setPayoutDialogOpen(true)}
				/>
			)}

			{/* Invoice Table */}
			<div className="mt-4">
				<p className="mb-2 text-muted-foreground text-xs font-medium uppercase tracking-wide">
					Rechnungsposten
				</p>
				<div className="overflow-hidden rounded-xl bg-muted/50 ring-1 ring-muted">
					<InvoiceTable invoiceData={invoiceData} />
				</div>
			</div>

			{/* Invoice footer — collapsed by default, always mounted for clipboard */}
			<div className="mt-6">
				<div className="flex items-center gap-3">
					<button
						type="button"
						onClick={() => setFooterOpen((v) => !v)}
						className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
					>
						<ChevronDown
							className={`h-4 w-4 transition-transform duration-200 ${footerOpen ? "rotate-180" : ""}`}
						/>
						Rechnung: Fußzeile
					</button>
					{!isReadOnly && (
						<Tooltip open={showTooltip} onOpenChange={setShowTooltip}>
							<TooltipTrigger
								render={
									<Button
										aria-label="Copy to clipboard"
										size="sm"
										className="hover:cursor-pointer"
										onClick={handleCopy}
										variant="outline"
									>
										<Copy className="h-3 w-3" />
										Kopieren
									</Button>
								}
							/>
							<TooltipContent>
								{copied ? "Kopiert!" : "Kopieren"}
							</TooltipContent>
						</Tooltip>
					)}
				</div>
				{/* Outer div hidden/shown via CSS — inner div with ref always stays mounted */}
				<div
					className={
						footerOpen
							? "mt-4 rounded-xl bg-muted/50 p-4 ring-1 ring-muted"
							: "hidden"
					}
				>
					<div ref={invoiceTextRef}>
						<InvoiceFooter invoiceData={invoiceData} />
					</div>
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
					bankAccounts={bankAccounts}
				/>
			)}
		</>
	);
}
