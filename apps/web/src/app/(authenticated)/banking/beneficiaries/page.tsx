import { beneficiaries } from "@qonto/embed-sdk/server/beneficiaries";
import type { Beneficiary } from "@qonto/embed-sdk/types";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { getAccessToken, isAuthenticated } from "@/lib/auth";
import { BeneficiariesManager } from "./BeneficiariesManager";

export default async function BeneficiariesPage() {
	const authenticated = await isAuthenticated();

	let initialBeneficiaries: Beneficiary[] = [];
	if (authenticated) {
		try {
			const accessToken = await getAccessToken();
			const result = await beneficiaries.getBeneficiaries({
				operationSettings: { accessToken },
			});
			initialBeneficiaries = result.beneficiaries;
		} catch {
			// Not authenticated or fetch failed — component will show empty state
		}
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Begünstigte</h1>
				<p className="mt-2 text-slate-600">
					SEPA-Begünstigte verwalten und für automatisierte Überweisungen
					freigeben
				</p>
			</div>

			{!authenticated && <QontoConnectCard />}

			{authenticated && (
				<BeneficiariesManager initialBeneficiaries={initialBeneficiaries} />
			)}
		</div>
	);
}
