"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { Client } from "@/types/clients";

interface InvoiceFormProps {
	clients: Client[];
	onCancel?: () => void;
	onSuccess?: () => void;
}

export function InvoiceForm({
	clients,
	onCancel,
	onSuccess,
}: Readonly<InvoiceFormProps>) {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		client_id: "",
		amount_in_cents: 0,
		description: "",
		invoice_date: new Date().toISOString().split("T")[0],
		due_date: "",
	});

	const handleChange = (
		e: React.ChangeEvent<
			HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
		>,
	) => {
		const { name, value } = e.target;

		// if selecting client, store its id
		if (name === "client_id") {
			setFormData((prev) => ({
				...prev,
				client_id: value,
			}));
			return;
		}

		if (name === "amount_in_cents") {
			setFormData((prev) => ({
				...prev,
				[name]: Math.round(Number.parseFloat(value) * 100) || 0,
			}));
		} else {
			setFormData((prev) => ({
				...prev,
				[name]: value,
			}));
		}
	};

	const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
		e.preventDefault();
		setIsLoading(true);

		try {
			const result = await createInvoice({
				client_id: formData.client_id,
				due_date: formData.due_date,
				issue_date: formData.invoice_date,
				currency: "EUR",
				items: [
					{
						title: "Test item",
						description: formData.description,
						quantity: "1",
						unit_price: {
							value: (formData.amount_in_cents / 100).toFixed(2),
							currency: "EUR",
						},
						vat_rate: "0",
					},
				],
				payment_methods: {
					iban: "ES3968880001616147520404", // Dummy IBAN for testing
				},
				status: "draft",
			});
			if (result.success) {
				toast.success("Rechnung erfolgreich erstellt!");
				onSuccess?.();
				router.push("/invoices");
			} else {
				toast.error(`Erstellung der Rechnung fehlgeschlagen: ${result.error}`);
			}
		} catch (error) {
			toast.error("Ein unerwarteter Fehler ist aufgetreten");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{clients.length === 0 && (
				<p className="text-red-700 text-sm">Keine Kunden verfügbar.</p>
			)}
			<div>
				<Label htmlFor="client_id">Kunde</Label>
				<select
					id="client_id"
					name="client_id"
					required
					value={formData.client_id}
					onChange={handleChange}
					disabled={isLoading}
					className="mt-1 block w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
				>
					<option value="">Select client</option>
					{clients.map((c) => (
						<option key={c.id} value={c.id}>
							{c.name} {c.first_name} {c.last_name} ({c.email})
						</option>
					))}
				</select>
			</div>

			<div>
				<Label htmlFor="amount_in_cents">Betrag (EUR)</Label>
				<Input
					id="amount_in_cents"
					name="amount_in_cents"
					type="number"
					step="0.01"
					required
					value={formData.amount_in_cents / 100}
					onChange={handleChange}
					placeholder="0.00"
					disabled={isLoading}
				/>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				<div>
					<Label htmlFor="invoice_date">Rechnungsdatum</Label>
					<Input
						id="invoice_date"
						name="invoice_date"
						type="date"
						required
						value={formData.invoice_date}
						onChange={handleChange}
						disabled={isLoading}
					/>
				</div>

				<div>
					<Label htmlFor="due_date">Fälligkeitsdatum</Label>
					<Input
						id="due_date"
						name="due_date"
						type="date"
						required
						value={formData.due_date}
						onChange={handleChange}
						disabled={isLoading}
					/>
				</div>
			</div>

			<div className="flex gap-4">
				<Button type="submit" disabled={isLoading}>
					{isLoading ? "Erstelle..." : "Rechnung erstellen"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => (onCancel ? onCancel() : router.back())}
					disabled={isLoading}
				>
					Abbrechen
				</Button>
			</div>
		</form>
	);
}
