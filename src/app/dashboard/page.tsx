import { FileText, Send } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { queryOrganization } from "@/lib/qonto/queries";

export default async function DashboardPage() {
	const result = await queryOrganization();

	return (
		<div className="space-y-8 p-8">
			{/* Organization Info */}
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Dashboard</h1>
				<p className="mt-2 text-slate-600">Willkommen im Abrechnungs-Portal</p>
			</div>

			{/* Organization Details */}
			{result.success && result.data && (
				<Card className="bg-slate-50">
					<CardHeader>
						<CardTitle>Organisation</CardTitle>
						<CardDescription>Aktive Qonto Organisation</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid gap-4">
							<div>
								<p className="font-medium text-slate-600 text-sm">Name</p>
								<p className="text-lg text-slate-900">
									{result.data.organization.name}
								</p>
							</div>
							<div>
								<p className="font-medium text-slate-600 text-sm">Slug</p>
								<p className="text-lg text-slate-900">
									{result.data.organization.slug}
								</p>
							</div>
							<div>
								<p className="font-medium text-slate-600 text-sm">ID</p>
								<p className="font-mono text-lg text-slate-600">
									{result.data.organization.id}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			)}

			{result.success === false && (
				<Card className="border-red-200 bg-red-50">
					<CardHeader>
						<CardTitle className="text-red-900">Verbindungs-Fehler</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-red-800">{result.error}</p>
					</CardContent>
				</Card>
			)}

			{/* Quick Actions */}
			<div className="grid gap-4 md:grid-cols-2">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<FileText className="h-5 w-5" />
							Rechnungen
						</CardTitle>
						<CardDescription>
							Erstellen und Verwalten von Kundenrechnungen
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/invoices">
							<Button variant="outline" className="w-full">
								Rechnungen anzeigen
							</Button>
						</Link>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Send className="h-5 w-5" />
							Überweisungen
						</CardTitle>
						<CardDescription>SEPA-Überweisungen erstellen</CardDescription>
					</CardHeader>
					<CardContent>
						<Link href="/transfers">
							<Button variant="outline" className="w-full">
								Überweisungen anzeigen
							</Button>
						</Link>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
