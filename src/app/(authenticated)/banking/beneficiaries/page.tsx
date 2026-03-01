import { BeneficiaryCreateDialog } from "@/components/forms/BeneficiaryCreateDialog";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbList,
	BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { queryBeneficiaries } from "@/lib/qonto/queries";
import { BeneficiariesManager } from "./BeneficiariesManager";

export default async function BeneficiariesPage() {
	const result = await queryBeneficiaries();
	const beneficiaries = result.success ? result.data.beneficiaries : [];
	const totalCount = result.success ? result.data.meta.total_count : 0;

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
							<BreadcrumbItem>
								<BreadcrumbPage>Begünstigte</BreadcrumbPage>
							</BreadcrumbItem>
						</BreadcrumbList>
					</Breadcrumb>
				</div>
			</header>
			<div className="space-y-8 p-8">
				<div>
					<h1 className="font-bold text-3xl text-slate-900">Begünstigte</h1>
					<p className="mt-2 text-slate-600">
						SEPA-Begünstigte verwalten und für automatisierte Überweisungen
						freigeben
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

				<BeneficiariesManager
					beneficiaries={beneficiaries}
					totalCount={totalCount}
				/>
			</div>
		</>
	);
}
