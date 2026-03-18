import { queryOrganizers } from "@/actions/organizers";
import { OrganizersManager } from "@/app/(authenticated)/organizers/OrganizersManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function OrganizersPage() {
	const result = await queryOrganizers();

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Veranstalter</h1>
				<p className="mt-2 text-slate-600">
					Veranstalter anzeigen, erstellen und bearbeiten
				</p>
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

			{result.success && <OrganizersManager organizers={result.data} />}
		</div>
	);
}
