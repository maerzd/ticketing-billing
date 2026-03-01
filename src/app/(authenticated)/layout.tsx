import { Suspense } from "react";
import { Toaster } from "sonner";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryOrganization } from "@/lib/qonto/queries";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	const organizationResult = await queryOrganization();
	const organization = organizationResult.success
		? organizationResult.data.organization
		: undefined;

	return (
		<SidebarProvider>
			<TooltipProvider>
				<AppSidebar organization={organization} />
				<SidebarInset>
					<Suspense fallback={<div className="p-8">Loading...</div>}>
						{children}
					</Suspense>
					<Toaster />
				</SidebarInset>
			</TooltipProvider>
		</SidebarProvider>
	);
}
