import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { AuthenticatedPageHeader } from "@/components/layout/page-header";
import { TableSkeleton } from "@/components/my-ui/table-skeleton";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BreadcrumbProvider } from "@/context/breadcrumb-context";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<SidebarProvider>
			<TooltipProvider>
				<BreadcrumbProvider>
					<AppSidebar />
					<SidebarInset>
						<AuthenticatedPageHeader />
						<Suspense
							fallback={
								<div className="p-8">
									<TableSkeleton rows={5} />
								</div>
							}
						>
							<div className="p-8">{children}</div>
						</Suspense>
						<Toaster />
					</SidebarInset>
				</BreadcrumbProvider>
			</TooltipProvider>
		</SidebarProvider>
	);
}
