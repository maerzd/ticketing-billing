import { FileText, Send, Users } from "lucide-react";
import Link from "next/link";
import { QontoConnectCard } from "@/components/my-ui/qonto-connect-card";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { requiresQontoAuth } from "@/lib/qonto/auth-state";
import { queryOrganization } from "@/lib/qonto/queries";
import SalesDashboard from "./sales-dashboard";

export default async function Page() {
	const result = await queryOrganization();
	const showQontoLogin = !result.success && requiresQontoAuth(result.error);

	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
				<div className="flex items-center gap-2 px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator
						orientation="vertical"
						className="mr-2 data-[orientation=vertical]:h-4"
					/>
					<Breadcrumb>
						<BreadcrumbList>
							<BreadcrumbItem className="hidden md:block">
								<BreadcrumbLink href="#">Build Your Application</BreadcrumbLink>
							</BreadcrumbItem>
							<BreadcrumbSeparator className="hidden md:block" />
							<BreadcrumbItem>
								<BreadcrumbPage>Data Fetching</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<div className="space-y-8 p-8">
				{/* Organization Info */}
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Dashboard</h1>
					<p className="mt-2 text-slate-600">
						Willkommen im Abrechnungs-Portal
					</p>
				</div>
				<SalesDashboard />

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

					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Begünstigte
							</CardTitle>
							<CardDescription>SEPA-Begünstigte verwalten</CardDescription>
						</CardHeader>
						<CardContent>
							<Link href="/banking/beneficiaries">
								<Button variant="outline" className="w-full">
									Begünstigte anzeigen
								</Button>
							</Link>
						</CardContent>
					</Card>
				</div>
			</div>
		</>
	);
}
