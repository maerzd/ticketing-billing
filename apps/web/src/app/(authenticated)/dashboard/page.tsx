import { FileText, Send, Users } from "lucide-react";
import Link from "next/link";
import { qontoLogoutAction } from "@/actions/qonto-logout";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import { QontoErrorToast } from "@/components/my-ui/qonto-error-toast";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { requiresQontoAuth } from "@/lib/qonto/auth-state";
import { queryOrganization } from "@/lib/qonto/queries";
import SalesDashboard from "./sales-dashboard";

interface PageProps {
	searchParams: Promise<Record<string, string | undefined>>;
}

export default async function Page({ searchParams }: PageProps) {
	const params = await searchParams;
	const result = await queryOrganization();
	const showQontoLogin = !result.success && requiresQontoAuth(result.errorCode);

	return (
		<div className="space-y-8">
			<QontoErrorToast
				error={params.qonto_error}
				description={params.qonto_error_description}
			/>
			{/* Organization Info */}
			<div>
				<h1 className="font-bold text-3xl text-slate-900">Dashboard</h1>
				<p className="mt-2 text-slate-600">Willkommen im Abrechnungs-Portal</p>
			</div>
			<SalesDashboard />

			{/* Organization Details */}
			{result.success && result.data && (
				<Card className="bg-slate-50">
					<CardHeader className="flex flex-row items-start justify-between gap-4">
						<div>
							<CardTitle>Organisation</CardTitle>
							<CardDescription>Aktive Qonto Organisation</CardDescription>
						</div>
						<form action={qontoLogoutAction}>
							<Button type="submit" variant="outline">
								Qonto Logout
							</Button>
						</form>
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

			{showQontoLogin && <QontoConnectCard />}

			{result.success === false && !showQontoLogin && (
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
			<div className="grid gap-4 md:grid-cols-3">
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
						<Button
							render={<Link href="/invoices" />}
							nativeButton={false}
							variant="outline"
							className="w-full"
						>
							Rechnungen anzeigen
						</Button>
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
						<Button
							render={<Link href="/transfers" />}
							nativeButton={false}
							variant="outline"
							className="w-full"
						>
							Überweisungen anzeigen
						</Button>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Users className="h-5 w-5" />
							Begünstigte
						</CardTitle>
						<CardDescription>SEPA-Begünstigte verwalten</CardDescription>
					</CardHeader>
					<CardContent>
						<Button
							render={<Link href="/banking/beneficiaries" />}
							nativeButton={false}
							variant="outline"
							className="w-full"
						>
							Begünstigte anzeigen
						</Button>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
