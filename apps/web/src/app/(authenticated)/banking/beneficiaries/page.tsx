import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requiresQontoAuth } from "@/lib/qonto/auth-state";
import { queryBeneficiaries } from "@/lib/qonto/queries";
import { BeneficiariesManager } from "./BeneficiariesManager";

export default async function BeneficiariesPage() {
	const result = await queryBeneficiaries();
	const showQontoLogin = !result.success && requiresQontoAuth(result.errorCode);
	const beneficiaries = result.success ? result.data.beneficiaries : [];
	const totalCount = result.success ? result.data.meta.total_count : 0;

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Begünstigte</h1>
				<p className="mt-2 text-slate-600">
					SEPA-Begünstigte verwalten und für automatisierte Überweisungen
					freigeben
				</p>
			</div>

			{showQontoLogin && <QontoConnectCard />}

			{result.success === false && !showQontoLogin && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-900">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-800">{result.error}</p>
					</CardContent>
				</Card>
			)}

			{!showQontoLogin && (
				<BeneficiariesManager
					beneficiaries={beneficiaries}
					totalCount={totalCount}
				/>
			)}
		</div>
	);
}
