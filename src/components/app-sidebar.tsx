"use client";

import {
	BanknoteArrowUp,
	FileText,
	LayoutDashboard,
	ShieldUser,
} from "lucide-react";
import type * as React from "react";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarRail,
} from "@/components/ui/sidebar";
import type { QontoOrganization } from "@/types/qonto/organization";

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
	organization?: QontoOrganization;
	user?: {
		name: string;
		email: string;
		avatar?: string;
	};
}

export function AppSidebar({
	organization,
	user,
	...props
}: Readonly<AppSidebarProps>) {
	// Navigation structure
	const navMain = [
		{
			title: "Dashboard",
			url: "/",
			icon: LayoutDashboard,
		},
		{
			title: "Invoices",
			url: "/invoices",
			icon: FileText,
		},
		{
			title: "Transfers",
			url: "/transfers",
			icon: BanknoteArrowUp,
		},
		{
			title: "Beneficiaries",
			url: "/banking/beneficiaries",
			icon: ShieldUser,
		},
	];

	return (
		<Sidebar collapsible="icon" {...props}>
			<SidebarContent>
				<NavMain items={navMain} />
			</SidebarContent>
			<SidebarFooter>
				<NavUser />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	);
}
