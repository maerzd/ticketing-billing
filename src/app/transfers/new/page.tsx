import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { TransferForm } from "@/components/forms/TransferForm";
import { Button } from "@/components/ui/button";
import { queryBankAccounts, queryBeneficiaries } from "@/lib/qonto/queries";

export default async function NewTransferPage() {
	const beneficiariesResult = await queryBeneficiaries();
	const beneficiaries = beneficiariesResult.success
		? beneficiariesResult.data.beneficiaries
		: [];

	const bankAccountsResult = await queryBankAccounts();
	const bankAccounts = bankAccountsResult.success
		? bankAccountsResult.data.bank_accounts
		: [];

	return (
		<div className="space-y-8 p-8">
			{/* Header */}
			<div>
				<Link href="/transfers">
					<Button variant="ghost" size="sm" className="mb-4 gap-2">
						<ChevronLeft className="h-4 w-4" />
						Zurück zu Überweisungen
					</Button>
				</Link>
				<h1 className="font-bold text-3xl text-slate-900">Neue Überweisung</h1>
				<p className="mt-2 text-slate-600">
					Erstellen Sie eine neue SEPA-Überweisung an einen Begünstigten
				</p>
			</div>

			{beneficiariesResult.success === false && (
				<p className="text-red-700 text-sm">
					Abruf von Begünstigten fehlgeschlagen: {beneficiariesResult.error}
				</p>
			)}

			{/* Form */}
			<TransferForm beneficiaries={beneficiaries} bankAccounts={bankAccounts} />
		</div>
	);
}
