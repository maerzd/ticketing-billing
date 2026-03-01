import { ShieldCheck } from "lucide-react";
import { BeneficiaryCreateDialog } from "@/components/forms/BeneficiaryCreateDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { queryBeneficiaries } from "@/lib/qonto/queries";
import { BeneficiariesManager } from "./BeneficiariesManager";

export default async function BeneficiariesPage() {
	const result = await queryBeneficiaries();
	const beneficiaries = result.success ? result.data.beneficiaries : [];
	const totalCount = result.success ? result.data.meta.total_count : 0;

	return (
		<div className="space-y-8 p-8">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Begünstigte</h1>
					<p className="mt-2 text-slate-600">
						SEPA-Begünstigte verwalten und für automatisierte Überweisungen
						freigeben
					</p>
				</div>
				<BeneficiaryCreateDialog />
			</div>

			{result.success === false && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-900">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-800">{result.error}</p>
					</CardContent>
				</Card>
			)}

			<BeneficiariesManager
				beneficiaries={beneficiaries}
				totalCount={totalCount}
			/>
		</div>
	);
}
