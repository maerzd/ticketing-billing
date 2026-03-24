import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requiresQontoAuth } from "@/lib/qonto/auth-state";
import { queryClients } from "@/lib/qonto/queries";
import { ClientsManager } from "./ClientsManager";

interface ClientsPageProps {
	searchParams?:
		| Promise<Record<string, string | string[] | undefined>>
		| Record<string, string | string[] | undefined>;
}

const getPage = (value?: string | string[]) => {
	const raw = Array.isArray(value) ? value[0] : value;
	const parsed = Number.parseInt(raw ?? "1", 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
	const params = searchParams ? await searchParams : undefined;
	const page = getPage(params?.page);
	const result = await queryClients(page);
	const showQontoLogin = !result.success && requiresQontoAuth(result.error);

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Kunden</h1>
				<p className="mt-2 text-slate-600">
					Qonto Kunden anzeigen, erstellen und bearbeiten
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

			{!showQontoLogin && result.success && (
				<ClientsManager clients={result.data.clients} meta={result.data.meta} />
			)}
		</div>
	);
}
