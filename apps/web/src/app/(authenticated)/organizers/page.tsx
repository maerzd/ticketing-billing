import type { OrganizerRecord } from "@ticketing-billing/types";
import { OrganizersManager } from "@/app/(authenticated)/organizers/OrganizersManager";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizersService } from "@/lib/dynamodb/services/organizers";

const organizersService = new OrganizersService();

export default async function OrganizersPage() {
	let organizers: OrganizerRecord[] | null = null;
	let fetchError: string | undefined;

	try {
		organizers = await organizersService.listOrganizers();
	} catch (error) {
		fetchError =
			error instanceof Error ? error.message : "Failed to fetch organizers";
	}

	return (
		<div className="space-y-8">
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Veranstalter</h1>
				<p className="mt-2 text-slate-600">
					Veranstalter anzeigen, erstellen und bearbeiten
				</p>
			</div>

			{fetchError && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-900">Error</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-800">{fetchError}</p>
					</CardContent>
				</Card>
			)}

			{organizers && <OrganizersManager organizers={organizers} />}
		</div>
	);
}
