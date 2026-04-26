import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { isAuthenticated } from "@/lib/auth";
import { BeneficiariesManager } from "./BeneficiariesManager";

export default async function BeneficiariesPage() {
	const authenticated = await isAuthenticated();

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

			{authenticated && <BeneficiariesManager />}
		</div>
	);
}
