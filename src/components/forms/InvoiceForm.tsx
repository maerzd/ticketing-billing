"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createInvoice } from "@/actions/invoices";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function InvoiceForm() {
	const router = useRouter();
	const [isLoading, setIsLoading] = useState(false);
	const [formData, setFormData] = useState({
		client_name: "",
		amount_in_cents: 0,
		description: "",
		invoice_date: new Date().toISOString().split("T")[0],
		due_date: "",
	});

	const handleChange = (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;

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
				client_name: formData.client_name,
				amount_in_cents: formData.amount_in_cents,
				description: formData.description,
				invoice_date: formData.invoice_date,
				due_date: formData.due_date || undefined,
				currency: "EUR",
			});

			if (result.success) {
				toast.success("Invoice created successfully!");
				router.push("/invoices");
			} else {
				toast.error(`Failed to create invoice: ${result.error}`);
			}
		} catch (error) {
			toast.error("An unexpected error occurred");
			console.error(error);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>Create Invoice</CardTitle>
				<CardDescription>Create a new client invoice in Qonto</CardDescription>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div>
						<Label htmlFor="client_name">Client Name</Label>
						<Input
							id="client_name"
							name="client_name"
							type="text"
							required
							value={formData.client_name}
							onChange={handleChange}
							placeholder="Enter client name"
							disabled={isLoading}
						/>
					</div>

					<div>
						<Label htmlFor="amount_in_cents">Amount (EUR)</Label>
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

					<div>
						<Label htmlFor="description">Description</Label>
						<textarea
							id="description"
							name="description"
							className="flex min-h-24 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:border-slate-950 focus:outline-none focus:ring-1 focus:ring-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
							required
							value={formData.description}
							onChange={handleChange}
							placeholder="Enter invoice description"
							disabled={isLoading}
						/>
					</div>

					<div className="grid gap-6 md:grid-cols-2">
						<div>
							<Label htmlFor="invoice_date">Invoice Date</Label>
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
							<Label htmlFor="due_date">Due Date (Optional)</Label>
							<Input
								id="due_date"
								name="due_date"
								type="date"
								value={formData.due_date}
								onChange={handleChange}
								disabled={isLoading}
							/>
						</div>
					</div>

					<div className="flex gap-4">
						<Button type="submit" disabled={isLoading}>
							{isLoading ? "Creating..." : "Create Invoice"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={() => router.back()}
							disabled={isLoading}
						>
							Cancel
						</Button>
					</div>
				</form>
			</CardContent>
		</Card>
	);
}
