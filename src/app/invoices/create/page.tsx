import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { InvoiceForm } from "@/components/forms/InvoiceForm";
import { Button } from "@/components/ui/button";

export default function CreateInvoicePage() {
	return (
		<div className="space-y-8 p-8">
			{/* Header */}
			<div>
				<Link href="/invoices">
					<Button variant="ghost" size="sm" className="mb-4 gap-2">
						<ChevronLeft className="h-4 w-4" />
						Zurück zu Rechnungen
					</Button>
				</Link>
				<h1 className="font-bold text-3xl text-slate-900">
					Rechnung erstellen
				</h1>
				<p className="mt-2 text-slate-600">
					Erstellen Sie eine neue Kundenrechnung in Qonto
				</p>
			</div>

			{/* Form */}
			<InvoiceForm />
		</div>
	);
}
