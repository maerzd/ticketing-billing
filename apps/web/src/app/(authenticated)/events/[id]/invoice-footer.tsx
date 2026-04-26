import { formatCurrency } from "@/lib/utils";
import type { InvoiceData } from "./invoice";

export default function InvoiceFooter({
	invoiceData,
}: {
	invoiceData: InvoiceData;
}) {
	return (
		<div style={{ fontSize: "14px" }}>
			<p style={{ fontSize: "14px", pageBreakAfter: "always" }}>
				Auf der folgenden Seite finden Sie eine Abrechnungsübersicht.
			</p>
			<p style={{ fontSize: "14px" }}>
				Die Einnahmen der Veranstaltung setzen sich zusammen aus:{" "}
			</p>
			<table
				style={{
					width: "100%",
					borderCollapse: "collapse",
					borderSpacing: "0",
				}}
			>
				<thead>
					<tr
						style={{
							fontWeight: "bold",
							backgroundColor: "#f0f0f0",
							border: "1pt solid #f0f0f0",
							borderCollapse: "collapse",
							borderSpacing: "0",
						}}
					>
						<td
							style={{
								textAlign: "left",
								padding: "0 4mm",
								verticalAlign: "top",
							}}
						>
							Beschreibung
						</td>
						<td
							style={{
								textAlign: "right",
								padding: "0 4mm",
								verticalAlign: "top",
							}}
						>
							Betrag
						</td>
					</tr>
				</thead>
				<tbody>
					{invoiceData.payoutItems.map(
						(item) =>
							item.value > 0 && (
								<tr key={item.label}>
									<td style={{ padding: "0 1mm", verticalAlign: "top" }}>
										{item.label}
									</td>
									<td
										style={{
											padding: "0 1mm",
											textAlign: "right",
											verticalAlign: "top",
										}}
									>
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
								padding: "0 1mm",
								verticalAlign: "top",
							}}
						>
							Gesamteinnahmen
						</td>
						<td
							style={{
								padding: "0 1mm",
								textAlign: "right",
								verticalAlign: "top",
							}}
						>
							{formatCurrency(invoiceData.totalRevenue)}
						</td>
					</tr>
					<tr>
						<td style={{ padding: "0 1mm", verticalAlign: "top" }}>
							abzgl. Gebühren (Rechnungsbetrag)
						</td>
						<td
							style={{
								padding: "0 1mm",
								textAlign: "right",
								verticalAlign: "top",
							}}
						>
							{formatCurrency(invoiceData.invoiceAmount)}
						</td>
					</tr>
					{invoiceData.revenueOrganizer > 0 && (
						<tr>
							<td style={{ padding: "0 1mm", verticalAlign: "top" }}>
								abzgl. Einnahmen über die eigene Kasse des Veranstalters
							</td>
							<td
								style={{
									padding: "0 1mm",
									textAlign: "right",
									verticalAlign: "top",
								}}
							>
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
								padding: "0 1mm",
								verticalAlign: "top",
							}}
						>
							Auszahlungsbetrag
						</td>
						<td
							style={{
								padding: "0 1mm",
								textAlign: "right",
								verticalAlign: "top",
							}}
						>
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
